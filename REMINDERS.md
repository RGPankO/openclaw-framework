# Reminder System

## Overview

Reminders notify the user about time-sensitive things. The **main agent creates** detailed reminder files; the **reminder task executes** them.

## How It Works

1. User asks for a reminder
2. Main agent (high intelligence) creates a detailed reminder file
3. Reminder task (runs every 30 min) checks reminder files
4. Task agent follows the explicit instructions in each file
5. Sends notifications via configured channel (Telegram, etc.)

## Directory

```
workspace/reminders/
├── take_pills_daily.md
├── dentist_appointment_feb15.md
└── temu_credits_expires_feb14.md
```

## Reminder File Structure

```markdown
# Reminder: [Title]

**Status:** ACTIVE | PAUSED | COMPLETED
**Created:** 2026-02-07 14:30
**Type:** ONE_TIME | RECURRING | UNTIL_CONFIRMED

## Schedule

[EXPLICIT instructions for when to remind — the task agent should NOT need to figure this out]

Examples:
- "Send reminder at 09:00, 14:00, and 19:00 daily"
- "Remind on 2026-02-14 at 18:00, then again at 21:00 if not confirmed"
- "Remind every morning at 08:30 until user confirms"

## Message

[Exact message to send to user]

Example: "💊 Time to take your pills!"

## Confirmation

[How the user confirms — what to listen for]

Example: "User says 'done', 'took them', 'pills taken', or similar"

## After Confirmation

[What happens after user confirms]

Example: "For today's 09:00 dose, mark as confirmed. Resume reminding at 14:00 for afternoon dose."

## Completion Criteria

[When this reminder is fully done]

Example: "After 7 days (by 2026-02-14)" or "Never — recurring daily forever"

## Log

[Task agent logs actions here]

- 2026-02-07 09:00 — Sent morning reminder
- 2026-02-07 09:45 — User confirmed (2 reminders sent)
- 2026-02-07 14:00 — Sent afternoon reminder
```

## Creating Reminders (Main Agent)

When user asks for a reminder, YOU do the thinking:

### Be Specific
❌ "Remind intelligently based on appointment time"
✅ "Remind on Feb 14 at 18:00, Feb 14 at 21:00 if not confirmed, Feb 15 at 07:00 final reminder"

### Consider Context
- Appointment at 8am? Remind evening before + morning of
- Created 2 weeks early? Maybe a 3-day-before heads up too
- Daily task? Specify exact times, not "a few times a day"

### Tell the User Your Plan
After creating, explain:
> "I've set up your reminder for the dentist appointment:
> - Feb 14 at 6pm (evening before)
> - Feb 14 at 9pm if you haven't confirmed
> - Feb 15 at 7am (morning of)
> 
> Want me to adjust the timing?"

### The Task Agent is Simple
Write instructions so clear that a simple agent can execute them without reasoning about "what would be appropriate."

## Reminder Task Execution

The reminder task (cron every 30 min):

1. Read `workspace/reminders/` for ACTIVE reminders
2. For each reminder:
   - Read the Schedule section
   - Check current time against schedule
   - If time to remind → send Message via communication channel
   - Log the action
3. Check for user confirmations in recent messages
4. Update logs accordingly

## Common Patterns

### Daily Medication
```
Schedule: Remind at 09:00, 14:00, 19:00 daily
Type: RECURRING
Confirmation: User confirms each dose separately
After: Mark that dose done, continue to next scheduled time
```

### One-Time Appointment
```
Schedule: 
- 3 days before at 10:00 (heads up)
- Evening before at 18:00
- Evening before at 21:00 if not confirmed  
- Morning of at 07:00 (final)
Type: ONE_TIME
Completion: After appointment time passes
```

### Limited Duration (Temu example)
```
Schedule: Remind at 09:00, 14:00, 19:00, 22:00 daily
Type: UNTIL_CONFIRMED (daily) with end date
Confirmation: "claimed" or "done" marks today complete
Completion: After 7 days (2026-02-14)
```

## Archiving Completed Reminders

When a reminder is marked COMPLETED:
1. Create `workspace/reminders/archive/` if it doesn't exist
2. Move the file: `reminders/[name].md` → `reminders/archive/[name].md`
3. This keeps the active directory clean and saves tokens (cron only scans active files)

**Who archives:**
- **Task agent (cron):** After marking a reminder COMPLETED, move it to archive immediately
- **Main agent:** When user confirms a reminder in conversation ("done", "took them", etc.), mark COMPLETED and move to archive

## Main Agent: Handling Confirmations

When the user says they've completed something related to an active reminder:
1. Read the reminder file
2. Update status to COMPLETED
3. Add final log entry
4. Move to `reminders/archive/`
5. Confirm to user: "Marked [reminder] as done"

## Important Rules

1. **Main agent thinks, task agent executes** — All intelligence goes into file creation
2. **Explicit schedules** — No "remind appropriately", give exact times
3. **Log everything** — Task agent logs all actions for debugging
4. **Respect quiet hours** — Default: no reminders 1am-8am unless urgent
5. **User can pause** — "Pause the pills reminder" → set status to PAUSED
6. **Archive completed reminders** — Move to `reminders/archive/` immediately after completion
