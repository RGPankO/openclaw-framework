# Task Execution Rules

**Read this before executing any task.**

## Directory Structure

Every task has two parts:
1. **TASK.md** (task definition) — in `framework/TASKS/[name]/` (built-in) or `workspace/TASKS/[name]/` (custom)
2. **Instance state** — ALWAYS in `workspace/TASKS/[name]/`, never in `framework/`

**Critical:** Framework directory (`workspace/framework/`) is read-only templates. All instance state goes in `workspace/TASKS/[name]/`, even when TASK.md is in `framework/TASKS/[name]/`.

```
# Instance state (ALWAYS in workspace/TASKS/[task-name]/):
HANDOFF.md     # Current state (read first, update at end)
CONTEXT.md     # Long-term project facts (one-liners)
NOTES.md       # User instructions (read and wipe immediately)
USER-TODO.md   # Items that need the USER to do (not you)
runs/          # Session history (append-only logs)

# Task definition (where cron prompt points you):
TASK.md      # Either framework/TASKS/[name]/TASK.md or workspace/TASKS/[name]/TASK.md
```

## Execution Order

The cron tells you: "Read README.md, then read TASK.md"

After reading TASK.md, before doing the work:

1. **Read `HANDOFF.md`** — Understand current state, what happened last time, advice from previous run
2. **Read `CONTEXT.md`** — Long-term project facts
3. **Read `NOTES.md`** — Direct instructions from the user or main session (your manager). **NOTES.md is the highest-priority input.** If notes change direction, reprioritize, or override your previous plan — follow them. They supersede whatever HANDOFF.md says. Deprioritize everything else accordingly.
   - **Immediately wipe NOTES.md** after reading (replace with `# Notes\n`).
   - **Carry forward into HANDOFF.md**: If notes set a new direction or priority shift, reflect that in your HANDOFF.md so the next run continues on the new course (not the old one). Don't let priority changes die with the wipe.
   - Wire lasting knowledge into CONTEXT.md when appropriate.
4. **Optionally read `USER-TODO.md`** — Check if the user completed something you were waiting on. If they did, remove the item and proceed with work that was unblocked.
5. **Optionally scan `runs/`** — If you need more historical context, check recent session logs
6. **If task specifies a Role** — Read the role file mentioned in TASK.md

Then execute the task instructions.

## After Completing

Follow the task's own "Before Ending" steps (if any), then **always** follow the Universal Rules below.

> ⚠️ **Universal Rules are mandatory.** Even if your TASK.md has its own "Before Ending" section, these rules still apply on top. TASK.md steps are additive, not a replacement.

### Universal Rules (apply to ALL tasks, every run, no exceptions)

1. **Update `HANDOFF.md`** with:
   - Current state and advice for next run
   - **REMOVE completed tasks entirely** — done = delete the line, don't strikethrough or mark ✅
   - **Don't document fixes** — if it was broken and you fixed it, delete the bug. Update CONTEXT.md if the fix changed how something works permanently.
   - **Move lasting knowledge to CONTEXT.md or library/** — then remove from handoff
   - Everything in handoff must be actionable for the next agent

2. **Write session log** to `runs/YYYY-MM-DD-HHMM.md`:
   - Detailed log of actions taken
   - Commands run, files changed
   - Decisions made and why
   - Same as your summary + technical details

3. **Update `CONTEXT.md`** — Add any new lasting project facts discovered. If something changed (e.g. migrated database), update the existing line — don't duplicate.

4. **Commit project repo** (if task is inside a project):
   - Run `git status` in the project directory
   - Review changes — update `.gitignore` if needed
   - Stage and commit with a descriptive message (see `framework/PROJECTS.md` for branch workflow)
   - Push if remote is configured

5. **Update `USER-TODO.md`** — If you identified something only the user can do (manual testing, approvals, decisions, logins, purchases), add it here. **Do NOT put user-dependent items in HANDOFF.md's Next Steps** — those are YOUR work only. Never block on USER-TODO items; find other productive work instead. Format: simple checklist.

6. **Send summary to user** — Send your session summary (what you did, key findings, next steps) directly via the message tool. Check `USER-SETTINGS.md` for `delivery_channel` and `delivery_target`. This is **required every run** — cron announce delivery is unreliable, so always send directly. If USER-SETTINGS.md specifies `delivery_channel` and `delivery_target`, use those.

## HANDOFF.md Format

```markdown
# Handoff

## Current State
[Where things stand right now — what works, what's active]

## Last Session
[What was just done — overwrite this section each run, never accumulate]

## Next Steps
[YOUR work — things YOU can do next run. Prioritized, actionable.
 Do NOT put user-dependent items here — those go in USER-TODO.md]

## Watch Out For
[Gotchas, blockers, things to remember]
```

## USER-TODO.md Format

```markdown
# User TODO

- [ ] Test whale bot payment flow (@PolymarketWhaleAlert_bot /subscribe)
- [ ] Approve design change for landing page
- [ ] Log into Stripe and verify webhook endpoint
```

Items only the user can act on. Cron adds items, user/main session removes them when done.

## Session Log Format (runs/)

Filename: `YYYY-MM-DD-HHMM.md`

```markdown
# [Task Name] — YYYY-MM-DD HH:MM

## What I Did
[Summary of work]

## Details
[Commands, files changed, technical specifics]

## Decisions
[Any choices made and why]

## For Next Run
[Anything the next session should know]
```

## Important Rules

1. **HANDOFF.md is forward-looking only** — Remove completed tasks (done = gone), don't document fixes, move lasting knowledge to CONTEXT.md. Everything must be actionable.
2. **runs/ is append-only** — Never delete or modify past logs
3. **Be explicit** — Task agents may use simpler models; leave clear context
4. **Don't exceed scope** — Do the task, don't start unrelated work
5. **Always log** — Every execution should be recorded
6. **Read `framework/docs/CRON_BEST_PRACTICES.md`** — Core principles: ship every run, harvest before planting, always have a build queue, write recovery notes
7. **Never block on user actions** — If something needs the user (manual testing, approvals, logins), put it in USER-TODO.md and move on to other productive work. Your Next Steps should always have things YOU can do.
8. **The main session is your manager** — It sees all cron reports and may leave corrections in NOTES.md. Always check NOTES.md first (step 3 above). The main session has full context you don't have. **When NOTES.md changes your priorities, your HANDOFF.md must reflect that new direction** — otherwise the next run reverts to the old plan and the user's intervention is lost.
