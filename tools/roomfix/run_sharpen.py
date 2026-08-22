"""Restore and upscale a generated sweep with SeedVR2, via ComfyUI.

Wan generates at 832x480, which is well under the 1600 the site ships, and the
frames come out soft -- shelf figurines arrive as blobs and book spines as
smears. SeedVR2 resolves them and upscales in one pass.

It attends across the frame batch rather than treating each frame alone, which
matters here: the frames are scrubbed by hand, so per-frame sharpening would
resolve the same detail slightly differently each time and read as boiling.

Note it still raises frame-to-frame difference (13.1 -> 15.1 measured), because
detail that was previously blurred into agreement now resolves. That is inherent
to sharpening a sweep, not a fault of the batching.

    uv run --with requests run_sharpen.py                 # every room
    uv run --with requests run_sharpen.py consulting-room

Needs seedvr2_ema_3b_fp8 and ema_vae_fp16 in models/SEEDVR2.
"""

import argparse
import shutil
import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
WAN_DIR = Path(__file__).resolve().parent / "wan"
COMFY_OUT = Path(r"C:\dev\ai-ml\comfy-install\outputs")

# Short edge target. 924 against a 832x480 source lands at ~1600 wide, so the
# delivery width comes straight out of the model instead of being Lanczos'd up.
RESOLUTION = 924


def build_prompt(src_dir, prefix, resolution, batch_size, overlap):
    return {
        "1": {"class_type": "VHS_LoadImagesPath",
              "inputs": {"directory": str(src_dir)}},
        "2": {"class_type": "SeedVR2LoadDiTModel",
              "inputs": {"model": "seedvr2_ema_3b_fp8_e4m3fn.safetensors",
                         "device": "cuda:0", "blocks_to_swap": 16,
                         "swap_io_components": False, "offload_device": "cpu",
                         "cache_model": False, "attention_mode": "sdpa"}},
        "3": {"class_type": "SeedVR2LoadVAEModel",
              "inputs": {"model": "ema_vae_fp16.safetensors", "device": "cuda:0",
                         "encode_tiled": True, "encode_tile_size": 1024,
                         "encode_tile_overlap": 128, "decode_tiled": True,
                         "decode_tile_size": 1024, "decode_tile_overlap": 128,
                         "tile_debug": "false"}},
        "4": {"class_type": "SeedVR2VideoUpscaler",
              "inputs": {"image": ["1", 0], "dit": ["2", 0], "vae": ["3", 0],
                         "seed": 42, "resolution": resolution, "max_resolution": 0,
                         "batch_size": batch_size, "uniform_batch_size": True,
                         "temporal_overlap": overlap, "prepend_frames": 0,
                         "color_correction": "lab", "input_noise_scale": 0.0,
                         "latent_noise_scale": 0.0, "offload_device": "cpu",
                         "enable_debug": False}},
        "5": {"class_type": "SaveImage",
              "inputs": {"images": ["4", 0], "filename_prefix": prefix}},
    }


def submit_and_wait(prompt, timeout=7200):
    resp = requests.post(f"{SERVER}/prompt", json={"prompt": prompt}, timeout=60)
    resp.raise_for_status()
    body = resp.json()
    if body.get("node_errors"):
        raise SystemExit(f"ComfyUI rejected the graph: {body['node_errors']}")
    prompt_id = body["prompt_id"]

    deadline = time.time() + timeout
    while time.time() < deadline:
        record = requests.get(f"{SERVER}/history/{prompt_id}", timeout=30).json().get(prompt_id)
        if record:
            status = record.get("status", {})
            if status.get("status_str") == "error":
                raise SystemExit(f"ComfyUI failed: {status.get('messages')}")
            if status.get("completed"):
                return record
        time.sleep(10)
    raise SystemExit(f"Timed out after {timeout}s")


def process(room, resolution, batch_size, overlap):
    src = WAN_DIR / f"{room}-orbit"
    if not src.is_dir():
        print(f"{room}: no {src.name}, skipping")
        return
    n_in = len(list(src.glob("*.png")))

    started = time.time()
    record = submit_and_wait(build_prompt(src, f"sharp_{room}/f", resolution,
                                          batch_size, overlap))

    dest = WAN_DIR / f"{room}-sharp"
    dest.mkdir(parents=True, exist_ok=True)
    for stale in dest.glob("*.png"):
        stale.unlink()

    images = [img for out in record.get("outputs", {}).values()
              for img in out.get("images", [])]
    if len(images) != n_in:
        raise SystemExit(f"{room}: got {len(images)} frames from {n_in} inputs")

    pad = len(str(max(len(images) - 1, 1)))
    for i, img in enumerate(images):
        shutil.copy2(COMFY_OUT / img.get("subfolder", "") / img["filename"],
                     dest / f"{i:0{pad}d}.png")

    from PIL import Image
    size = Image.open(dest / f"{0:0{pad}d}.png").size
    print(f"{room}: {len(images)} frames -> {size[0]}x{size[1]}, "
          f"{time.time() - started:.0f}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rooms", nargs="*")
    ap.add_argument("--resolution", type=int, default=RESOLUTION)
    ap.add_argument("--batch-size", type=int, default=9,
                    help="Frames attended together. Must be 4n+1.")
    ap.add_argument("--overlap", type=int, default=4,
                    help="Frames shared between batches, to blend the seams.")
    args = ap.parse_args()

    if (args.batch_size - 1) % 4:
        raise SystemExit(f"--batch-size must be 4n+1, got {args.batch_size}")

    rooms = args.rooms or sorted(
        p.name[:-6] for p in WAN_DIR.glob("*-orbit") if p.is_dir())
    for room in rooms:
        process(room, args.resolution, args.batch_size, args.overlap)


if __name__ == "__main__":
    main()
