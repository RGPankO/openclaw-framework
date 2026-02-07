# Self-Versioning

## Overview

Your OpenClaw agent's "self" can be version controlled separately from the framework. This lets you:

1. **Back up** your agent's personality and configuration
2. **Restore** to a new OpenClaw instance (new machine, fresh install)
3. **Share** your setup with others (if you want)
4. **Track changes** to your agent over time

## The "Self" vs "Memory"

| Type | What It Is | Version Control? |
|------|------------|------------------|
| **Self** | Who the agent IS — personality, mission, roles | ✅ Yes |
| **Memory** | What the agent REMEMBERS — logs, context, history | ❌ No (per-instance) |

When you restore to a new instance, the agent has the same personality but fresh memories. Like waking up with amnesia but same personality.

## What To Version Control

### ✅ Always Include (The Self)

```
SOUL.md              # Personality, vibe, how to communicate
IDENTITY.md          # Name, avatar, basic identity
AGENTS.md            # Core rules, session behavior
MISSION.md           # Purpose of this agent
USER-SETTINGS.md     # Framework feature preferences
FRAMEWORK-OVERRIDES.md  # Custom overrides (if exists)
ROLES/               # All role definitions
TASKS/               # All task instructions
```

### ⚠️ Optional (User Decides)

```
USER.md              # Info about the human (may be private)
TOOLS.md             # Tool notes (may contain local paths)
```

### ❌ Never Include (Per-Instance)

```
MEMORY.md            # Long-term memory (personal, instance-specific)
memory/              # Daily logs, session data
CREDENTIALS.md       # API keys, secrets
projects/            # Cloned repos (have their own git)
todo/                # Ephemeral tasks
reminders/           # Ephemeral reminders
framework/           # Separate repo (the shared framework)
```

## Setting Up Self-Versioning

### 1. Initialize Your Repo

```bash
cd ~/.openclaw/workspace
git init
```

### 2. Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Per-instance (never commit)
MEMORY.md
memory/
CREDENTIALS.md

# Ephemeral
todo/
reminders/

# Separate repos
projects/
framework/

# System
*.log
.DS_Store
EOF
```

### 3. Add Your Self Files

```bash
git add SOUL.md IDENTITY.md AGENTS.md MISSION.md USER-SETTINGS.md
git add ROLES/ TASKS/
git add .gitignore

# Optional
git add USER.md TOOLS.md
```

### 4. Commit and Push

```bash
git commit -m "Initial self backup"
git remote add origin <your-repo-url>
git push -u origin main
```

## Restoring to New Instance

### 1. Install OpenClaw

Follow normal OpenClaw installation.

### 2. Clone Your Self

```bash
cd ~/.openclaw/workspace
git clone <your-self-repo> .
```

### 3. Install Framework

Tell your agent: "Install the OpenClaw Framework from [framework-repo-url]"

### 4. Done

Your agent has:
- ✅ Same personality (SOUL.md)
- ✅ Same mission (MISSION.md)
- ✅ Same roles and tasks
- ✅ Fresh memory (starts clean)

## Keeping Self Updated

As your agent evolves, commit changes:

```bash
cd ~/.openclaw/workspace
git add -A
git commit -m "Updated SOUL.md with new learnings"
git push
```

The agent can do this too — tell it: "Commit and push your self files"

## Framework vs Self

```
workspace/
├── framework/           # ← Shared framework (separate git repo)
│   └── (cloned from public framework repo)
│
├── SOUL.md             # ← Your files (your own git repo)
├── IDENTITY.md
├── AGENTS.md
├── MISSION.md
├── USER-SETTINGS.md
├── FRAMEWORK-OVERRIDES.md  # Optional
├── ROLES/
├── TASKS/
│
├── MEMORY.md           # ← Never committed (gitignored)
├── memory/
├── CREDENTIALS.md
├── projects/
├── todo/
└── reminders/
```

## Agent Instructions

When asked to back up or version control:

1. Check if workspace has git initialized
2. If not, guide user through setup (above)
3. Commit only "self" files, respect .gitignore
4. Push if remote is configured

When asked to restore:
1. Clone user's self-repo to workspace
2. Install framework separately
3. Confirm restoration complete
