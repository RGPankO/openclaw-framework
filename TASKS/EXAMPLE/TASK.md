# [Task Name]

> Copy this template to `workspace/TASKS/[NAME]/TASK.md` and customize.

## Project Location

<!-- If this task works on a specific project -->
- **Read `projects/[name]/project/README.md`** first — maps sub-projects, repos, deployment
- **Repo:** `projects/[name]/project/`
- **Library:** `projects/[name]/library/`

<!-- If no specific project, remove this section -->

## Role

<!-- Which role file defines behavior for this task -->
Read `ROLES/[ROLE].md` for behavioral context.

## Schedule

<!-- How often this runs — for reference, actual schedule is in cron config -->
Every [X hours/minutes] | Daily at [time] | etc.

## Purpose

<!-- One-line description of what this task accomplishes -->
[What this task does and why it exists]

## Before Starting

1. **Harvest first** — Check for unfinished work from last run (git status, draft files, HANDOFF "in progress" items). Finish what's started before starting something new.
2. Read `HANDOFF.md` — current state from last run
3. Read `NOTES.md` — user instructions (wipe after reading)
4. Optionally scan `runs/` for additional historical context
5. Check project `library/` if working on a specific project
6. If project has `project/README.md` (multi-repo project), read it to understand sub-project layout and ownership

Also read `framework/docs/CRON_BEST_PRACTICES.md` for operational principles.

## Instructions

<!-- The actual work to do each run. Key principles:
     - Ship every run (never exit with just a status report)
     - BUILD QUEUE always populated in HANDOFF.md
     - "Waiting for X" is never priority 1
     - If delegating to Codex: right-sized tasks, wait or write recovery notes
-->

### Step 1: [First thing]
[Details]

### Step 2: [Second thing]
[Details]

### Step 3: [Third thing]
[Details]

## Before Ending

1. **Update `HANDOFF.md`** with:
   - What you did this session
   - Current state
   - Advice for next run
   - Remove any stale/outdated information

2. **Write session log** to `runs/YYYY-MM-DD-HHMM.md`:
   - Detailed log of actions taken
   - Commands run, files changed
   - Decisions made and reasoning

3. **Update project library** if you learned something lasting:
   - New research → `library/research.md`
   - Key decision → `library/decisions.md`
   - Future plans → `library/plans.md`
   - Other notes → `library/notes.md`

4. **Commit project changes** (if working on a project with git):
   ```bash
   cd projects/[name]
   git add -A
   git commit -m "[task]: brief session summary"
   ```
   Do NOT push — Self-Maintain handles nightly pushes.

5. **Send summary to user** — Before ending, send your session summary (what you did, key findings, next steps) directly via the message tool. Check `USER-SETTINGS.md` for delivery channel and target. This is required — cron announce delivery is unreliable.

## Success Criteria

<!-- How to know the task completed successfully -->
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Error Handling

<!-- What to do if something fails -->
- If [X fails]: [Do Y]
- If blocked: Log the blocker in HANDOFF.md for next run
