"""Orbit a room with Wan 2.2 Fun Camera Control, via ComfyUI.

run_wan_orbit.py asks for camera movement in the prompt, and Wan 2.2 5B obliges
in the loosest sense: asking harder bought 5x the travel but flattened the
parallax to zero, i.e. it slid the picture sideways instead of moving a camera.
Prompts buy travel or depth, not both.

This drives the camera with an explicit pose and speed instead, which is what
Fun Camera Control is trained on. The 14B model comes in two halves -- a
high-noise model that sets composition and motion in the early steps, and a
low-noise one that resolves detail -- so sampling is split across both.

    uv run --with requests,pillow run_wan_camera.py consulting-room
    uv run --with requests,pillow run_wan_camera.py consulting-room --speed 0.6 --length 33

Neither half fits alongside the other in 16GB, so ComfyUI swaps them between
stages. Expect the swap to dominate the runtime.
"""

import argparse
import shutil
import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOMS_DIR = Path(r"C:\dev\web\therapyhouse\assets\rooms")
COMFY_INPUT = Path(r"C:\dev\ai-ml\comfy-install\ComfyUI\input")
COMFY_OUT = Path(r"C:\dev\ai-ml\comfy-install\outputs")
OUT_DIR = Path(__file__).resolve().parent / "wan"

HIGH = "wan2.2_fun_camera_high_noise_14B_fp8_scaled.safetensors"
LOW = "wan2.2_fun_camera_low_noise_14B_fp8_scaled.safetensors"
CLIP = "umt5_xxl_fp8_e4m3fn_scaled.safetensors"
CLIP_VISION = "clip_vision_h.safetensors"
VAE = "wan_2.1_vae.safetensors"

# The camera is driven by camera_pose, so the prompt only has to hold the room
# still. Video models animate interiors unprompted -- curtains stir, plants
# sway -- and any of that ruins a sweep the visitor scrubs through by hand.
POSITIVE = (
    "A still, empty interior room. Everything is completely static and "
    "unchanged: furniture, plants, books and decorations do not move, deform "
    "or change shape. Photorealistic, sharp focus, consistent warm lighting."
)
NEGATIVE = (
    "people, moving objects, swaying plants, flickering light, morphing, "
    "warping, melting, changing furniture, text, watermark, blurry, "
    "low quality, distorted geometry"
)


