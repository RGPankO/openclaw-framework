# User Settings — How To Use

*This file explains settings. Your actual settings go in `workspace/USER-SETTINGS.md`.*

---

## What Are Settings?

Settings control which framework features are enabled or disabled.

## Format

```yaml
feature_name: true    # Enabled
feature_name: false   # Disabled
```

## Available Settings

```yaml
# Directory structure
projects_dir: true          # Use workspace/projects/ for all repos

# Task management
todo_system: true           # Individual TODO files in workspace/todo/
reminders: true             # Smart reminder system

# Automation
auto_update: true           # Daily check for framework updates
auto_update_style: default  # default = ask before pulling, brief = auto-pull + brief summary, auto-apply = auto-pull silently
self_maintain: true         # Daily health check task

# Guidelines
research_wiring: true       # Enforce no-shelf research policy
mission: true               # Purpose-driven agent with MISSION.md
writing_style: true         # Human-like writing, anti-AI-detection guidelines
```

## Model Configuration

Configure which models to use for different task types (saves tokens!):

```yaml
# Models (set during installation based on available providers)
smart_model: anthropic/claude-opus-4-5      # Complex reasoning, main session
worker_model: anthropic/claude-sonnet-4-5   # Research, simple tasks
coding_agent: codex                          # CLI tool for coding work
```

### Model Tier Equivalents

| Tier | Anthropic | OpenAI | Google |
|------|-----------|--------|--------|
| Smart | claude-opus-4-5 | gpt-4o | gemini-1.5-pro |
| Worker | claude-sonnet-4-5 | gpt-4o-mini | gemini-1.5-flash |
| Coding | — | codex | — |

### Usage

- **smart_model**: Main session, complex decisions, TODO processing
- **worker_model**: Research, reminders, simple cron tasks
- **coding_agent**: All coding work (uses CLI, often subscription-based = cheaper)

See `framework/DELEGATION.md` for detailed delegation guidelines.

## How It Works

1. During installation, agent asks which features you want
2. Your choices are saved to `workspace/USER-SETTINGS.md`
3. Agent reads this file to know what's enabled/disabled
4. You're never asked again (settings persist)

## Changing Settings

Tell your agent:
> "Turn off reminders"
> "Enable auto-update"
> "Disable social media guidelines"

Or edit `workspace/USER-SETTINGS.md` directly.

## Notes

- Changes take effect on next agent session
- This file is part of your "self" — version control it with your other self files
- If a setting is missing, the feature defaults to OFF
