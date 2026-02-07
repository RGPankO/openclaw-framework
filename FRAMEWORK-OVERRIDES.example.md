# Framework Overrides — How To Use

*This file explains how overrides work. Your actual overrides go in `workspace/FRAMEWORK-OVERRIDES.md`.*

---

## What Are Overrides?

Overrides let you customize framework behavior without editing framework files (which get overwritten on updates).

## How It Works

1. Agent reads `framework/FRAMEWORK.md` (the defaults)
2. Agent reads `workspace/FRAMEWORK-OVERRIDES.md` (your overrides)
3. **Your overrides take precedence**

## Writing Overrides

Use strong language to ensure overrides are followed:
- **MUST** / **ALWAYS** — Require this behavior
- **NEVER** — Prohibit this behavior
- **CRITICAL** — This is non-negotiable

## Examples

### Change Quiet Hours

```markdown
## Quiet Hours

CRITICAL: My quiet hours are 11pm-7am, NOT the default 1am-8am.
NEVER send notifications between 23:00 and 07:00.
```

### Disable a Feature (Even If Enabled in Settings)

```markdown
## Weekend Reminders

MUST: Even though reminders are enabled, NEVER send reminder 
notifications on weekends. Log them instead for Monday.
```

### Modify Default Behavior

```markdown
## TODO Priority

CRITICAL: When creating TODOs, ALWAYS set priority to HIGH unless I 
explicitly say otherwise.
```

### Add Custom Rules

```markdown
## External Communication

MUST: Before any external communication (email, social, Telegram), 
summarize what you're about to send and wait for my confirmation.
```

### Override Auto-Update Behavior

```markdown
## Updates

NEVER auto-update the framework without my explicit approval,
even if auto_update is true in settings.
```

## Your Overrides File

Your actual overrides go in `workspace/FRAMEWORK-OVERRIDES.md`.

During installation, this file is created empty. Tell your agent what overrides you want, and it will add them there.

To add an override manually:
1. Open `workspace/FRAMEWORK-OVERRIDES.md`
2. Add your override using the format above
3. Save — takes effect on next agent session
