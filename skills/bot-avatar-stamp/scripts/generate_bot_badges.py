#!/usr/bin/env python3
"""Generate BOT badge color variants from the red template with identical geometry."""

from pathlib import Path

from PIL import Image

ASSETS_DIR = Path(__file__).parent.parent / "assets"
RED_BADGE = ASSETS_DIR / "bot-badge-red.png"

TARGETS = {
    "black": (0, 0, 0),
    "white": (255, 255, 255),
}


def recolor(template: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """Generate badge by thresholding non-white pixels to solid color with full alpha."""
    # Convert to RGBA and get pixel data
    template_rgba = template.convert("RGBA")
    w, h = template_rgba.size
    
    # Define the target color
    if rgb == (229, 57, 53, 255) or rgb == (229, 57, 53):
        target_color = (229, 57, 53, 255)  # Red
    elif rgb == (0, 0, 0) or rgb == (0, 0, 0, 255):
        target_color = (0, 0, 0, 255)  # Black
    elif rgb == (255, 255, 255) or rgb == (255, 255, 255, 255):
        target_color = (255, 255, 255, 255)  # White
    else:
        target_color = (*rgb, 255)
    
    # Create output image
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    src = template_rgba.load()
    dst = out.load()
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            # If pixel is NOT white (i.e., has color), make it opaque with target color
            if r < 250 or g < 250 or b < 250:
                dst[x, y] = target_color
            # Else: keep transparent (white/transparent pixels)
    
    return out


def main() -> None:
    if not RED_BADGE.exists():
        raise FileNotFoundError(f"Missing template badge: {RED_BADGE}")

    red = Image.open(RED_BADGE).convert("RGBA")
    for name, rgb in TARGETS.items():
        out = recolor(red, rgb)
        path = ASSETS_DIR / f"bot-badge-{name}.png"
        out.save(path)
        print(f"Generated {path}")


if __name__ == "__main__":
    main()
