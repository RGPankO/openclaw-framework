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
**Did:** Checked pipeline, updated ACTIVE-CONTEXT with priorities
**For next:** 3 apps ready for review, QuickNutrition needs TestFlight test

## 09:30 — Main Session (with user)
**Did:** Built framework structure together, added SECURITY.md, CONTEXT.md
**For next:** Framework v0.1.0 ready, need to wire into our AGENTS.md

## 10:00 — Heartbeat
**Did:** Health check, all systems healthy
**For next:** Nothing pending
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
   Format:
   
   ## HH:MM — [Session Type]
   **Did:** What you accomplished
   **For next:** What the next cron should know (state, pending items, notes)

2. Update ACTIVE-CONTEXT.md if:
   - Priority completed
   - New blocker appeared
   - Status significantly changed
```

**Handoff notes are mandatory.** The next cron wakes up cold — leave them context.

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
        Writes: "Did: X, Y, Z. For next: QuickNutrition needs testing"

09:30 — User starts main session
        Reads: ACTIVE-CONTEXT, daily-brief, MEMORY
        Sees: CEO's handoff notes — knows QuickNutrition needs testing
        Does: Works with user on framework
        Writes: "Did: Built framework. For next: Wire into AGENTS.md"

10:00 — Heartbeat cron wakes up
        Reads: ACTIVE-CONTEXT.md, daily-brief
        Sees: Main session's handoff — knows framework needs wiring
        Does: Health check, finds nothing urgent
        Writes: "Did: Health check passed. For next: Nothing pending"

10:30 — Reddit cron wakes up
        Reads: ACTIVE-CONTEXT.md, daily-brief
        Sees: Full picture + all handoff notes
        Does: Posts helpful comment, notes which subs
        Writes: "Did: Posted in r/example. For next: Check replies in 2h"
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
7. **Leave handoff notes** — "For next:" tells the next cron what state you're leaving
