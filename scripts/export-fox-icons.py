"""Deterministic size/format exports of the owner-selected and generated branding.

Requires Pillow. Does not generate or redraw art; source generation is documented
in store-assets/fox-selected/README.md. Run from any working directory.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import math

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "store-assets" / "fox-selected"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
PURPLE = "#792dd7"

def opaque_export(source, size):
    art = ImageOps.contain(source.convert("RGBA"), size, Image.Resampling.LANCZOS)
    result = Image.new("RGB", size, PURPLE)
    result.paste(art, ((size[0] - art.width) // 2, (size[1] - art.height) // 2), art)
    return result

source = Image.open(SOURCES / "approved-source.png")
icon = opaque_export(source, (512, 512))
icon.save(ROOT / "store-assets" / "app-icon-512.png", optimize=True)
icon.save(ROOT / "assets" / "app-icon-fox-512.png", optimize=True)
icon.resize((192, 192), Image.Resampling.LANCZOS).save(ROOT / "assets" / "app-icon-fox-192.png", optimize=True)

foreground = Image.open(SOURCES / "adaptive-foreground.png").convert("RGBA")
assert foreground.getchannel("A").getextrema()[0] == 0, "Foreground must have generated transparency"
foreground = foreground.crop(foreground.getchannel("A").getbbox())
# Fit all meaningful generated pixels inside Android's central 66dp safe circle.
# The extra dp absorbs integer rounding at lower densities.
alpha = foreground.getchannel("A")
radius = max(math.hypot(x - foreground.width / 2, y - foreground.height / 2)
             for y in range(foreground.height) for x in range(foreground.width)
             if alpha.getpixel((x, y)) > 8)

for density, scale in [("mdpi", 1), ("hdpi", 1.5), ("xhdpi", 2), ("xxhdpi", 3), ("xxxhdpi", 4)]:
    folder = RES / ("mipmap-" + density)
    size = round(108 * scale)
    factor = 32 * scale / radius
    art = foreground.resize((round(foreground.width * factor), round(foreground.height * factor)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size))
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    canvas.save(folder / "ic_launcher_foreground.png", optimize=True)
    # Legacy launcher sizes. Round variants keep the whole emblem inside the mask.
    legacy_size = round(48 * scale)
    icon.resize((legacy_size, legacy_size), Image.Resampling.LANCZOS).save(folder / "ic_launcher.png", optimize=True)
    round_canvas = Image.new("RGBA", (size, size), PURPLE)
    round_canvas.alpha_composite(canvas)
    mask = Image.new("L", (size, size)); ImageDraw.Draw(mask).ellipse((18 * scale, 18 * scale, 90 * scale, 90 * scale), fill=255)
    round_canvas.putalpha(mask)
    round_canvas.crop((round(18 * scale), round(18 * scale), round(90 * scale), round(90 * scale))).resize((legacy_size, legacy_size), Image.Resampling.LANCZOS).save(folder / "ic_launcher_round.png", optimize=True)

icon.save(RES / "drawable-nodpi" / "game_logo.png", optimize=True)
feature = Image.open(SOURCES / "feature-source.png")
opaque_export(feature, (1024, 500)).save(ROOT / "store-assets" / "feature-graphic-1024x500.png", optimize=True)
print("Exported Play 512px icon, 1024×500 feature graphic, web icons and Android launcher densities.")
