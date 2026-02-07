# Context Management

*How sessions maintain context and continuity across crons, compactions, and restarts.*

---

## The Problem

Each session starts fresh. Without deliberate context management:
- Crons don't know what previous crons did
- Main thread doesn't know what crons accomplished
- Session compaction loses conversation history
- Work gets repeated, priorities get forgotten

## The Solution: Shared Context Files

### ACTIVE-CONTEXT.md (Hot Memory)

**Location:** `workspace/ACTIVE-CONTEXT.md`

The "what's happening RIGHT NOW" file. Current priorities, work in progress, blockers.

**Read:** First thing, every session (main + crons)
**Write:** When priorities change, work starts/completes, blockers appear

```markdown
# Active Context

## Current Priority
[What we're focused on right now]

## In Progress
- [Task 1] — status
- [Task 2] — status

## Blockers
- [What's blocked and why]

## Recent Changes
- [Important thing that happened]
```

### Daily Brief (Shared Log)

**Location:** `memory/daily-brief-YYYY-MM-DD.md`

The day's activity log. ALL sessions (main + crons) append here.

**Read:** On session start to see what happened today
**Write:** After completing any significant work

```markdown
# Daily Brief — 2026-02-07

## 09:00 — CEO Cron
- Checked pipeline, 3 apps ready for review
- Updated ACTIVE-CONTEXT with priorities

## 09:30 — Main Session (with Plamen)
- Built framework structure together
- Added SECURITY.md, CONTEXT.md

## 10:00 — Heartbeat
- All systems healthy, no action needed
```

**Why one file:** Every cron reads the same file, sees what others did. No information silos.

### MEMORY.md (Long-Term)

**Location:** `workspace/MEMORY.md`

Curated long-term memory. Important decisions, lessons learned, project history.

**Read:** Main sessions only (contains personal context)
**Write:** When something significant is worth remembering long-term

**NOT for:** Daily logs, temporary status, cron activity

---

## Session Startup

### Main Thread (User Conversation)

```
1. Read ACTIVE-CONTEXT.md         — What's hot right now?
2. Read memory/daily-brief-*.md   — What happened today?
3. Read MEMORY.md                 — Long-term context
4. Read MISSION.md                — What's my purpose?
5. Read USER-SETTINGS.md          — What's enabled?
6. Read FRAMEWORK-OVERRIDES.md    — Any custom rules?
```

### Task/Cron Sessions

```
1. Read ACTIVE-CONTEXT.md         — What's the priority?
2. Read memory/daily-brief-*.md   — What happened today?
3. Read workspace/TASKS/[task].md — My instructions
4. Read workspace/ROLES/[role].md — My role (if specified)
5. Read USER-SETTINGS.md          — What's enabled?
```

**Note:** Crons do NOT read MEMORY.md (personal, main-session only)

---

## After Completing Work

### Every Session (Main + Crons)

```
1. Append summary to memory/daily-brief-YYYY-MM-DD.md
   Format: "## HH:MM — [Session Type]\n- What you did\n- What changed"

2. Update ACTIVE-CONTEXT.md if:
   - Priority completed
   - New blocker appeared
   - Status significantly changed
```

### Main Session Only

```
3. Update MEMORY.md if:
   - Important decision made
   - Lesson learned worth keeping
   - Significant milestone reached

4. Optionally write detailed log to memory/sessions/main/YYYY-MM-DD-HHMM.md
```

---

## On Session Compaction

When you see "Summary unavailable due to context limits" or similar:

### DO NOT just ask "what were we doing?"

### DO THIS:

```
1. Read ACTIVE-CONTEXT.md         — Current priorities
2. Read memory/daily-brief-*.md   — Today's activity
3. Check recent file modifications — ls -lt on key dirs

4. Brief the user:
   "Session compacted. I caught up:
   - [What I found in today's log]
   - [Current priority from ACTIVE-CONTEXT]
   - [Any work in progress]
   
   Fill me in on anything I'm missing?"
```

**Why:** You do the legwork. User only fills gaps.

---

## Context Flow Example

```
09:00 — CEO Cron wakes up
        Reads: ACTIVE-CONTEXT.md, daily-brief
        Does: Checks pipeline, updates priorities
        Writes: Appends to daily-brief, updates ACTIVE-CONTEXT

09:30 — User starts main session
        Reads: ACTIVE-CONTEXT, daily-brief, MEMORY
        Sees: What CEO cron did at 09:00
        Does: Works with user on framework
        Writes: Appends to daily-brief, updates ACTIVE-CONTEXT

10:00 — Heartbeat cron wakes up
        Reads: ACTIVE-CONTEXT.md, daily-brief
        Sees: What main session did at 09:30
        Does: Health check, finds nothing urgent
        Writes: Appends "HEARTBEAT_OK" to daily-brief

10:30 — Reddit cron wakes up
        Reads: ACTIVE-CONTEXT.md, daily-brief
        Sees: Full picture of today's activity
        Does: Posts helpful comment
        Writes: Appends activity to daily-brief
```

**Result:** Each session knows what came before. No blind spots.

---

## File Summary

| File | Purpose | Read By | Write When |
|------|---------|---------|------------|
| ACTIVE-CONTEXT.md | Hot memory, current state | All sessions | Priorities/status change |
| memory/daily-brief-*.md | Today's shared log | All sessions | After any work |
| MEMORY.md | Long-term curated memory | Main only | Significant events |
| memory/sessions/main/*.md | Detailed main session logs | Main only | Detailed handover needed |

---

## Important Rules

1. **Daily brief is the shared log** — All sessions append, all sessions read
2. **ACTIVE-CONTEXT is the source of truth** — Current priorities live here
3. **MEMORY.md is curated** — Not a dump, only what matters long-term
4. **Crons don't read MEMORY.md** — It may contain private context
5. **Always append before ending** — Future sessions depend on your log
6. **On compaction, recover yourself** — Don't make user repeat everything
