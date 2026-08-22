"""Repaint each room's disocclusion holes with LaMa, via ComfyUI.

render_frames.py --export-masks leaves, per room, the unfilled frames and the
mask of what needs repainting. This submits those to ComfyUI and collects the
results into work/<room>/fixed/ for pack_webp.py.

Why this rather than the renderer's own fill: cv2.INPAINT_TELEA only propagates
edge colour inwards, so it can continue a flat wall but smears anything with
structure into a halo. LaMa reconstructs it. Only masked pixels change; the
rest of the frame is returned bit-identical.

    uv run --with requests run_roomfix.py --list
    uv run --with requests run_roomfix.py consulting-room
    uv run --with requests run_roomfix.py --upscale        # + SeedVR2 detail pass

Needs ComfyUI running with comfyui-inpaint-nodes, VideoHelperSuite and the
roomfix_nodes folder installed, and big-lama.pt in models/inpaint.
"""

import argparse
import json
import shutil
import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
WORK_DIR = Path(__file__).resolve().parent / "work"
COMFY_OUT = Path(r"C:\dev\ai-ml\comfy-install\outputs")

# LaMa is fully convolutional, so this is a working resolution rather than a
# model limit. At or above the frame's long edge the fill is never resampled;
# well below it (the vendor node hardcodes 256) thin slivers wash out to grey.
LAMA_SIZE = 1600


def build_prompt(room, raw_dir, mask_dir, upscale):
    prompt = {
        "1": {"class_type": "VHS_LoadImagesPath",
              "inputs": {"directory": str(raw_dir)}},
        "2": {"class_type": "VHS_LoadImagesPath",
              "inputs": {"directory": str(mask_dir)}},
        "3": {"class_type": "ImageToMask",
              "inputs": {"image": ["2", 0], "channel": "red"}},
        "4": {"class_type": "INPAINT_LoadInpaintModel",
              "inputs": {"model_name": "big-lama.pt"}},
        "5": {"class_type": "RoomfixInpaintAtResolution",
              "inputs": {"inpaint_model": ["4", 0], "image": ["1", 0],
                         "mask": ["3", 0], "size": LAMA_SIZE, "seed": 0}},
    }
    tail = "5"

    if upscale:
        # SeedVR2 attends across the frame batch, so the sweep stays consistent
        # instead of each frame being sharpened its own way.
        prompt["6"] = {"class_type": "SeedVR2LoadDiTModel",
                       "inputs": {"model": "seedvr2_ema_3b_fp8_e4m3fn.safetensors",
                                  "device": "cuda:0", "blocks_to_swap": 16,
                                  "swap_io_components": False, "offload_device": "cpu",
                                  "cache_model": False, "attention_mode": "sdpa"}}
        prompt["7"] = {"class_type": "SeedVR2LoadVAEModel",
                       "inputs": {"model": "ema_vae_fp16.safetensors", "device": "cuda:0",
                                  "encode_tiled": True, "encode_tile_size": 1024,
                                  "encode_tile_overlap": 128, "decode_tiled": True,
                                  "decode_tile_size": 1024, "decode_tile_overlap": 128,
                                  "tile_debug": "false"}}
        prompt["8"] = {"class_type": "SeedVR2VideoUpscaler",
                       "inputs": {"image": ["5", 0], "dit": ["6", 0], "vae": ["7", 0],
                                  "seed": 42, "resolution": 1080, "max_resolution": 0,
                                  "batch_size": 9, "uniform_batch_size": True,
                                  "temporal_overlap": 4, "prepend_frames": 0,
                                  "color_correction": "lab", "input_noise_scale": 0.0,
                                  "latent_noise_scale": 0.0, "offload_device": "cpu",
                                  "enable_debug": False}}
        tail = "8"

    prompt["99"] = {"class_type": "SaveImage",
                    "inputs": {"images": [tail, 0],
                               "filename_prefix": f"roomfix/{room}/f"}}
    return prompt


def submit_and_wait(prompt, timeout=3600):
    resp = requests.post(f"{SERVER}/prompt", json={"prompt": prompt}, timeout=60)
    resp.raise_for_status()
    body = resp.json()
    if body.get("node_errors"):
        raise SystemExit(f"ComfyUI rejected the graph: {body['node_errors']}")
    prompt_id = body["prompt_id"]

    deadline = time.time() + timeout
    while time.time() < deadline:
        history = requests.get(f"{SERVER}/history/{prompt_id}", timeout=30).json()
        record = history.get(prompt_id)
        if record:
            status = record.get("status", {})
            if status.get("status_str") == "error":
                raise SystemExit(f"ComfyUI failed: {status.get('messages')}")
            if status.get("completed"):
                return record
        time.sleep(2)
    raise SystemExit(f"Timed out after {timeout}s waiting for {prompt_id}")


def collect(record, dest, pad):
    dest.mkdir(parents=True, exist_ok=True)
    for stale in dest.glob("*.png"):
        stale.unlink()

    images = [img for out in record.get("outputs", {}).values()
              for img in out.get("images", [])]
    if not images:
        raise SystemExit("Run completed but produced no images")

    for i, img in enumerate(images):
        src = COMFY_OUT / img.get("subfolder", "") / img["filename"]
        shutil.copy2(src, dest / f"{i:0{pad}d}.png")
    return len(images)


def process(room, upscale):
    raw_dir = WORK_DIR / room / "raw"
    mask_dir = WORK_DIR / room / "mask"
    if not raw_dir.is_dir() or not mask_dir.is_dir():
        print(f"{room}: no raw/ and mask/ in {WORK_DIR / room}, skipping")
        return

    n_raw = len(list(raw_dir.glob("*.png")))
    n_mask = len(list(mask_dir.glob("*.png")))
    if n_raw != n_mask:
        raise SystemExit(f"{room}: {n_raw} frames but {n_mask} masks")

    pad = len(str(n_raw - 1))
    started = time.time()
    record = submit_and_wait(build_prompt(room, raw_dir, mask_dir, upscale))
    count = collect(record, WORK_DIR / room / "fixed", pad)
    print(f"{room}: {count} frames repainted in {time.time() - started:.1f}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rooms", nargs="*")
    ap.add_argument("--upscale", action="store_true",
                    help="Add a SeedVR2 detail pass after the repaint.")
    ap.add_argument("--list", action="store_true", help="Show what is ready to run.")
    args = ap.parse_args()

    if not WORK_DIR.is_dir():
        raise SystemExit(f"No work dir at {WORK_DIR}. Run render_frames.py "
                         f"--export-masks {WORK_DIR} first.")

    rooms = args.rooms or sorted(p.name for p in WORK_DIR.iterdir() if p.is_dir())
    if args.list:
        for room in rooms:
            raw = WORK_DIR / room / "raw"
            fixed = WORK_DIR / room / "fixed"
            print(f"{room:<24} raw={len(list(raw.glob('*.png'))) if raw.is_dir() else 0:>3}"
                  f"  fixed={len(list(fixed.glob('*.png'))) if fixed.is_dir() else 0:>3}")
        return

    for room in rooms:
        process(room, args.upscale)


if __name__ == "__main__":
    main()
