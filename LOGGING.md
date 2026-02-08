# Logging Standard

*How and where to log activity across all sessions.*

---

## Why Log?

Logs enable:
- **Continuity** — Next session knows what this one did
- **Debugging** — Track down what went wrong
- **Accountability** — Record of actions taken
- **Memory** — Build context over time

## Where to Log

### Daily Brief (Primary Log)

**Location:** `memory/daily-brief-YYYY-MM-DD.md`

**Who writes:** ALL sessions (main + crons)
**When:** After completing any significant work

This is the shared log. Everyone reads it, everyone writes to it.

### Session Logs (Detailed)

**Location:** `memory/sessions/[type]/YYYY-MM-DD-HHMM.md`

**Types:**
- `memory/sessions/main/` — Main thread sessions
- `memory/sessions/[task-name]/` — Specific task logs

**When:** When detailed handover is needed

### Activity Logs (Feature-Specific)

**Location:** Various, per feature

| Feature | Log Location |
|---------|--------------|
| Reddit | `memory/reddit-activity.md` |
| Research | `memory/research-notes/` |
| Reminders | In each reminder's Log section |

---

## Log Format

### Daily Brief Entries

```markdown
## HH:MM — [Session Type]
- What you did (action, not intention)
- Results/outcomes
- Any status changes
- Next steps if relevant
```

**Example:**
```markdown
## 09:30 — CEO Cron
- Reviewed pipeline: 3 apps ready, 2 blocked
- Updated ACTIVE-CONTEXT with QuickNutrition as priority
- Spawned Codex sub-agent for dark mode feature

## 10:15 — Main Session (with user)
- Built LOGGING.md for framework
- Fixed TypeScript errors in BudgetVault
- Decision: Ship framework v0.1.0 after testing

## 10:45 — Heartbeat
- Health check passed, no issues
```

### Session Log Entries (Detailed)

```markdown
# Session Log — YYYY-MM-DD HH:MM

## Context
- What was the goal/task
- What files were involved

## Work Done
1. Step one with details
2. Step two with details

## Files Changed
- `path/to/file.md` — what changed

## Decisions Made
- Decision and reasoning

## Handover Notes
- What the next session needs to know
```

---

## What to Log

### Always Log

✅ Completed tasks
✅ Decisions made (and why)
✅ Files created/modified
✅ Status changes
✅ Blockers encountered
✅ External actions (messages sent, repos created)

### Don't Log

❌ Routine checks with no action ("looked at file, nothing to do")
❌ Internal reasoning (keep logs factual)
❌ Credentials or secrets
❌ Raw data dumps

---

## Log Lifecycle

### Daily Brief

```
1. Created at start of day (first session creates it)
2. All sessions append throughout day
3. Preserved indefinitely (or until cleanup)
```

### Session Logs

```
1. Created when detailed logging needed
2. Written during or after session
3. Archived or deleted based on retention
```

### Creating the Daily Brief

If `memory/daily-brief-YYYY-MM-DD.md` doesn't exist:

```markdown
# Daily Brief — YYYY-MM-DD

*Shared log of all session activity.*

---

```

Then append your entry.

---

## Logging From Different Sessions

### Main Thread

Log:
- Work done with user
- Decisions made together
- Files changed
- Anything crons should know about

### Task/Cron Sessions

Log:
- Task executed
- Results/outcomes
- Any issues encountered
- Status updates

### Heartbeat

Log (only if action taken):
- Issues found and fixed
- Alerts raised
- Health check results (if notable)

If no action: Just append `## HH:MM — Heartbeat: OK`

---

## Example: Full Day Log

```markdown
# Daily Brief — 2026-02-07

*Shared log of all session activity.*

---

## 03:00 — Self-Maintain Task
- File health check: all files under 15K chars
- No duplicates detected
- No orphaned files

## 04:00 — Auto-Update Task  
- Checked framework repo: no updates available

## 09:00 — CEO Cron
- Reviewed pipeline status
- 3 apps ready for TestFlight
- Updated ACTIVE-CONTEXT: focus on QuickNutrition launch

## 09:30 — Main Session (with user)
- Built framework structure together
- Created: SECURITY.md, CONTEXT.md, LOGGING.md
- Decision: Ship v0.1.0 after testing

## 10:00 — Heartbeat: OK

## 10:30 — Reddit Cron
- Posted helpful comment in r/example
- Logged to memory/reddit-activity.md

## 11:00 — Heartbeat: OK
```

---

## Important Rules

1. **Log facts, not intentions** — "Did X" not "Will do X"
2. **Keep it scannable** — Bullet points, not paragraphs
3. **Include timestamps** — HH:MM at minimum
4. **Session type always** — Who logged this?
5. **Daily brief is shared** — Don't assume only you read it
6. **No secrets in logs** — Ever
