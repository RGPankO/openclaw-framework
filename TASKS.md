# Tasks System

## Terminology

**Tasks = Cron Jobs**

We call them "Tasks" for non-technical users. When the user says "Task," they mean a scheduled cron job.

Internally, these are OpenClaw cron jobs. The framework just provides a user-friendly name.

## Directory Structure

**Built-in tasks** (Self-Maintain, Auto-Update, Reminder, TODO Processor) read TASK.md directly from `framework/TASKS/`. Only instance state lives in `workspace/TASKS/`:

```
workspace/TASKS/
├── SELF-MAINTAIN/              # Built-in task (TASK.md lives in framework/)
│   ├── HANDOFF.md              # Current state (dynamic, updated each run)
│   ├── CONTEXT.md              # Long-term project facts (one-liners)
│   └── runs/                   # Session history (append-only)
│       ├── 2026-02-08-0800.md
│       └── 2026-02-08-1400.md
```

**Custom/project tasks** have their own TASK.md alongside their state:

```
workspace/projects/[name]/TASKS/
├── BUILD/
│   ├── TASK.md                 # Instructions (project-specific, static)
│   ├── HANDOFF.md
│   ├── CONTEXT.md
│   └── runs/
```

**Why:** Built-in TASK.md files update with `git pull` on the framework. No stale copies to maintain. Custom tasks have project-specific instructions that don't come from framework.

**Templates** are in `framework/TASKS/EXAMPLE/`. HANDOFF.md and CONTEXT.md templates are at `framework/TASKS/`.

## Task Location: Instance vs Project

Tasks can live in two places depending on what they're about:

### Instance tasks — `workspace/TASKS/`
Tasks about maintaining the instance itself. Not tied to any project.
- Self-Maintain, Auto-Update, Reminders, TODO Processor
- These stay with the instance repo (see `SELF-VERSIONING.md`)

### Project tasks — `workspace/projects/[name]/TASKS/`
Tasks about building, reviewing, or maintaining a specific project.
- Build tasks, code reviews, project-specific research
- These live inside the project directory and are version-controlled with the project
- When another instance clones the project, it gets the full task history (handoffs, runs, context)

**Rule:** If the task is about a project, it goes with the project. If it's about the instance, it stays at workspace level.

**Cron prompts for project tasks** point to the project path:
```
Read TASKS/README.md for execution rules. Then read projects/[name]/TASKS/[TASK-NAME]/TASK.md and follow instructions.
```

## The Three Elements

### 1. TASK.md (Static Instructions)

What to do, where the project is, role to assume. Rarely changes.

```markdown
# [Task Name]

## Schedule
[Cron schedule — how often this runs]
Examples: "Every 30 minutes", "Daily at 03:00", "Every 4 hours"

## Role
[Which role file to load]
Example: `workspace/ROLES/[NAME].md`

## Project Location
- **Repo:** `projects/[name]/repo/`
- **Library:** `projects/[name]/library/`

## Purpose
[What this task accomplishes]

## Before Starting
1. Read `HANDOFF.md` — current state
2. Optionally scan `runs/` for additional context
3. Check project `library/` if applicable

## Instructions
[Step-by-step what to do — be explicit]

1. Step one
2. Step two
3. Step three

## Before Ending
1. Update `HANDOFF.md` with current state and advice for next run
2. Write session log to `runs/YYYY-MM-DD-HHMM.md`
3. Update project `library/` if you learned something lasting
4. Send summary to user if configured

## Success Criteria
[How to know the task completed successfully]

## Error Handling
[What to do if something fails]
```

### 2. HANDOFF.md (Dynamic State)

A living document updated every run. The agent reads it at start, updates it at end.

**Key behaviors:**
- **REMOVE completed tasks entirely.** Done = gone. Don't strikethrough, don't mark ✅ — delete the line. Handoff is only what's ahead, never what's behind.
- **Don't document fixes.** If something was broken and you fixed it, nobody cares. Delete the bug from handoff. Update CONTEXT.md if the fix changed how something works permanently.
- **Move lasting knowledge to CONTEXT.md or library/.** If you built something new or discovered a permanent fact, add a one-liner to CONTEXT.md. If it's deeper knowledge, update library/ files. Then remove it from handoff.
- **Everything in handoff must be actionable.** If the next agent can't act on it, it doesn't belong here.
- Remove stale/outdated information every run
- Add fresh context and current state
- Write as if advising the next agent: "Continue from X, be aware of Y"
- Keep it concise but useful

```markdown
# Handoff

## Current State
[Where things stand right now — what works, what's active]

## Last Session
[What was just done — overwrite this section each run, never accumulate]

## Next Steps
[What should happen next — prioritized, actionable]

## Watch Out For
[Gotchas, blockers, things to remember]
```

### 3. CONTEXT.md (Long-Term Project Memory)

Stable facts about the project that rarely change. One-liners only.

**Key behaviors:**
- **If empty or outdated — populate it** with what you know from the project
- Add facts when you discover something lasting about the project
- Keep entries as one-liners — no paragraphs
- If you notice a contradiction (e.g. says SQLite but project uses PostgreSQL) — **investigate and update** the line, don't append a duplicate
- Each fact should appear exactly once. When something changes, replace the old line.
- This is NOT for session state — that's HANDOFF.md

```markdown
# Context

- Uses PostgreSQL database
- BTC payments via Breez SDK
- Stripe setup for fiat payments
- Deployed on Vercel
- Main repo: github.com/org/project
```

