# Tasks System

## Terminology

**Tasks = Cron Jobs**

We call them "Tasks" for non-technical users. When the user says "Task," they mean a scheduled cron job.

Internally, these are OpenClaw cron jobs. The framework just provides a user-friendly name.

## Directory

Your tasks live in `workspace/TASKS/` (NOT inside framework/):

```
workspace/TASKS/
├── SELF-MAINTAIN.md      # Daily health check
├── AUTO-UPDATE.md        # Framework update check
├── REMINDER.md           # Reminder execution
├── REDDIT.md             # Reddit engagement
└── [CUSTOM].md           # User-defined tasks
```

**Templates** are in `framework/TASKS/` — copy them to `workspace/TASKS/` and customize.

## Task File Structure

```markdown
# Task: [Name]

## Schedule

[Cron schedule — how often this runs]
Examples: "Every 30 minutes", "Daily at 03:00", "Every 4 hours"

## Role

[Which role file to load]
Example: `workspace/ROLES/REDDIT.md`

## Purpose

[What this task accomplishes]

## Instructions

[Step-by-step what to do — be explicit]

1. Step one
2. Step two
3. Step three

## Success Criteria

[How to know the task completed successfully]

## Error Handling

[What to do if something fails]

## Logging

[Where to log activity]
```

## How Tasks Execute

When a task cron fires:

1. **Load personality** — Read SOUL.md
2. **Load role** — Read the role file specified in the task
3. **Read task instructions** — This task file
4. **Execute** — Follow the instructions
5. **Log** — Record what was done
6. **Exit** — Don't start new work beyond the task scope

## Setup

1. Copy task templates from `framework/TASKS/` to `workspace/TASKS/`
2. Customize for your needs
3. Set up the corresponding cron jobs in OpenClaw

## Creating Tasks

**Main agent creates tasks** when user asks for recurring automation:

1. Create `workspace/TASKS/[NAME].md` with instructions (NOT in framework/)
2. Create corresponding role in `workspace/ROLES/` if needed
3. Set up the cron job in OpenClaw
4. Confirm to user: "Created task [NAME], runs [schedule]"

## Managing Tasks

Users can manage tasks via:

**Chat:**
- "Turn off the Reddit task"
- "Run the reminder task now"
- "Change self-maintain to run weekly"

**Web UI (Tasks Manager):**
- View all tasks and their status
- Toggle tasks on/off
- Click "Run Now" for immediate execution
- See last run time and results

## Important Rules

1. **Minimum config in cron** — The cron job just triggers; all instructions live in the .md file
2. **Tasks read, don't write policy** — Task agents follow instructions, don't change framework files
3. **One task, one purpose** — Don't combine multiple jobs into one task
4. **Explicit instructions** — Task agents use simpler models; be very clear
5. **Always log** — Every task execution should be logged somewhere
6. **Templates stay in framework/** — Your actual tasks go in `workspace/TASKS/`
7. **Version control your tasks** — They're part of your "self"

## Built-in Task Templates

Copy these from `framework/TASKS/` to `workspace/TASKS/`:

### SELF-MAINTAIN.md
- Schedule: Daily at 03:00
- Purpose: Check for file bloat, duplicates, health issues
- Template: `framework/TASKS/SELF-MAINTAIN.md`

### AUTO-UPDATE.md
- Schedule: Daily at 04:00
- Purpose: Check for framework updates
- Template: `framework/TASKS/AUTO-UPDATE.md`

### REMINDER.md
- Schedule: Every 30 minutes
- Purpose: Execute active reminders
- Template: `framework/TASKS/REMINDER.md`
