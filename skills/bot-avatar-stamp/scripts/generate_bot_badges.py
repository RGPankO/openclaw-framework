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
    """Keep the source alpha and replace RGB."""
    out = Image.new("RGBA", template.size, (0, 0, 0, 0))
    src = template.load()
    dst = out.load()
    r, g, b = rgb
    width, height = template.size
    for y in range(height):
        for x in range(width):
            _, _, _, a = src[x, y]
            if a:
                dst[x, y] = (r, g, b, a)
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
