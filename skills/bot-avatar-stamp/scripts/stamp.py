#!/usr/bin/env python3
"""Stamp an avatar with bot or premium overlays.

Usage:
  stamp.py <input> <output> [--variant bot|premium] [--size 1024] [--badge-color red|black|white]
  stamp.py <input> <output> --variant bot --badge-color black
  stamp.py <input> <output> --variant premium

Variants:
  bot      - Red circle ring + "BOT" badge (bottom-right)
  premium  - Gold diamond "PREMIUM" badge (bottom-right)

Badge colors (bot variant only):
  red      - Red "BOT" text (default)
  black    - Black "BOT" text
  white    - White "BOT" text
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow not installed. Run: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

ASSETS_DIR = Path(__file__).parent.parent / "assets"

COLOR_MAP = {
    "red": (229, 57, 53, 255),
    "black": (0, 0, 0, 255),
    "white": (255, 255, 255, 255),
}


def recolor_badge_from_template(template: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    """Recolor all non-transparent pixels while preserving exact alpha geometry."""
    recolored = Image.new("RGBA", template.size, (0, 0, 0, 0))
    src = template.load()
    dst = recolored.load()
    r, g, b, _ = color
    width, height = template.size
    for y in range(height):
        for x in range(width):
            _, _, _, a = src[x, y]
            if a:
                dst[x, y] = (r, g, b, a)
    return recolored


def stamp_bot(avatar: Image.Image, size: int, badge_color: str = "red") -> Image.Image:
    """Add red circle ring and BOT badge."""
    # Red circle ring
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    ring_width = max(int(size * 0.059), 4)  # ~60px at 1024
    draw.ellipse([0, 0, size - 1, size - 1], outline=(229, 57, 53, 255), width=ring_width)
    avatar = Image.alpha_composite(avatar, overlay)

    # BOT badge - check for pre-made badge first
    badge_filename = f"bot-badge-{badge_color}.png"
    badge_path = ASSETS_DIR / badge_filename
    
    if badge_path.exists():
        bot_badge = Image.open(badge_path).convert("RGBA")
    elif badge_color != "red":
        red_badge_path = ASSETS_DIR / "bot-badge-red.png"
        if red_badge_path.exists():
            red_badge = Image.open(red_badge_path).convert("RGBA")
            bot_badge = recolor_badge_from_template(red_badge, COLOR_MAP[badge_color])
        else:
            bot_badge = None
    else:
        bot_badge = None

    if bot_badge is not None:
        badge_w = int(size * 0.60)
        badge_h = int(badge_w * bot_badge.height / bot_badge.width)
        bot_badge = bot_badge.resize((badge_w, badge_h), Image.LANCZOS)
        margin = int(size * 0.078)  # ~80px at 1024
        pos = (size - badge_w - margin, size - badge_h - margin)
        avatar.paste(bot_badge, pos, bot_badge)
    else:
        # Generate badge dynamically
        text_color = COLOR_MAP.get(badge_color, COLOR_MAP["red"])
        badge_w = int(size * 0.30)
        badge_h = int(size * 0.10)
        badge = Image.new("RGBA", (badge_w, badge_h), (0, 0, 0, 0))
        badge_draw = ImageDraw.Draw(badge)
        
        # Try to use a bold font, fallback to default
        try:
            font_size = int(badge_h * 0.7)
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()
        
        # Center text
        bbox = badge_draw.textbbox((0, 0), "BOT", font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        text_x = (badge_w - text_w) // 2
        text_y = (badge_h - text_h) // 2
        
        badge_draw.text((text_x, text_y), "BOT", fill=text_color, font=font)
        
        margin = int(size * 0.078)
        pos = (size - badge_w - margin, size - badge_h - margin)
        avatar.paste(badge, pos, badge)

    return avatar


def stamp_premium(avatar: Image.Image, size: int) -> Image.Image:
    """Add premium diamond badge."""
    badge_path = ASSETS_DIR / "premium-badge.png"
    if badge_path.exists():
        badge = Image.open(badge_path).convert("RGBA")
        badge_w = int(size * 0.38)
        badge_h = int(badge_w * badge.height / badge.width)
        badge = badge.resize((badge_w, badge_h), Image.LANCZOS)
        margin = int(size * 0.146)  # ~150px at 1024
        pos = (size - badge_w - margin, size - badge_h - margin)
        avatar.paste(badge, pos, badge)
    else:
        print(f"Warning: premium badge not found at {badge_path}", file=sys.stderr)

    return avatar


def main():
    parser = argparse.ArgumentParser(description="Stamp avatar with bot/premium overlay")
    parser.add_argument("input", help="Input avatar image path")
    parser.add_argument("output", help="Output image path")
    parser.add_argument("--variant", choices=["bot", "premium"], default="bot", help="Overlay variant (default: bot)")
    parser.add_argument("--size", type=int, default=1024, help="Output size in pixels (default: 1024)")
    parser.add_argument("--badge-color", choices=["red", "black", "white"], default="red", help="BOT badge color (default: red, bot variant only)")
    args = parser.parse_args()

    avatar = Image.open(args.input).convert("RGBA").resize((args.size, args.size), Image.LANCZOS)

    if args.variant == "bot":
        avatar = stamp_bot(avatar, args.size, args.badge_color)
    elif args.variant == "premium":
        avatar = stamp_premium(avatar, args.size)

    avatar.save(args.output)
    print(f"Saved {args.variant} avatar to {args.output}")


if __name__ == "__main__":
    main()
