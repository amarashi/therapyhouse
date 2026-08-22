"""Pack the sharpened orbit sweeps into the web assets and update rooms.json.

Counterpart to pack_webp.py, which packs the geometric renderer's output. These
frames never went through render_frames.py, so the differences matter:

  - no --cover crop. That trims the reconstruction cone, and there is no cone
    here. The frames are cropped only to restore the delivery aspect ratio,
    because SeedVR2 returns 1600x924 against the site's 1600x898.
  - centreIndex 0. The sweep travels one way from the source view rather than
    sitting in the middle of an arc.
  - the projection block is dropped. It describes render_frames.py's camera,
    which did not produce these frames; leaving it would have the viewer's
    hotspot solver compute confident, wrong positions. Absent, trackPoint()
    returns null and markers hold still, which is the honest failure.

    uv run --with pillow pack_orbit.py --dry-run
    uv run --with pillow pack_orbit.py
"""

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image

ROOMS_DIR = Path(r"C:\dev\web\therapyhouse\public\assets\rooms")
WAN_DIR = Path(__file__).resolve().parent / "wan"
BACKUP_DIR = Path(r"C:\dev\web\therapyhouse\tools\roomfix\_original_frames")

ARC_DEGREES = 30.0          # what run_wan_camera.py was given
METHOD = 6


def to_delivery(img, aspect, width, quality, path):
    """Crop to the shipped aspect, resize to a delivery width, write WebP."""
    target_h = round(img.width / aspect)
    if target_h < img.height:
        y0 = (img.height - target_h) // 2
        img = img.crop((0, y0, img.width, y0 + target_h))
    height = round(img.height * width / img.width)
    img.resize((width, height), Image.LANCZOS).save(
        path, "WEBP", quality=quality, method=METHOD)


def pack_room(room, entry, dry_run, quality, mobile_quality):
    src = WAN_DIR / f"{room}-sharp"
    frames = sorted(src.glob("*.png"))
    if not frames:
        print(f"{room}: no sharpened frames in {src.name}, skipping")
        return None

    # Keep whatever aspect the room already ships at, so page layout is untouched.
    desktop_w = entry["frames"]["desktop"]["width"]
    old = sorted(ROOMS_DIR.glob(f"{room}/d-*.webp"))
    aspect = (Image.open(old[0]).width / Image.open(old[0]).height) if old else 16 / 9

    tiers = [("d", desktop_w, quality)]
    if "mobile" in entry["frames"]:
        tiers.append(("m", entry["frames"]["mobile"]["width"], mobile_quality))

    pad = len(str(len(frames) - 1))
    staging = src / "_packed"
    staging.mkdir(exist_ok=True)
    written = []
    for i, frame in enumerate(frames):
        img = Image.open(frame).convert("RGB")
        for prefix, width, q in tiers:
            out = staging / f"{prefix}-{i:0{pad}d}.webp"
            to_delivery(img, aspect, width, q, out)
            written.append(out)

    totals = {p: sum(f.stat().st_size for f in written if f.name.startswith(f"{p}-"))
              for p, _, _ in tiers}
    print(f"{room}: {len(frames)} frames  " +
          "  ".join(f"{p}={totals[p] / 1024 / 1024:.2f}MB" for p, _, _ in tiers))

    if dry_run:
        for f in written:
            f.unlink()
        staging.rmdir()
        return None

    backup = BACKUP_DIR / room
    if not backup.exists():
        backup.mkdir(parents=True)
        for f in sorted(ROOMS_DIR.glob(f"{room}/[dm]-*.webp")):
            shutil.copy2(f, backup / f.name)
        print(f"{room}: originals backed up -> {backup}")

    # Frame counts change, so clear the old set rather than leaving orphans
    # from a longer sweep behind.
    for f in sorted(ROOMS_DIR.glob(f"{room}/[dm]-*.webp")):
        f.unlink()
    for f in written:
        shutil.move(str(f), ROOMS_DIR / room / f.name)
    staging.rmdir()

    frames_block = {
        "count": len(frames),
        "arcDegrees": ARC_DEGREES,
        "stepDegrees": round(ARC_DEGREES / max(len(frames) - 1, 1), 4),
        "centreIndex": 0,
        "pad": pad,
        "desktop": {"pattern": f"{room}/d-{{i}}.webp", "width": desktop_w,
                    "bytes": totals["d"],
                    "sizeMB": round(totals["d"] / 1024 / 1024, 2)},
    }
    if "m" in totals:
        frames_block["mobile"] = {
            "pattern": f"{room}/m-{{i}}.webp",
            "width": entry["frames"]["mobile"]["width"],
            "bytes": totals["m"],
            "sizeMB": round(totals["m"] / 1024 / 1024, 2)}
    return frames_block


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rooms", nargs="*")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--quality", type=int, default=80)
    ap.add_argument("--mobile-quality", type=int, default=72)
    args = ap.parse_args()

    manifest_path = ROOMS_DIR / "rooms.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    by_id = {r["id"]: r for r in manifest["rooms"]}

    rooms = args.rooms or sorted(p.name[:-6] for p in WAN_DIR.glob("*-sharp") if p.is_dir())
    changed = False
    for room in rooms:
        entry = by_id.get(room)
        if entry is None:
            print(f"{room}: not in rooms.json, skipping")
            continue
        block = pack_room(room, entry, args.dry_run, args.quality, args.mobile_quality)
        if block:
            entry["frames"] = block
            entry["generator"] = "wan2.2_fun_camera + seedvr2"
            entry.pop("projection", None)
            changed = True

    if changed:
        manifest["generator"] = "run_wan_camera.py + run_sharpen.py"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(f"\nrewrote {manifest_path}")
        print("  projection dropped: hotspots will hold still instead of "
              "tracking, until they are re-authored")


if __name__ == "__main__":
    main()
