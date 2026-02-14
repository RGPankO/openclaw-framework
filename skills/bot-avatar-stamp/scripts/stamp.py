#!/usr/bin/env python3
"""Stamp an avatar with bot or premium overlays.

Usage:
  stamp.py <input> <output> [--variant bot|premium] [--size 1024]
  stamp.py <input> <output> --variant bot
  stamp.py <input> <output> --variant premium

Variants:
  bot      - Red circle ring + red "BOT" badge (bottom-right)
  premium  - Gold diamond "PREMIUM" badge (bottom-right)
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: Pillow not installed. Run: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

ASSETS_DIR = Path(__file__).parent.parent / "assets"


def stamp_bot(avatar: Image.Image, size: int) -> Image.Image:
    """Add red circle ring and BOT badge."""
    # Red circle ring
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    ring_width = max(int(size * 0.059), 4)  # ~60px at 1024
    draw.ellipse([0, 0, size - 1, size - 1], outline=(229, 57, 53, 255), width=ring_width)
    avatar = Image.alpha_composite(avatar, overlay)

    # BOT badge
    badge_path = ASSETS_DIR / "bot-badge-red.png"
    if badge_path.exists():
        bot_badge = Image.open(badge_path).convert("RGBA")
        badge_w = int(size * 0.60)
        badge_h = int(badge_w * bot_badge.height / bot_badge.width)
        bot_badge = bot_badge.resize((badge_w, badge_h), Image.LANCZOS)
        margin = int(size * 0.078)  # ~80px at 1024
        pos = (size - badge_w - margin, size - badge_h - margin)
        avatar.paste(bot_badge, pos, bot_badge)
    else:
        print(f"Warning: bot badge not found at {badge_path}", file=sys.stderr)

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
    args = parser.parse_args()

    avatar = Image.open(args.input).convert("RGBA").resize((args.size, args.size), Image.LANCZOS)

    if args.variant == "bot":
        avatar = stamp_bot(avatar, args.size)
    elif args.variant == "premium":
        avatar = stamp_premium(avatar, args.size)

    avatar.save(args.output)
    print(f"Saved {args.variant} avatar to {args.output}")


if __name__ == "__main__":
    main()
