# TODO System

## Overview

TODOs are tasks left by the user for agents to pick up later. Each TODO is its own file, enabling web UI management and clear status tracking.

## Directory

```
workspace/todo/
├── 20260207_143052_fix_login_bug.md
├── 20260207_150000_research_competitors.md
└── archive/
    └── 20260206_120000_setup_database.md  # Completed
```

## File Naming

Format: `YYYYMMDD_HHMMSS_short_title.md`

Example: `20260207_143052_fix_login_bug.md`

## File Structure

```markdown
# TODO: [Title]

**Status:** NEW | IN_PROGRESS | DONE
**Created:** 2026-02-07 14:30
**Created By:** User | Main Agent
**Priority:** LOW | MEDIUM | HIGH | URGENT
**Assigned To:** Any | [Specific Role/Task]

## Description

[What needs to be done — detailed, with context]

## Context

[Why this matters, background info, relevant files]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Notes

[Agent notes, progress updates, blockers]
```

## Status Flow

```
NEW → IN_PROGRESS → DONE
        ↓
      (blocked) → Add blocker note, continue other work
```

## Picking Up TODOs

**Task/Cron agents:**
1. Check `workspace/todo/` for files
2. Filter by Assigned To (if specific) or take any
3. Pick highest priority NEW item
4. Change status to IN_PROGRESS
5. Add note: "Picked up by [Task Name] at [time]"
6. Do the work
7. Change status to DONE
8. Move to `archive/`

**Main agent:**
- Does NOT automatically pick up TODOs
- Only works on them if user explicitly asks
- Creates TODOs when user says "remind me to..." or "add a task to..."

## Creating TODOs (Main Agent)

When user asks to create a TODO:

1. Create file with proper naming
2. Fill in all fields with rich context
3. **Use your intelligence** — you're the smart agent, cron agents are simpler
4. Include everything the executing agent needs to succeed
5. Confirm to user: "Created TODO: [title], priority [X], will be picked up by [Task]"

## Web UI

Users can view/manage TODOs at the web interface:
- See all TODOs with status
- Mark as complete (moves to archive)
- Delete (permanent removal)
- Filter by status, priority

## Important Rules

1. **One TODO, one file** — Never combine multiple tasks
2. **Rich context** — Main agent adds detail so task agents succeed
3. **Status accuracy** — Always update status when picking up/completing
4. **Archive, don't delete** — Completed TODOs go to archive for history
