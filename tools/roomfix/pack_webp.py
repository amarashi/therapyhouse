"""Pack cleaned frames back into the web assets as WebP.

Takes the frames ComfyUI wrote out at render geometry, applies the same crop
and resize render_frames.py would have applied, and writes d-XX.webp /
m-XX.webp into assets/rooms/<room>/.

The crop matters: frames are exported before cropping so the inpainting pass
works at render geometry, which leaves the crop to --cover as the last thing
that happens to a frame, exactly as in the renderer. Skipping it here would
ship a wider field of view than rooms.json describes and the hotspots would
sit in the wrong places.

Nothing is written until every frame of a room converts, so a failed run
cannot leave a room half old and half new.

    uv run --with pillow pack_webp.py --dry-run
    uv run --with pillow pack_webp.py consulting-room
"""

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image

ROOMS_DIR = Path(r"C:\dev\web\therapyhouse\public\assets\rooms")
WORK_DIR = Path(r"C:\dev\web\therapyhouse\tools\roomfix\work")
BACKUP_DIR = Path(r"C:\dev\web\therapyhouse\tools\roomfix\_original_frames")

METHOD = 6


def room_spec(room_id):
    """Crop and width settings this room was rendered with."""
    manifest = json.loads((ROOMS_DIR / "rooms.json").read_text(encoding="utf-8"))
    for room in manifest["rooms"]:
        if room["id"] == room_id:
            return room
    raise SystemExit(f"{room_id} is not in rooms.json")


def crop_and_resize(img, cover, width):
    """Trim to the safe part of the reconstruction cone, then size for the web."""
    keep_w, keep_h = round(img.width * cover), round(img.height * cover)
    x0, y0 = (img.width - keep_w) // 2, (img.height - keep_h) // 2
    cropped = img.crop((x0, y0, x0 + keep_w, y0 + keep_h))
    height = round(cropped.height * width / cropped.width)
    return cropped.resize((width, height), Image.LANCZOS)


def pack_room(room_id, dry_run, quality, mobile_quality):
    src = WORK_DIR / room_id / "fixed"
    frames = sorted(src.glob("*.png"))
    if not frames:
        print(f"{room_id}: no cleaned frames in {src}, skipping")
        return

    spec = room_spec(room_id)
    cover = spec["projection"]["cover"]
    expected = spec["frames"]["count"]
    pad = spec["frames"]["pad"]
    if len(frames) != expected:
        raise SystemExit(
            f"{room_id}: {len(frames)} cleaned frames but rooms.json expects "
            f"{expected}. Re-render and re-run rather than shipping a mismatch."
        )

    tiers = [("d", spec["frames"]["desktop"]["width"], quality)]
    if "mobile" in spec["frames"]:
        tiers.append(("m", spec["frames"]["mobile"]["width"], mobile_quality))

    staging = WORK_DIR / room_id / "_packed"
    staging.mkdir(parents=True, exist_ok=True)
    written = []
    for i, frame in enumerate(frames):
        img = Image.open(frame).convert("RGB")
        for prefix, width, q in tiers:
            out = staging / f"{prefix}-{i:0{pad}d}.webp"
            crop_and_resize(img, cover, width).save(out, "WEBP", quality=q, method=METHOD)
            written.append(out)

    totals = {p: sum(f.stat().st_size for f in written if f.name.startswith(f"{p}-"))
              for p, _, _ in tiers}
    summary = "  ".join(f"{p}={totals[p] / 1024 / 1024:.2f}MB" for p, _, _ in tiers)
    print(f"{room_id}: {len(frames)} frames  {summary}")

    if dry_run:
        for f in written:
            f.unlink()
        return

    backup = BACKUP_DIR / room_id
    if not backup.exists():
        backup.mkdir(parents=True)
        for old in sorted(ROOMS_DIR.glob(f"{room_id}/[dm]-*.webp")):
            shutil.copy2(old, backup / old.name)
        print(f"{room_id}: originals backed up -> {backup}")

    for f in written:
        shutil.move(str(f), ROOMS_DIR / room_id / f.name)
    print(f"{room_id}: written into {ROOMS_DIR / room_id}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rooms", nargs="*")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--quality", type=int, default=80, help="Desktop WebP quality")
    ap.add_argument("--mobile-quality", type=int, default=72)
    args = ap.parse_args()

    rooms = args.rooms or sorted(p.name for p in WORK_DIR.iterdir() if p.is_dir())
    for room in rooms:
        pack_room(room, args.dry_run, args.quality, args.mobile_quality)


if __name__ == "__main__":
    main()
