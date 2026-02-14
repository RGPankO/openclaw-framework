#!/usr/bin/env python3
"""Generate BOT badge color variants."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = Path(__file__).parent.parent / "assets"

TARGETS = {
    "red": (229, 57, 53),
    "black": (0, 0, 0),
    "white": (255, 255, 255),
}

WIDTH, HEIGHT = 1536, 1024


def recolor(template: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """Generate badge by rendering text and thresholding alpha."""
    # Render text
    temp = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(temp)
    
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 650)
    except:
        font = ImageFont.load_default()
    
    # Render text in white (will be recolored)
    draw.text((WIDTH//2, HEIGHT//2), "BOT", fill=(255, 255, 255, 255), font=font, anchor="mm")
    
    # Threshold alpha: any pixel with alpha>0 becomes fully opaque
    out = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 0))  # White transparent
    for y in range(HEIGHT):
        for x in range(WIDTH):
            _, _, _, a = temp.getpixel((x, y))
            if a > 0:
                # Recolor and make fully opaque
                out.putpixel((x, y), (*rgb, 255))
    
    return out


def main() -> None:
    for name, rgb in TARGETS.items():
        out = recolor(None, rgb)
        path = ASSETS_DIR / f"bot-badge-{name}.png"
        out.save(path)
        print(f"Generated {path}")


if __name__ == "__main__":
    main()
