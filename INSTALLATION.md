# Installation Guide

*Exact step-by-step flow for installing the OpenClaw Framework.*

---

## Prerequisites

Before installing the framework:

1. ✅ OpenClaw is installed and running
2. ✅ Agent has gone through bootstrap (has name, personality)
3. ✅ Basic files exist: SOUL.md, IDENTITY.md, AGENTS.md

**The framework comes AFTER bootstrap.** Your agent already has an identity before you add the framework.

---

## Installation Flow

### Step 1: User Triggers Installation

User says something like:
> "Install the OpenClaw Framework from https://github.com/RGPankO/openclaw-framework"

### Step 2: Clone Framework

Agent executes:
```bash
mkdir -p framework
cd framework
git clone https://github.com/RGPankO/openclaw-framework .
```

### Step 3: Read Framework Files

Agent reads:
- `framework/README.md` — Understand what this is
- `framework/FRAMEWORK.md` — The gyst
- `framework/INSTALLATION.md` — This file (if not already)

### Step 4: Ask About Features

Agent asks user about each optional feature:

```
"I'll set up the framework. Let me ask about a few options:

1. **Reminders** — Smart reminder system with notifications
   Enable reminders? (yes/no)

2. **Auto-Update** — Daily check for framework updates
   Enable auto-updates? (yes/no)

3. **Mission** — Define your agent's purpose
   Want to set up a mission? (yes/no)

4. **Social Media** — Guidelines for human-like content
   Enable social media guidelines? (yes/no)"
```

### Step 4b: Detect and Configure Models

Agent detects available models and suggests configuration:

```
"I'll set up model delegation to save tokens.

Detected available:
- Anthropic: claude-opus-4-5, claude-sonnet-4-5
- Coding: codex CLI

Recommended setup:
- **Smart model** (main session, complex tasks): claude-opus-4-5
- **Worker model** (research, simple tasks): claude-sonnet-4-5  
- **Coding agent** (all code work): codex

Use these settings? (yes/customize)"
```

**If user says customize:**
```
"Which model for complex reasoning? (smart_model)"
"Which model for research/simple tasks? (worker_model)"
"Which coding tool? (codex/aider/cursor/none)"
```

### Step 5: Create USER-SETTINGS.md

Based on answers, create `workspace/USER-SETTINGS.md`:

```markdown
# User Settings

## Features
projects_dir: true
todo_system: true
reminders: [user's answer]
auto_update: [user's answer]
self_maintain: true
research_wiring: true

## Models
smart_model: [detected/chosen smart model]
worker_model: [detected/chosen worker model]
coding_agent: [detected/chosen coding tool]
mission: [user's answer]
social_media: [user's answer]
```

### Step 6: Create Directory Structure

```bash
mkdir -p ~/.openclaw/workspace/projects
mkdir -p ~/.openclaw/workspace/todo/archive
mkdir -p ~/.openclaw/workspace/reminders
mkdir -p ~/.openclaw/workspace/ROLES
mkdir -p ~/.openclaw/workspace/TASKS
mkdir -p ~/.openclaw/workspace/memory/sessions/main
```

### Step 7: Create ACTIVE-CONTEXT.md

```markdown
# Active Context

*Hot memory — current priorities and status.*

## Current Priority
[To be set]

## In Progress
- None yet

## Blockers
- None

## Recent Changes
- Framework installed [date]
```

### Step 8: Create FRAMEWORK-OVERRIDES.md (Empty)

```markdown
# Framework Overrides

*Add your custom rules below.*

```

### Step 9: Set Up Mission (If Enabled)

If user said yes to mission:

1. Read `framework/MISSION.example.md` for guidance
2. Ask user: "What's the main purpose of this agent? What should it help you accomplish?"
3. Create `workspace/MISSION.md` based on their answer

### Step 10: Set Up Main Role

1. Read `framework/ROLES/MAIN.example.md` for guidance
2. Create `workspace/ROLES/MAIN.md` based on agent's personality

