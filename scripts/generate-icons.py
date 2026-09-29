"""Regenerate the checked-in home-screen icons (optional; requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent / "public"
scale = 4
image = Image.new("RGB", (512 * scale, 512 * scale), "#151a18")
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((65 * scale, 65 * scale, 447 * scale, 447 * scale), radius=85 * scale,
                       fill="#1f2920", outline="#4b593f", width=3 * scale)
points = [(279, 111), (152, 278), (250, 278), (234, 401), (375, 214), (269, 214)]
draw.polygon([(x * scale, y * scale) for x, y in points], fill="#d5eea3")
for size in (192, 512):
    image.resize((size, size), Image.Resampling.LANCZOS).save(root / f"icon-{size}.png")
