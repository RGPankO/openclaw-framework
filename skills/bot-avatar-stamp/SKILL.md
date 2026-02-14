---
name: bot-avatar-stamp
description: Stamp avatar images with bot or premium overlays. Use when creating Telegram bot profile pictures, adding "BOT" badges to avatars, or creating premium channel avatars with diamond badges. Supports bot variant (red circle ring + BOT badge in red/black/white) and premium variant (gold diamond badge).
---

# Bot Avatar Stamp

Composite overlays onto avatar images for Telegram bots and premium channels.

## Important: Badge Color Selection

**When using this skill, always ask the user which badge color they want (black or white).**

The choice depends on the avatar's background:
- **Black text** → Best for light/bright avatars
- **White text** → Best for dark avatars
- **Red text** → Default, works on most backgrounds

Show the user the original avatar or describe it, then ask: "Would you like black or white text for the BOT badge?"

## Variants

- **bot** -- Red circle ring (60px at 1024) + optional "BOT" badge (bottom-right)
- **premium** -- Gold diamond "PREMIUM" badge (38% width, bottom-right, 150px inward)

## Options

- **--no-label** -- Add circle ring only, no BOT text

## Badge Colors (bot variant only)

- **red** -- Red "BOT" text (default)
- **black** -- Black "BOT" text
- **white** -- White "BOT" text

## Usage

```bash
python3 scripts/stamp.py <input> <output> --variant bot
python3 scripts/stamp.py <input> <output> --variant bot --badge-color black
python3 scripts/stamp.py <input> <output> --variant bot --badge-color white
python3 scripts/stamp.py <input> <output> --variant bot --no-label
python3 scripts/stamp.py <input> <output> --variant premium
python3 scripts/stamp.py <input> <output> --variant bot --size 512
```

Requires: `pip3 install Pillow`

## Assets

- `assets/bot-badge-red.png` -- Red wide "BOT" badge (1536x1024 source, optional)
- `assets/premium-badge.png` -- Gold diamond "PREMIUM" badge

Note: If badge assets are not found, the script will generate the text dynamically.
