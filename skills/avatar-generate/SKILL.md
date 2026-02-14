---
name: avatar-generate
description: Generate bot avatars using AI image generation. Stores avatars in the identity repo's avatar/ directory. Supports OpenAI (DALL-E 3, gpt-image-1) and can be extended for other providers. User must provide their own API key.
---

# Avatar Generate Skill

Generate minimalist, professional avatars for AI bots and store them in the identity repository.

## ⚠️ API Key Required

**This skill requires an OpenAI API key.** The user must configure their own key:
```bash
export OPENAI_API_KEY="sk-..."
# OR
openclaw models auth paste-token --provider openai --profile-id openai:default
```

## Usage

```bash
# Generate using OpenAI (requires OPENAI_API_KEY env var or auth profile)
python3 scripts/generate.py <identity-repo-path> --prompt "A minimalist elegant avatar for an AI assistant, simple icon style, soft colors" --size 1024

# Generate with specific style
python3 scripts/generate.py <identity-repo-path> --prompt "A friendly bot avatar, clean design, white background" --variant friendly --size 512

# List available avatars
python3 scripts/generate.py <identity-repo-path> --list
```

## Output

Generated avatars are stored in:
```
<identity-repo>/avatar/<timestamp>-<variant>-<prompt-hash>.png
```

The skill also updates `<identity-repo>/avatar/index.html` with a gallery view.

## Setup

### OpenAI API Key (required)

Option 1: Environment variable
```bash
export OPENAI_API_KEY="sk-..."
```

Option 2: Add to OpenClaw auth profiles
```bash
openclaw models auth paste-token --provider openai --profile-id openai:default
```

### Dependencies

```bash
pip3 install requests Pillow
```

## Identity Repo Structure

The skill expects this structure in the identity repo:
```
<identity>/
├── avatar/
│   ├── index.html          # Auto-generated gallery
│   ├── prompts.json       # Generation prompts used
│   └── *.png              # Generated avatars
└── IDENTITY.md
```

## Customization

Edit `scripts/prompts.py` to customize prompt templates for different bot personalities.

## Variants

- `minimal` — Clean, simple icon style
- `friendly` — Rounder, warmer appearance
- `professional` — Sharp, business-appropriate
- `playful` — More colorful, fun details