### 4. runs/ (Session History)

Append-only directory of session logs. Each run creates a new file.

**Filename format:** `YYYY-MM-DD-HHMM.md`

**Contents:**
- Detailed log of what was done
- Commands run, files changed
- Decisions made and why
- Same content as Telegram summary + technical details

**How to use:**
- Agents can scan `runs/` for historical context if needed
- Useful for understanding patterns, past decisions, debugging
- Don't read every file — scan recent ones when context helps

## How Tasks Execute

When a task cron fires:

```
1. Read framework/TASKS/README.md — Learn execution rules
2. Read TASK.md — From framework/ (built-in) or project (custom)
3. Read HANDOFF.md — Current state from last run (always in instance/project dir)
4. Read CONTEXT.md — Long-term project facts (always in instance/project dir)
5. (Optional) Scan runs/ — If need more historical context
6. If TASK.md specifies a Role — Read that role file
7. Execute the task instructions
8. Re-read HANDOFF.md — It may have been updated by another session since you last read it
9. Update HANDOFF.md — Merge your changes with any new content, then write current state for next run
10. Write to runs/YYYY-MM-DD-HHMM.md — Session log
11. Send summary if configured
12. Exit — Don't start new work beyond the task scope
```

## Cron Configuration

**Keep cron prompts minimal.** All instructions live in files:

```
# Built-in task
Read framework/TASKS/README.md for execution rules. Then read framework/TASKS/[NAME]/TASK.md and follow instructions. Instance state is in TASKS/[NAME]/ (HANDOFF.md, CONTEXT.md, runs/).

# Project task
Read framework/TASKS/README.md for execution rules. Then read projects/[name]/TASKS/[NAME]/TASK.md and follow instructions.
```

**The key files:**
- `framework/TASKS/README.md` — Generic execution rules (read HANDOFF, write to runs/, etc.)
- `framework/TASKS/[NAME]/TASK.md` — Instructions for built-in tasks (updated via git pull)
- `projects/[name]/TASKS/[NAME]/TASK.md` — Instructions for project-specific tasks

Benefits:
- Edit instructions without touching cron config
- Version control task instructions
- Generic rules in one place, specific instructions per task
- Cleaner separation of concerns

## Setup

**Built-in tasks:** Create only the instance state directory (`workspace/TASKS/[NAME]/` with HANDOFF.md, CONTEXT.md, runs/). TASK.md stays in framework/.

**Custom tasks:** Create the full directory in `workspace/TASKS/[NAME]/` or `projects/[name]/TASKS/[NAME]/` with your own TASK.md.

## Creating Custom Tasks

**Main agent creates tasks** when user asks for recurring automation:

1. Create directory: `projects/[name]/TASKS/[NAME]/` (project task) or `workspace/TASKS/[NAME]/` (instance task)
2. Create `TASK.md` with instructions (use `framework/TASKS/EXAMPLE/TASK.md` as reference)
3. Copy `framework/TASKS/HANDOFF.md` as `HANDOFF.md` (first run will populate)
4. Copy `framework/TASKS/CONTEXT.md` as `CONTEXT.md` (populate with known project facts)
5. Create `runs/` directory
6. Create corresponding role in `workspace/ROLES/` if needed
7. Set up cron job with minimal prompt
8. Confirm to user: "Created task [NAME], runs [schedule]"

## Managing Tasks

Users can manage tasks via:

**Chat:**
- "Turn off the research task"
- "Run the reminder task now"
- "Change self-maintain to run weekly"

**Web UI (Tasks Manager):**
- View all tasks and their status
- Toggle tasks on/off
- Click "Run Now" for immediate execution
- See last run time and results

## Task Templates

Copy from `framework/TASKS/` to get started:
- `EXAMPLE/TASK.md` — Template with all sections
- `HANDOFF.md` — Starting template (shared, at TASKS/ level)
- `CONTEXT.md` — Project facts template (shared, at TASKS/ level)
- Create `runs/` directory in your new task

Built-in task templates in `framework/TASKS/`:
- `SELF-MAINTAIN.md` — Daily health check
- `AUTO-UPDATE.md` — Framework updates
- `REMINDER.md` — Reminder execution
- `TODO-PROCESSOR.md` — Process one-off TODOs

## Important Rules

1. **Standardized structure** — Always TASK.md, HANDOFF.md, CONTEXT.md, runs/
2. **No custom files at task level** — Use runs/ for history, HANDOFF.md for state
3. **HANDOFF.md is dynamic** — Every session is expected to **add** content (findings, important notes, advice for the next run) AND **remove** content (previous handover notes that were specific to that run and no longer useful). It's a living document, not an append-only log. Keep under 400 lines max. If it grows beyond that, prune aggressively and move historical detail to `runs/`.
4. **ALWAYS re-read HANDOFF.md before writing** — Another session (main or cron) may have edited it since you last read it. Re-read immediately before editing to avoid overwriting instructions or state left by others.
5. **runs/ is append-only** — Never delete or modify past logs
6. **Minimum config in cron** — The cron job just triggers; all instructions live in the .md file
7. **Tasks read, don't write policy** — Task agents follow instructions, don't change framework files
8. **One task, one purpose** — Don't combine multiple jobs into one task
9. **Explicit instructions** — Task agents use simpler models; be very clear
10. **Always log** — Every task execution should be logged to runs/
11. **Templates stay in framework/** — Your actual tasks go in `workspace/TASKS/`
12. **Version control your tasks** — They're part of your "self"
