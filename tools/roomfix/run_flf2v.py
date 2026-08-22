"""Interpolate a room sweep between two fixed endpoints, via ComfyUI.

The other runners generate forward from a single image and drift: with only the
start anchored, frame 32 came back at 48 mean absolute error against the source
while frame 0 was at 21. Pinning both ends removes the freedom to wander -- the
model has to arrive at the last frame.

Endpoints come from render_frames.py at -/+ the arc, so both are the same room
seen from geometrically exact angles. That matters more than endpoint polish: if
the two ends disagree about the room, first-last-frame models morph between them
rather than moving a camera, and melting objects look far worse than drift.

    uv run --with requests,pillow run_flf2v.py consulting-room
    uv run --with requests,pillow run_flf2v.py consulting-room --arc 15 --length 33

Expects render_frames.py --export-masks output plus the LaMa pass, so the
endpoints are already hole-free. Needs wan2.1_flf2v_720p_14B.
"""

import argparse
import shutil
import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
COMFY_INPUT = Path(r"C:\dev\ai-ml\comfy-install\ComfyUI\input")
COMFY_OUT = Path(r"C:\dev\ai-ml\comfy-install\outputs")
OUT_DIR = Path(__file__).resolve().parent / "wan"

MODEL = "wan2.1_flf2v_720p_14B_fp8_e4m3fn.safetensors"
CLIP = "umt5_xxl_fp8_e4m3fn_scaled.safetensors"
CLIP_VISION = "clip_vision_h.safetensors"
VAE = "wan_2.1_vae.safetensors"

# Both ends are pinned, so the prompt only has to stop the room animating.
POSITIVE = (
    "A still interior room. The camera arcs smoothly and steadily from the first "
    "view to the last, revealing parallax between foreground and background. "
    "Everything in the room is completely static and unchanged: furniture, plants, "
    "books and decorations do not move, deform or change shape. Photorealistic, "
    "sharp focus, consistent lighting."
)
NEGATIVE = (
    "morphing, melting, warping, objects appearing or disappearing, changing "
    "furniture, duplicated objects, people, moving objects, swaying plants, "
    "flickering light, text, watermark, blurry, low quality, distorted geometry"
)


def build_prompt(start_name, end_name, width, height, length, steps, cfg, shift, seed):
    return {
        "1": {"class_type": "UNETLoader",
              "inputs": {"unet_name": MODEL, "weight_dtype": "default"}},
        "2": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": shift}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": CLIP, "type": "wan"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": VAE}},
        "5": {"class_type": "LoadImage", "inputs": {"image": start_name}},
        "6": {"class_type": "LoadImage", "inputs": {"image": end_name}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": POSITIVE}},
        "8": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": NEGATIVE}},
        "9": {"class_type": "CLIPVisionLoader", "inputs": {"clip_name": CLIP_VISION}},
        "10": {"class_type": "CLIPVisionEncode",
               "inputs": {"clip_vision": ["9", 0], "image": ["5", 0], "crop": "center"}},
        "11": {"class_type": "CLIPVisionEncode",
               "inputs": {"clip_vision": ["9", 0], "image": ["6", 0], "crop": "center"}},
        "12": {"class_type": "WanFirstLastFrameToVideo",
               "inputs": {"positive": ["7", 0], "negative": ["8", 0], "vae": ["4", 0],
                          "width": width, "height": height, "length": length,
                          "batch_size": 1,
                          "start_image": ["5", 0], "end_image": ["6", 0],
                          "clip_vision_start_image": ["10", 0],
                          "clip_vision_end_image": ["11", 0]}},
        "13": {"class_type": "KSampler",
               "inputs": {"model": ["2", 0], "positive": ["12", 0], "negative": ["12", 1],
                          "latent_image": ["12", 2], "seed": seed, "steps": steps,
                          "cfg": cfg, "sampler_name": "uni_pc", "scheduler": "simple",
                          "denoise": 1.0}},
        "14": {"class_type": "VAEDecode", "inputs": {"samples": ["13", 0], "vae": ["4", 0]}},
        "15": {"class_type": "SaveImage",
               "inputs": {"images": ["14", 0], "filename_prefix": "flf2v/f"}},
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
        time.sleep(5)
    raise SystemExit(f"Timed out after {timeout}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("room")
    ap.add_argument("--endpoints", type=Path,
                    default=Path(__file__).resolve().parent / "wan" / "arc15-lama",
                    help="Folder of geometric frames; first and last are used.")
    ap.add_argument("--length", type=int, default=33, help="Frames, must be 4n+1")
    ap.add_argument("--width", type=int, default=832)
    ap.add_argument("--height", type=int, default=480)
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--cfg", type=float, default=5.0)
    ap.add_argument("--shift", type=float, default=8.0)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--tag", default="flf2v")
    args = ap.parse_args()

    if (args.length - 1) % 4:
        raise SystemExit(f"--length must be 4n+1, got {args.length}")

    frames = sorted(args.endpoints.glob("*.png"))
    if len(frames) < 2:
        raise SystemExit(f"Need at least two frames in {args.endpoints}")

    from PIL import Image
    names = []
    for label, path in (("start", frames[0]), ("end", frames[-1])):
        name = f"flf_{args.room}_{label}.png"
        Image.open(path).convert("RGB").resize(
            (args.width, args.height), Image.LANCZOS).save(COMFY_INPUT / name)
        names.append(name)

    started = time.time()
    record = submit_and_wait(build_prompt(
        names[0], names[1], args.width, args.height, args.length,
        args.steps, args.cfg, args.shift, args.seed))

    dest = OUT_DIR / f"{args.room}-{args.tag}"
    dest.mkdir(parents=True, exist_ok=True)
    for stale in dest.glob("*.png"):
        stale.unlink()

    images = [img for out in record.get("outputs", {}).values()
              for img in out.get("images", [])]
    pad = len(str(max(len(images) - 1, 1)))
    for i, img in enumerate(images):
        shutil.copy2(COMFY_OUT / img.get("subfolder", "") / img["filename"],
                     dest / f"{i:0{pad}d}.png")

    print(f"{args.room}: {len(images)} frames between "
          f"{frames[0].name} and {frames[-1].name}, "
          f"{time.time() - started:.0f}s -> {dest}")


if __name__ == "__main__":
    main()
