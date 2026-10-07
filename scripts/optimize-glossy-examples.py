"""Create compact documentation GIFs with adaptive palettes (requires Pillow)."""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageSequence

assets = Path(__file__).resolve().parents[1] / "docs" / "examples" / "glossy"
manifest = json.loads((assets / "manifest.json").read_text())
for example in manifest["examples"]:
    target = assets / f"{example['id']}.gif"
    with Image.open(target) as source:
        frames = [frame.convert("RGB") for frame in ImageSequence.Iterator(source)]
        duration = source.info.get("duration", 100)
    raw = assets.parents[2] / "dist" / "glossy-frames" / example["id"]
    frame_paths = sorted(raw.glob("*.png"))
    if frame_paths:
        assert len(frame_paths) == manifest["format"]["gif"]["frames"], "Missing rendered frames"
        frames = []
        for frame_path in frame_paths:
            with Image.open(frame_path) as frame:
                frames.append(frame.convert("RGB"))
    # Adaptive palettes preserve smooth vinyl gradients better than the export palette.
    palette_frames = [frame.quantize(colors=256, dither=Image.Dither.NONE) for frame in frames]
    temporary = target.with_suffix(".optimized.gif")
    try:
        palette_frames[0].save(temporary, save_all=True, append_images=palette_frames[1:],
                               duration=duration, loop=0, disposal=2, optimize=True)
        with Image.open(temporary) as optimized:
            assert optimized.n_frames == len(frames), "Frame count changed"
            for original, compressed in zip(palette_frames, ImageSequence.Iterator(optimized)):
                assert ImageChops.difference(original.convert("RGB"), compressed.convert("RGB")).getbbox() is None, "Pixels changed"
        temporary.replace(target)
        print(f"Compressed {example['name']}: {target.stat().st_size:,} bytes")
    finally:
        temporary.unlink(missing_ok=True)