def build_prompt(image_name, sweep_degrees, distance, width, height, length, steps, cfg, shift, seed):
    split = steps // 2
    return {
        "1": {"class_type": "UNETLoader",
              "inputs": {"unet_name": HIGH, "weight_dtype": "default"}},
        "2": {"class_type": "UNETLoader",
              "inputs": {"unet_name": LOW, "weight_dtype": "default"}},
        "3": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": shift}},
        "4": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["2", 0], "shift": shift}},
        "5": {"class_type": "CLIPLoader", "inputs": {"clip_name": CLIP, "type": "wan"}},
        "6": {"class_type": "VAELoader", "inputs": {"vae_name": VAE}},
        "7": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "8": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["5", 0], "text": POSITIVE}},
        "9": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["5", 0], "text": NEGATIVE}},
        "10": {"class_type": "RoomfixOrbitCamera",
               "inputs": {"sweep_degrees": sweep_degrees, "distance": distance,
                          "width": width, "height": height, "length": length}},
        # Without CLIP Vision the model only sees the start frame through the
        # VAE latent, and drifts off the room almost immediately -- frame 0
        # alone came back at 17.2 mean absolute error against the source.
        "16": {"class_type": "CLIPVisionLoader",
               "inputs": {"clip_name": CLIP_VISION}},
        "17": {"class_type": "CLIPVisionEncode",
               "inputs": {"clip_vision": ["16", 0], "image": ["7", 0],
                          "crop": "center"}},
        "11": {"class_type": "WanCameraImageToVideo",
               "inputs": {"positive": ["8", 0], "negative": ["9", 0], "vae": ["6", 0],
                          "width": width, "height": height, "length": length,
                          "batch_size": 1, "start_image": ["7", 0],
                          "camera_conditions": ["10", 0],
                          "clip_vision_output": ["17", 0]}},
        # High-noise half sets the motion, then hands over its leftover noise.
        "12": {"class_type": "KSamplerAdvanced",
               "inputs": {"model": ["3", 0], "positive": ["11", 0], "negative": ["11", 1],
                          "latent_image": ["11", 2], "add_noise": "enable",
                          "noise_seed": seed, "steps": steps, "cfg": cfg,
                          "sampler_name": "uni_pc", "scheduler": "simple",
                          "start_at_step": 0, "end_at_step": split,
                          "return_with_leftover_noise": "enable"}},
        "13": {"class_type": "KSamplerAdvanced",
               "inputs": {"model": ["4", 0], "positive": ["11", 0], "negative": ["11", 1],
                          "latent_image": ["12", 0], "add_noise": "disable",
                          "noise_seed": seed, "steps": steps, "cfg": cfg,
                          "sampler_name": "uni_pc", "scheduler": "simple",
                          "start_at_step": split, "end_at_step": 10000,
                          "return_with_leftover_noise": "disable"}},
        "14": {"class_type": "VAEDecode", "inputs": {"samples": ["13", 0], "vae": ["6", 0]}},
        "15": {"class_type": "SaveImage",
               "inputs": {"images": ["14", 0], "filename_prefix": "wan_camera/f"}},
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
    ap.add_argument("--degrees", type=float, default=15.0,
                    help="Half-arc. Two passes are run (+n and -n) and joined so the "
                         "source image lands in the middle, as centreIndex expects.")
    ap.add_argument("--distance", type=float, default=1.5,
                    help="Distance to the orbit target. Larger = gentler arc.")
    ap.add_argument("--length", type=int, default=33, help="Frames, must be 4n+1")
    ap.add_argument("--width", type=int, default=832)
    ap.add_argument("--height", type=int, default=480)
    ap.add_argument("--steps", type=int, default=20)
    ap.add_argument("--cfg", type=float, default=5.0)
    ap.add_argument("--shift", type=float, default=8.0)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--tag", default="camera", help="Subfolder suffix for the output")
    ap.add_argument("--single", action="store_true",
                    help="One pass sweeping --degrees from the source view, which sits "
                         "at frame 0. Without this, two passes are joined so the source "
                         "sits at the centre instead.")
    args = ap.parse_args()

    if (args.length - 1) % 4:
        raise SystemExit(f"--length must be 4n+1, got {args.length}")

    source = ROOMS_DIR / f"{args.room}.webp"
    if not source.exists():
        raise SystemExit(f"No source image at {source}")

    from PIL import Image
    staged = COMFY_INPUT / f"roomfix_{args.room}.png"
    Image.open(source).convert("RGB").save(staged)

    dest = OUT_DIR / f"{args.room}-{args.tag}"
    dest.mkdir(parents=True, exist_ok=True)
    for stale in dest.glob("*.png"):
        stale.unlink()

    started = time.time()

    if args.single:
        record = submit_and_wait(build_prompt(
            staged.name, args.degrees, args.distance, args.width, args.height,
            args.length, args.steps, args.cfg, args.shift, args.seed))
        ordered = [img for out in record.get("outputs", {}).values()
                   for img in out.get("images", [])]
    else:
        # Two passes out from the source, then the negative one reversed in
        # front, so the untouched input view sits at the centre of the sweep.
        half = (args.length + 1) // 2      # each pass includes the centre frame
        halves = {}
        for direction in (-1, +1):
            record = submit_and_wait(build_prompt(
                staged.name, direction * args.degrees, args.distance,
                args.width, args.height, half,
                args.steps, args.cfg, args.shift, args.seed))
            halves[direction] = [img for out in record.get("outputs", {}).values()
                                 for img in out.get("images", [])]
            print(f"  {direction:+d}{args.degrees:g}deg pass: {len(halves[direction])} frames")
        ordered = list(reversed(halves[-1])) + halves[+1][1:]
    pad = len(str(max(len(ordered) - 1, 1)))
    for i, img in enumerate(ordered):
        shutil.copy2(COMFY_OUT / img.get("subfolder", "") / img["filename"],
                     dest / f"{i:0{pad}d}.png")
    images = ordered

    shape = (f"{args.degrees:g}deg from frame 0" if args.single
             else f"+/-{args.degrees:g}deg, centre={len(images)//2}")
    print(f"{args.room}: {len(images)} frames, {shape} (d={args.distance}), "
          f"{time.time() - started:.0f}s -> {dest}")


if __name__ == "__main__":
    main()
