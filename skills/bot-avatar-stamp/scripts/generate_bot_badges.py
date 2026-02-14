#!/usr/bin/env python3
"""Generate BOT badge color variants from the red template with identical geometry."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = Path(__file__).parent.parent / "assets"
RED_BADGE = ASSETS_DIR / "bot-badge-red.png"

TARGETS = {
    "black": (0, 0, 0),
    "white": (255, 255, 255),
}


def recolor(template: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    """Generate badge by extracting text mask from template and applying color."""
    # Convert to RGBA
    template_rgba = template.convert("RGBA")
    w, h = template_rgba.size
    
    # Create output: white background (transparent), text opaque with color
    out = Image.new("RGBA", (w, h), (255, 255, 255, 0))  # White, transparent
    draw = ImageDraw.Draw(out)
    
    # Draw the text in the target color
    # Try to use a good font
    font_size = 400
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    # Get RGB color
    r, g, b = rgb[:3]
    color = (r, g, b, 255)
    
    # Draw text centered
    draw.text((w//2, h//2), "BOT", fill=color, font=font, anchor="mm")
    
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
