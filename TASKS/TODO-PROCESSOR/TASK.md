# Task: TODO Processor

*Framework default task for processing TODO items.*

---

## Model

**Use:** `smart_model` (from USER-SETTINGS.md)

TODOs may require complex reasoning, coding, or decision-making. Use the smart model.

**For coding TODOs:** Delegate to `coding_agent` (Codex CLI):
```bash
codex --yolo exec "[task]. When done: openclaw system event --text \"Done: [summary]\" --mode now"
```

## Schedule

Every 2 hours (cron: `0 */2 * * *`)

## Purpose

Pick up TODO items from `workspace/todo/` and work on them.

## Instructions

1. **Read TODO files:**
   ```bash
   ls ~/.openclaw/workspace/todo/*.md
   ```

2. **Pick highest priority:**
   - URGENT > HIGH > MEDIUM > LOW
   - Within same priority: oldest first (by filename date)
   - Skip items marked IN_PROGRESS by other sessions

3. **Work on it:**
   - Read the TODO file for instructions
   - Execute what's asked
   - Update status: NEW → IN_PROGRESS → DONE

4. **Log progress:**
   ```bash
   echo "## $(date +%H:%M) — TODO Processor
   - Worked on: [TODO title]
   - Result: [what you did]" >> memory/daily-brief-$(date +%Y-%m-%d).md
   ```

5. **Complete or handover:**
   - If done: Move to `todo/archive/`
   - If blocked: Add note to file, leave for next run

## Rules

- Work on ONE TODO per run (max 15 min)
- If nothing needs attention: reply HEARTBEAT_OK
- Never work on items marked "WAITING_ON_HUMAN"

## Related

- TODO format: See `framework/TODO.md`
- Logging: See `framework/LOGGING.md`
