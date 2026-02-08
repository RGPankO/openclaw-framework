# Task: Reminder

## Model

**Use:** `worker_model` (from USER-SETTINGS.md)

This is a simple execution task — read file, check time, send message. No complex reasoning needed.

## Schedule

Every 30 minutes

## Role

None required — this is an execution task.

## Purpose

Check active reminders and send notifications when scheduled.

## Prerequisites

- `reminders: true` in USER-SETTINGS.md
- `workspace/reminders/` directory exists

## Instructions

### 1. Get Current Time

Note the current date and time in user's timezone.

### 2. Check for Active Reminders

List files in `workspace/reminders/`:

```bash
ls ~/.openclaw/workspace/reminders/*.md
```

If no files → Log "No active reminders" and exit.

### 3. Process Each Reminder

For each reminder file:

#### a. Read the File
Parse the reminder structure (see REMINDERS.md for format)

#### b. Check Status
- If PAUSED or COMPLETED → Skip
- If ACTIVE → Continue

#### c. Check Schedule
Read the Schedule section. This should have explicit times.

Compare current time against schedule:
- Is it time to remind? → Send notification
- Not yet? → Skip

**Important:** The main agent created explicit schedules. Follow them literally. Don't "figure out" when to remind.

#### d. Send Notification
If time to remind:

1. Read the Message section
2. Send via communication channel (Telegram, etc.)
3. Log in the reminder file's Log section:
   ```
   - YYYY-MM-DD HH:MM — Sent reminder
   ```

#### e. Check for Confirmation
Look in recent messages (last 30 min) for confirmation keywords from the reminder's Confirmation section.

If confirmed:
1. Log: `- YYYY-MM-DD HH:MM — User confirmed: "[message]"`
2. Follow After Confirmation instructions
3. Check Completion Criteria — if met, set status to COMPLETED

### 4. Handle Completed Reminders

If a reminder's Completion Criteria is met:
1. Set status to COMPLETED
2. Move to archive (optional) or leave for user to clean up
3. Log completion

### 5. Final Log

Log summary to `memory/YYYY-MM-DD.md`:

```
## Reminder Task [HH:MM]
- Checked: X reminders
- Sent: Y notifications
- Confirmed: Z
```

## Success Criteria

- All active reminders checked
- Notifications sent on schedule
- Confirmations detected and logged
- No duplicate reminders (don't re-send within same window)

## Error Handling

If sending notification fails:
- Log the error in reminder file
- Try again next run
- After 3 failures, flag for user attention

If reminder file is malformed:
- Log error
- Skip that reminder
- Notify user: "Reminder [name] has issues, please check"

## Important Rules

1. **Follow explicit schedules** — Don't improvise timing
2. **Don't over-remind** — Check the Log before sending
3. **Respect quiet hours** — Default 1am-8am, unless reminder says URGENT
4. **Log everything** — Future debugging depends on good logs
5. **Main agent's instructions are law** — You execute, don't interpret

## Quiet Hours

Default: 1am-8am user local time

Unless reminder file explicitly says:
```
Quiet Hours: IGNORE — this is urgent
```

Skip sending during quiet hours. Catch up immediately after.
