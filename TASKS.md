# Tasks System

## Terminology

**Tasks = Cron Jobs**

We call them "Tasks" for non-technical users. When the user says "Task," they mean a scheduled cron job.

## Directory Structure

Each task gets its own directory with a standardized structure:

```
workspace/TASKS/
├── TANKSIO/                    # Task directory
│   ├── TASK.md                 # Instructions (static)
│   ├── HANDOFF.md              # Current state (dynamic, updated each run)
│   └── runs/                   # Session history (append-only)
│       ├── 2026-02-08-0800.md
│       └── 2026-02-08-1400.md
├── REDDIT/
│   ├── TASK.md
│   ├── HANDOFF.md
│   └── runs/
└── [CUSTOM]/
    ├── TASK.md
    ├── HANDOFF.md
    └── runs/
```

**ALWAYS these 3 elements. No custom files at task level.**

## The Three Elements

### 1. TASK.md (Static Instructions)

What to do, where the project is, role to assume. Rarely changes.

```markdown
# [Task Name]

## Project Location
- **Repo:** `projects/[name]/repo/`
- **Library:** `projects/[name]/library/`

## Role
Read `ROLES/[ROLE].md` for behavioral context.

## Before Starting
1. Read `HANDOFF.md` — current state
2. Optionally scan `runs/` for additional context
3. Check project `library/` if applicable

## Instructions
[What to do each run]

## Before Ending
1. Update `HANDOFF.md` with current state and advice for next run
2. Write session log to `runs/YYYY-MM-DD-HHMM.md`
3. Update project `library/` if you learned something lasting
4. Send summary to user if configured
```

### 2. HANDOFF.md (Dynamic State)

A living document updated every run. The agent reads it at start, updates it at end.

**Key behaviors:**
- Remove stale/outdated information
- Add fresh context and current state
- Write as if advising the next agent: "Continue from X, be aware of Y"
- Keep it concise but useful

```markdown
# Handoff

## Current State
[Where things stand right now]

## Last Session
[What was just done, when]

## Next Steps
[What should happen next]

## Watch Out For
[Gotchas, blockers, things to remember]

## Notes
[Anything else useful for the next run]
```

### 3. runs/ (Session History)

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
1. Read TASK.md — What am I doing?
2. Read HANDOFF.md — Where did we leave off?
3. (Optional) Scan runs/ if need more context
4. Execute the task instructions
5. Update HANDOFF.md — Current state for next run
6. Write to runs/YYYY-MM-DD-HHMM.md — Session log
7. Send summary if configured
```

## Cron Configuration

**Keep cron prompts minimal.** All instructions live in files:

```
# [TASK NAME]

Read TASKS/[NAME]/TASK.md and follow instructions.
```

Benefits:
- Edit instructions without touching cron config
- Version control task instructions
- Cleaner separation of concerns

## Creating Tasks

When user asks for recurring automation:

1. Create directory: `workspace/TASKS/[NAME]/`
2. Create `TASK.md` with instructions
3. Create empty `HANDOFF.md` (first run will populate)
4. Create `runs/` directory
5. Create role in `workspace/ROLES/` if needed
6. Set up cron job with minimal prompt

## Task Templates

Copy from `framework/TASKS/EXAMPLE/` to get started:
- `TASK.md` — Template with all sections
- `HANDOFF.md` — Empty starting template

Built-in task templates in `framework/TASKS/`:
- `SELF-MAINTAIN.md` — Daily health check
- `AUTO-UPDATE.md` — Framework updates
- `REMINDER.md` — Reminder execution
- `TODO-PROCESSOR.md` — Process one-off TODOs

## Important Rules

1. **Standardized structure** — Always TASK.md, HANDOFF.md, runs/
2. **No custom files at task level** — Use runs/ for history, HANDOFF.md for state
3. **HANDOFF.md is dynamic** — Update every run, remove stale info
4. **runs/ is append-only** — Never delete or modify past logs
5. **Minimal cron prompts** — Instructions live in files, not cron config
6. **Task agents follow instructions** — Don't modify framework or policy files
