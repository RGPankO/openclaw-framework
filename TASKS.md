# Tasks System

## Terminology

**Tasks = Cron Jobs**

We call them "Tasks" for non-technical users. When the user says "Task," they mean a scheduled cron job.

Internally, these are OpenClaw cron jobs. The framework just provides a user-friendly name.

## Directory Structure

Each task gets its own directory with a standardized structure:

```
workspace/TASKS/
├── MYPROJECT/                    # Task directory
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

**Templates** are in `framework/TASKS/EXAMPLE/` — copy to `workspace/TASKS/[NAME]/` and customize.

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
1. Load personality — Read SOUL.md
2. Load role — Read the role file specified in the task
3. Read TASK.md — What am I doing?
4. Read HANDOFF.md — Where did we leave off?
5. (Optional) Scan runs/ if need more context
6. Execute the task instructions
7. Update HANDOFF.md — Current state for next run
8. Write to runs/YYYY-MM-DD-HHMM.md — Session log
9. Send summary if configured
10. Exit — Don't start new work beyond the task scope
```

## Cron Configuration

**Keep cron prompts minimal.** All instructions live in files:

```
# [TASK NAME]

Read TASKS/README.md for execution rules. Then read TASKS/[NAME]/TASK.md and follow instructions.
```

**The two files:**
- `TASKS/README.md` — Generic execution rules (read HANDOFF, write to runs/, etc.)
- `TASKS/[NAME]/TASK.md` — Specific task instructions

Benefits:
- Edit instructions without touching cron config
- Version control task instructions
- Generic rules in one place, specific instructions per task
- Cleaner separation of concerns

## Setup

1. Copy task template from `framework/TASKS/EXAMPLE/` to `workspace/TASKS/[NAME]/`
2. Customize TASK.md for your needs
3. Set up the corresponding cron job in OpenClaw with minimal prompt

## Creating Tasks

**Main agent creates tasks** when user asks for recurring automation:

1. Create directory: `workspace/TASKS/[NAME]/`
2. Create `TASK.md` with instructions
3. Create empty `HANDOFF.md` (first run will populate)
4. Create `runs/` directory
5. Create corresponding role in `workspace/ROLES/` if needed
6. Set up cron job with minimal prompt
7. Confirm to user: "Created task [NAME], runs [schedule]"

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

Copy from `framework/TASKS/EXAMPLE/` to get started:
- `TASK.md` — Template with all sections
- `HANDOFF.md` — Empty starting template
- `runs/` — Directory for session logs

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
5. **Minimum config in cron** — The cron job just triggers; all instructions live in the .md file
6. **Tasks read, don't write policy** — Task agents follow instructions, don't change framework files
7. **One task, one purpose** — Don't combine multiple jobs into one task
8. **Explicit instructions** — Task agents use simpler models; be very clear
9. **Always log** — Every task execution should be logged to runs/
10. **Templates stay in framework/** — Your actual tasks go in `workspace/TASKS/`
11. **Version control your tasks** — They're part of your "self"
