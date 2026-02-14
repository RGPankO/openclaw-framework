---
name: bot-avatar-stamp
description: Stamp avatar images with bot or premium overlays. Use when creating Telegram bot profile pictures, adding "BOT" badges to avatars, or creating premium channel avatars with diamond badges. Supports bot variant (red circle ring + red BOT badge) and premium variant (gold diamond badge).
---

# Bot Avatar Stamp

Composite overlays onto avatar images for Telegram bots and premium channels.

## Variants

- **bot** -- Red circle ring (60px at 1024) + red "BOT" rectangle badge (60% width, bottom-right)
- **premium** -- Gold diamond "PREMIUM" badge (38% width, bottom-right, 150px inward)

## Usage

```bash
python3 scripts/stamp.py <input> <output> --variant bot
python3 scripts/stamp.py <input> <output> --variant premium
python3 scripts/stamp.py <input> <output> --variant bot --size 512
```

Requires: `pip3 install Pillow`

## Assets

- `assets/bot-badge-red.png` -- Red wide "BOT" badge (1536x1024 source)
- `assets/premium-badge.png` -- Gold diamond "PREMIUM" badge
