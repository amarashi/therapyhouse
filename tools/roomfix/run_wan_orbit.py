"""Generate an orbiting sweep of a room with Wan 2.2, via ComfyUI.

An alternative to repairing the reprojected frames: instead of rendering an
arc geometrically and patching the holes it leaves, let a video model shoot
the whole sweep. Video models are trained for temporal coherence, so the
frames agree with each other by construction and there are no holes to fill.

The trade is that the motion is generated rather than computed, so it will not
match the camera maths in rooms.json. Hotspots positioned by projection.focal
and depth.png will not line up and have to be re-authored.

    uv run --with requests run_wan_orbit.py consulting-room
    uv run --with requests run_wan_orbit.py consulting-room --length 33 --steps 30

Needs Wan 2.2 5B TI2V, umt5_xxl and wan2.2_vae in the ComfyUI model folders.
"""

import argparse
import json
import shutil
import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOMS_DIR = Path(r"C:\dev\web\therapyhouse\assets\rooms")
COMFY_INPUT = Path(r"C:\dev\ai-ml\comfy-install\ComfyUI\input")
COMFY_OUT = Path(r"C:\dev\ai-ml\comfy-install\outputs")
OUT_DIR = Path(__file__).resolve().parent / "wan"

MODEL = "wan2.2_ti2v_5B_fp16.safetensors"
CLIP = "umt5_xxl_fp8_e4m3fn_scaled.safetensors"
VAE = "wan2.2_vae.safetensors"

# The room must not change, only the viewpoint. Naming the stillness explicitly
# matters: left alone, video models animate interiors -- curtains stir, plants
# sway, light flickers -- and any of that ruins a scrub-through sweep.
POSITIVE = (
    "A slow, smooth horizontal camera orbit moving {direction} around a still "
    "interior room. The camera glides steadily sideways revealing parallax "
    "between foreground and background. Everything in the room is completely "
    "static and unchanged: furniture, plants, books and decorations do not "
    "move, deform or change shape. Photorealistic, sharp focus, consistent "
    "lighting throughout."
)
NEGATIVE = (
    "camera shake, jump cut, zoom, rotation, tilt, people, moving objects, "
    "swaying plants, flickering light, morphing, warping, melting, changing "
    "furniture, text, watermark, blurry, low quality, distorted geometry"
)


def build_prompt(image_name, width, height, length, steps, cfg, shift, seed, direction):
    return {
        "1": {"class_type": "UNETLoader",
              "inputs": {"unet_name": MODEL, "weight_dtype": "default"}},
        "2": {"class_type": "ModelSamplingSD3",
              "inputs": {"model": ["1", 0], "shift": shift}},
        "3": {"class_type": "CLIPLoader",
              "inputs": {"clip_name": CLIP, "type": "wan"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": VAE}},
        "5": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "6": {"class_type": "CLIPTextEncode",
              "inputs": {"clip": ["3", 0],
                         "text": POSITIVE.format(direction=direction)}},
        "7": {"class_type": "CLIPTextEncode",
              "inputs": {"clip": ["3", 0], "text": NEGATIVE}},
        "8": {"class_type": "Wan22ImageToVideoLatent",
              "inputs": {"vae": ["4", 0], "width": width, "height": height,
                         "length": length, "batch_size": 1,
                         "start_image": ["5", 0]}},
        "9": {"class_type": "KSampler",
              "inputs": {"model": ["2", 0], "positive": ["6", 0],
                         "negative": ["7", 0], "latent_image": ["8", 0],
                         "seed": seed, "steps": steps, "cfg": cfg,
                         "sampler_name": "uni_pc", "scheduler": "simple",
                         "denoise": 1.0}},
        "10": {"class_type": "VAEDecode",
               "inputs": {"samples": ["9", 0], "vae": ["4", 0]}},
        "11": {"class_type": "SaveImage",
               "inputs": {"images": ["10", 0], "filename_prefix": "wan_orbit/f"}},
    }


def submit_and_wait(prompt, timeout=3600):
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
        time.sleep(3)
    raise SystemExit(f"Timed out after {timeout}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("room")
    ap.add_argument("--length", type=int, default=49,
                    help="Frames to generate. Wan needs 4n+1 (49, 45, 33, ...).")
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=704)
    ap.add_argument("--steps", type=int, default=30)
    ap.add_argument("--cfg", type=float, default=5.0)
    ap.add_argument("--shift", type=float, default=8.0)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--direction", default="to the right",
                    choices=["to the right", "to the left"])
    args = ap.parse_args()

    if (args.length - 1) % 4:
        raise SystemExit(f"--length must be 4n+1, got {args.length}")

    source = ROOMS_DIR / f"{args.room}.webp"
    if not source.exists():
        raise SystemExit(f"No source image at {source}")

    # LoadImage only reads from ComfyUI's input folder.
    staged = COMFY_INPUT / f"roomfix_{args.room}.png"
    from PIL import Image
    Image.open(source).convert("RGB").save(staged)

    started = time.time()
    record = submit_and_wait(build_prompt(
        staged.name, args.width, args.height, args.length,
        args.steps, args.cfg, args.shift, args.seed, args.direction))

    dest = OUT_DIR / args.room
    dest.mkdir(parents=True, exist_ok=True)
    for stale in dest.glob("*.png"):
        stale.unlink()

    images = [img for out in record.get("outputs", {}).values()
              for img in out.get("images", [])]
    pad = len(str(len(images) - 1))
    for i, img in enumerate(images):
        shutil.copy2(COMFY_OUT / img.get("subfolder", "") / img["filename"],
                     dest / f"{i:0{pad}d}.png")

    print(f"{args.room}: {len(images)} frames in {time.time() - started:.0f}s -> {dest}")


if __name__ == "__main__":
    main()
