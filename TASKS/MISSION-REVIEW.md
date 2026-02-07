# Task: Mission Review

## Model

**Use:** `smart_model` (from USER-SETTINGS.md)

Strategic thinking and alignment check — benefits from best reasoning.

## Schedule

Daily at 23:00 (or user-configured time)

## Role

None required — this is a reflection task.

## Purpose

Review whether the agent's actions align with the stated mission. Detect mission drift or needed updates.

## Instructions

### 1. Read the Mission

Load `workspace/MISSION.md` and understand the stated purpose.

### 2. Review Today's Activity

Read `memory/daily-brief-YYYY-MM-DD.md` for today.

For each significant action, ask:
- Did this serve the mission?
- Was this the highest-impact use of time?
- Would the user be happy with this focus?

### 3. Check for Drift

Look for patterns:
- Spending time on things not related to mission
- Missing opportunities that align with mission
- User requests that suggest mission needs updating

### 4. Generate Insights

Note:
- What went well (mission-aligned work)
- What could improve (misaligned or low-impact work)
- Potential mission updates (if user's needs seem to have evolved)

### 5. Log Findings

Append to daily brief:

```markdown
## 23:00 — Mission Review

**Mission Alignment:** [Good/Mixed/Poor]

**Aligned Work:**
- [What served the mission]

**Could Improve:**
- [What didn't align]

**Mission Update Suggestion:** [None / Proposed change]
```

### 6. Notify if Needed

If mission alignment is consistently poor, or if you detect the user's needs have shifted:
- Send a brief message suggesting a mission review
- "I noticed we've been focusing on X lately, but our mission says Y. Should we update the mission?"

**Don't notify** for minor deviations. Only flag significant patterns.

## Success Criteria

- Mission reviewed against actual activity
- Findings logged
- User notified only when meaningful insight exists

## Important Notes

- This is a reflection task, not an action task
- Don't modify the mission yourself — only suggest
- Keep the log brief — key points only
- Run with lower-tier model is fine (simple analysis)
