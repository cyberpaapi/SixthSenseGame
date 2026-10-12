"""Format/size export only: preserve the owner's selected fox artwork."""
from pathlib import Path
from PIL import Image, ImageOps
import json
root = Path(__file__).resolve().parent.parent
art = Image.open(root / "store-assets/fox-selected/approved-source.png").convert("RGBA")
art = ImageOps.contain(art, (1024, 1024), Image.Resampling.LANCZOS)
icon = Image.new("RGB", (1024, 1024), "#792dd7")
icon.paste(art, ((1024-art.width)//2, (1024-art.height)//2), art)
directory = root / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
icon.save(directory / "AppIcon-512@2x.png", optimize=True)
(directory / "Contents.json").write_text(json.dumps({"images": [{"filename": "AppIcon-512@2x.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}], "info": {"author": "xcode", "version": 1}}, indent=2)+"\n")
print("Exported opaque 1024px selected-fox iOS icon.")
