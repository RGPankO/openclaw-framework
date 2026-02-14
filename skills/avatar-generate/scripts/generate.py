#!/usr/bin/env python3
"""
Avatar Generate Script

Generate AI bot avatars and store in identity repository.
Usage: python3 generate.py <identity-repo-path> [options]
"""

import os
import sys
import json
import time
import hashlib
import argparse
from pathlib import Path
from datetime import datetime

try:
    import requests
    from PIL import Image
except ImportError:
    print("Installing dependencies...")
    os.system("pip3 install requests Pillow -q")
    import requests
    from PIL import Image

# Default prompts by variant
PROMPTS = {
    "minimal": "A minimalist elegant avatar for an AI assistant, simple icon style, soft colors, white or light gray background, flat design, professional",
    "friendly": "A friendly warm AI bot avatar, rounded features, welcoming expression, soft pastel colors, clean background, approachable design",
    "professional": "A professional AI assistant avatar, sharp clean lines, business-appropriate, navy or dark blue accents, white background, corporate style",
    "playful": "A playful colorful AI bot avatar, fun details, vibrant but not overwhelming colors, light creative background, whimsical but not childish"
}

def get_openai_key():
    """Get OpenAI API key from env or config."""
    key = os.environ.get("OPENAI_API_KEY")
    if key:
        return key

    # Try to read from OpenClaw config
    config_paths = [
        Path.home() / ".claude" / "settings.json",
        Path.home() / ".openclaw" / "openclaw.json",
    ]

    for config_path in config_paths:
        if config_path.exists():
            try:
                with open(config_path) as f:
                    config = json.load(f)
                # Look for various key locations
                for key_location in ["openai_api_key", "OPENAI_API_KEY", "api_keys", "keys"]:
                    if key_location in config:
                        keys = config[key_location]
                        if isinstance(keys, dict):
                            key = keys.get("openai") or keys.get("default")
                        elif isinstance(keys, str):
                            key = keys
                        if key:
                            return key
            except:
                pass

    return None


def generate_with_openai(prompt, size=1024, model="dall-e-3"):
    """Generate image using OpenAI API."""
    key = get_openai_key()
    if not key:
        raise ValueError("No OpenAI API key found. Set OPENAI_API_KEY or configure in OpenClaw.")

    if model == "gpt-image-1":
        url = "https://api.openai.com/v1/images/generations"
        data = {
            "model": "gpt-image-1",
            "prompt": prompt,
            "size": f"{size}x{size}"
        }
    else:
        url = "https://api.openai.com/v1/images/generations"
        data = {
            "model": "dall-e-3",
            "prompt": prompt,
            "size": "1024x1024" if size >= 1024 else "512x512",
            "quality": "standard",
            "n": 1
        }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers, json=data, timeout=120)
    response.raise_for_status()

    result = response.json()

    if "data" in result and len(result["data"]) > 0:
        image_url = result["data"][0].get("url") or result["data"][0].get("b64_json")
        return image_url, result
    else:
        raise ValueError(f"Unexpected API response: {result}")


def download_image(url):
    """Download image from URL or decode base64."""
    if url.startswith("data:"):
        # Base64 encoded
        import base64
        header, data = url.split(",", 1)
        return base64.b64decode(data)
    else:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        return response.content


def save_avatar(image_data, identity_path, prompt, variant):
    """Save avatar to identity repo."""
    avatar_dir = Path(identity_path) / "avatar"
    avatar_dir.mkdir(exist_ok=True)

    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:8]
    filename = f"{timestamp}-{variant}-{prompt_hash}.png"
    filepath = avatar_dir / filename

    # Save image
    image = Image.open(io.BytesIO(image_data))
    image.save(filepath, "PNG")

    # Update index.html
    index_file = avatar_dir / "index.html"
    html_content = f'''
<!DOCTYPE html>
<html>
<head>
    <title>Avatar Gallery</title>
    <style>
        body {{ font-family: system-ui, sans-serif; padding: 2rem; background: #f5f5f5; }}
        h1 {{ color: #333; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }}
        .card {{ background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        img {{ width: 100%; height: auto; border-radius: 4px; }}
        .meta {{ margin-top: 0.5rem; font-size: 0.8rem; color: #666; }}
    </style>
</head>
<body>
    <h1>Avatar Gallery</h1>
    <div class="grid">
'''
    # Add existing images
    for img_path in sorted(avatar_dir.glob("*.png")):
        if img_path.name != "index.html" and img_path.name != "prompts.json":
            meta = img_path.stem.split("-")
            variant_name = meta[1] if len(meta) > 1 else "unknown"
            html_content += f'''
        <div class="card">
            <img src="{img_path.name}" alt="{img_path.name}">
            <div class="meta">{variant_name}</div>
        </div>
'''

    html_content += '''
    </div>
</body>
</html>
'''
    index_file.write_text(html_content)

    # Update prompts.json
    prompts_file = avatar_dir / "prompts.json"
    prompts_data = {}
    if prompts_file.exists():
        prompts_data = json.loads(prompts_file.read_text())

    prompts_data[filename] = {
        "prompt": prompt,
        "variant": variant,
        "generated": timestamp,
        "model": "openai/dall-e-3"
    }
    prompts_file.write_text(json.dumps(prompts_data, indent=2))

    return filepath


import io

def main():
    parser = argparse.ArgumentParser(description="Generate bot avatars")
    parser.add_argument("identity_path", help="Path to identity repository")
    parser.add_argument("--prompt", "-p", help="Custom prompt", default=None)
    parser.add_argument("--variant", "-v", choices=["minimal", "friendly", "professional", "playful"],
                        default="minimal", help="Avatar style variant")
    parser.add_argument("--size", "-s", type=int, default=1024, help="Image size")
    parser.add_argument("--model", "-m", default="dall-e-3", help="Model to use")
    parser.add_argument("--list", "-l", action="store_true", help="List existing avatars")

    args = parser.parse_args()

    identity_path = Path(args.identity_path).resolve()

    if not identity_path.exists():
        print(f"Error: Identity path does not exist: {identity_path}")
        sys.exit(1)

    if args.list:
        avatar_dir = identity_path / "avatar"
        if not avatar_dir.exists():
            print("No avatars yet.")
            sys.exit(0)

        print("Existing avatars:")
        for img_path in sorted((avatar_dir / "prompts.json").glob("*.png")):
            if img_path.name != "index.html" and img_path.name != "prompts.json":
                meta = img_path.stem.split("-")
                variant = meta[1] if len(meta) > 1 else "unknown"
                print(f"  - {img_path.name} ({variant})")
        sys.exit(0)

    # Get prompt
    if args.prompt:
        prompt = args.prompt
    else:
        prompt = PROMPTS.get(args.variant, PROMPTS["minimal"])
        print(f"Using prompt: {prompt[:50]}...")

    print(f"Generating avatar with {args.model}...")

    try:
        image_url, raw_response = generate_with_openai(prompt, args.size, args.model)
        print("Downloading image...")

        image_data = download_image(image_url)
        filepath = save_avatar(image_data, str(identity_path), prompt, args.variant)

        print(f"✅ Avatar saved: {filepath}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