```markdown
# Role: Main

## Purpose
Default role for direct communication with [user's name].

## Goals
1. Help [user] effectively
2. Be a thinking partner
3. Maintain context across sessions

## Behaviors
- Read context files on session start
- Log work to daily brief
- Update ACTIVE-CONTEXT when priorities change
```

### Step 11: Set Up Default Tasks (If Enabled)

**Built-in tasks read instructions from `framework/TASKS/` directly.** Only instance state (HANDOFF.md, CONTEXT.md, runs/) lives in `workspace/TASKS/`. Do NOT copy TASK.md files — they stay in framework and update automatically with `git pull`.

For each enabled task, create the instance state directory and cron:

**Self-Maintain (if enabled):**
1. Create `workspace/TASKS/SELF-MAINTAIN/` with: `HANDOFF.md`, `CONTEXT.md`, `runs/`
2. Create cron using:
```
cron action=add job={
  "name": "Self-Maintain",
  "schedule": {"kind": "cron", "expr": "0 3 * * *", "tz": "UTC"},
  "sessionTarget": "isolated",
  "enabled": true,
  "payload": {
    "kind": "agentTurn",
    "message": "Read framework/TASKS/README.md for execution rules. Then read framework/TASKS/SELF-MAINTAIN/TASK.md and follow instructions. Instance state is in TASKS/SELF-MAINTAIN/ (HANDOFF.md, CONTEXT.md, runs/)."
  },
  "delivery": {"mode": "announce", "bestEffort": true}
}
```

**Auto-Update (if enabled):**
1. Create `workspace/TASKS/AUTO-UPDATE/` with: `HANDOFF.md`, `CONTEXT.md`, `runs/`
2. Create cron using:
```
cron action=add job={
  "name": "Auto-Update",
  "schedule": {"kind": "cron", "expr": "0 4 * * *", "tz": "UTC"},
  "sessionTarget": "isolated",
  "enabled": true,
  "payload": {
    "kind": "agentTurn",
    "message": "Read framework/TASKS/README.md for execution rules. Then read framework/TASKS/AUTO-UPDATE/TASK.md and follow instructions. Instance state is in TASKS/AUTO-UPDATE/ (HANDOFF.md, CONTEXT.md, runs/)."
  },
  "delivery": {"mode": "announce", "bestEffort": true}
}
```

**Reminder (if enabled):**
1. Create `workspace/TASKS/REMINDER/` with: `HANDOFF.md`, `CONTEXT.md`, `runs/`
2. Create cron using:
```
cron action=add job={
  "name": "Reminder",
  "schedule": {"kind": "cron", "expr": "*/30 * * * *", "tz": "UTC"},
  "sessionTarget": "isolated",
  "enabled": true,
  "payload": {
    "kind": "agentTurn",
    "message": "Read framework/TASKS/README.md for execution rules. Then read framework/TASKS/REMINDER/TASK.md and follow instructions. Instance state is in TASKS/REMINDER/ (HANDOFF.md, CONTEXT.md, runs/)."
  },
  "delivery": {"mode": "announce", "bestEffort": true}
}
```

**TODO Processor (if todo_system enabled):**
1. Create `workspace/TASKS/TODO-PROCESSOR/` with: `HANDOFF.md`, `CONTEXT.md`, `runs/`
2. Create cron using:
```
cron action=add job={
  "name": "TODO Processor",
  "schedule": {"kind": "cron", "expr": "0 */2 * * *", "tz": "UTC"},
  "sessionTarget": "isolated",
  "enabled": true,
  "payload": {
    "kind": "agentTurn",
    "message": "Read framework/TASKS/README.md for execution rules. Then read framework/TASKS/TODO-PROCESSOR/TASK.md and follow instructions. Instance state is in TASKS/TODO-PROCESSOR/ (HANDOFF.md, CONTEXT.md, runs/)."
  },
  "delivery": {"mode": "announce", "bestEffort": true}
}
```

**Note:** Adjust timezone (`tz`) to user's preference. Set `enabled: false` if user wants cron disabled by default.

### Step 12: Create First Daily Brief

Create `memory/daily-brief-YYYY-MM-DD.md`:

```markdown
# Daily Brief — [today's date]

*Shared log of all session activity.*

---

## [time] — Framework Installation
- Installed OpenClaw Framework v0.1.0
- Features enabled: [list]
- Created: directories, settings, roles, tasks
- Ready to use
```

### Step 13: Update AGENTS.md

Add framework wiring to user's AGENTS.md. **Use this priority order:**

```markdown
## Session Startup

### 1. Identity (Who I Am)
OpenClaw auto-loads these, but reinforce the priority:
- `SOUL.md` — Personality, core truths
- `IDENTITY.md` — Name, vibe
- `USER.md` — About my human
- `MISSION.md` — Purpose, what I'm here for

### 2. Framework (How I Operate)
- `framework/FRAMEWORK.md` — Rules, security, delegation

### 3. Context (Current State)
- `ACTIVE-CONTEXT.md` — Hot memory, current priorities
- `memory/daily-brief-YYYY-MM-DD.md` — Today's activity
- `MEMORY.md` — Long-term memory (main session only)

## After Completing Work
1. Append summary to daily brief
2. Update ACTIVE-CONTEXT if priorities changed

**For details:** See `framework/` directory
```

**Why this order:**
1. **Identity first** — Know who you are before anything else
2. **Framework second** — Know how to operate
3. **Context third** — Know what's happening now

### Step 14: Confirm Installation

```
"✅ Framework installed successfully!

**Created:**
- Settings: workspace/USER-SETTINGS.md
- Context: workspace/ACTIVE-CONTEXT.md
- Role: workspace/ROLES/MAIN.md
- Directories: projects/, todo/, reminders/, TASKS/
[- Mission: workspace/MISSION.md (if enabled)]
[- Tasks: Self-Maintain, Auto-Update, Reminder (if enabled)]

**What's next:**
- I'll now read ACTIVE-CONTEXT and daily brief each session
- I'll log my work so you (and crons) know what happened
- Tell me if you want to add any FRAMEWORK-OVERRIDES

Ready to go!"
```

### Step 15: Start Web Tools Server

```bash
cd framework/tools
npm install  # first time only
nohup node server.js > /tmp/framework-server.log 2>&1 &
```

Access at: `http://localhost:8890/`

### Step 16: Configure Memory Flush (Recommended)

Ensure the instance's `openclaw.json` has `memoryFlush` configured for better memory persistence across compactions:

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard",
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          prompt: "Session is about to be compacted. Before it happens, write anything worth remembering to memory/YYYY-MM-DD.md — decisions made, lessons learned, context that would be lost, user preferences discovered. Focus on things that matter, not routine actions. Reply with NO_REPLY when done."
        }
      }
    }
  }
}
```

This runs a silent agent turn before compaction, giving the agent a chance to persist important context to disk. The daily memory files are read on session startup, so this information survives compaction.

---

## Post-Installation

### Verify Installation

Agent can verify:
```bash
ls ~/.openclaw/workspace/USER-SETTINGS.md
ls ~/.openclaw/workspace/ACTIVE-CONTEXT.md
ls ~/.openclaw/workspace/ROLES/MAIN.md
ls framework/FRAMEWORK.md
```

### Set Up Self-Versioning (Optional)

If user wants to backup their agent:

1. Read `framework/SELF-VERSIONING.md`
2. Initialize git in workspace
3. Add self files
4. Push to user's repo

---

## Troubleshooting

### Framework directory already exists
Ask user: "Framework directory exists. Update to latest version, or reinstall fresh?"

### Missing prerequisites
Check for SOUL.md, IDENTITY.md. If missing, suggest completing bootstrap first.

### Cron creation fails
Log the error, continue with file creation. User can set up crons manually.
