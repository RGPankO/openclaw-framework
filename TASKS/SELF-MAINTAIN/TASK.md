# Task: Self-Maintain

## Model

**Use:** `worker_model` (from USER-SETTINGS.md)

Simple file checks and cleanup — no complex reasoning needed.

## Schedule

Daily at 03:00 (or user-configured time)

## Role

None required — this is a system maintenance task.

## Purpose

Keep the OpenClaw workspace healthy by detecting and reporting issues before they cause problems.

## Instructions

### 1. Check File Sizes

Scan all .md files in workspace root and key directories:

```
workspace/*.md
workspace/ROLES/*.md
workspace/TASKS/*.md
workspace/framework/*.md
```

**Self-files to always check:**
- AGENTS.md, SOUL.md, IDENTITY.md, USER.md
- MEMORY.md, ACTIVE-CONTEXT.md, MISSION.md
- TOOLS.md, FIXES.md
- USER-SETTINGS.md, FRAMEWORK-OVERRIDES.md
- All files in ROLES/

For each file, check character count:
- ✅ **Green (<15,000):** Healthy
- 🟡 **Yellow (15,000-17,000):** Note for awareness
- 🔴 **Red (18,000-20,000):** Flag for user — needs attention soon
- 💥 **Critical (>20,000):** Alert immediately — file will break agent

### 2. Check for Duplicates

Look for duplicate or near-duplicate content:
- Same instructions appearing in multiple files
- Repeated paragraphs within a file
- Copy-paste artifacts

Flag any findings for user review.

### 3. Check Directory Health

Verify expected directories exist:
- `workspace/projects/`
- `workspace/todo/`
- `workspace/reminders/` (if enabled)
- `workspace/ROLES/`
- `workspace/TASKS/`

Create missing directories if user.settings.md says they should exist.

### 4. Check for Orphaned Files

Look for .md files that aren't referenced anywhere:
- Research files not linked from project pages
- Old TODO files not in archive
- Stale reminder files past their completion date

Flag orphans for user decision (keep/delete).

### 5. Check Stale TODOs

Find TODOs that have been IN_PROGRESS for >7 days:
- May be stuck or forgotten
- Flag for user attention

### 6. Check Completed Reminders

Find reminders with status COMPLETED that are still in active directory:
- Should be archived or deleted
- Clean up or flag

### 7. Check OpenClaw Version

Check if a newer version of OpenClaw is available:

```bash
# Current version
openclaw --version

# Latest available
npm view openclaw version
```

**Read HANDOFF.md first** — if the same version was already reported and user hasn't updated yet, don't report again.

If a new version is available (not previously reported):
- Note the version numbers (current vs available)
- Run `npm view openclaw --json` to check what changed
- Briefly assess: is it a critical security fix, a feature update, or minor?
- Would it help with any known issues in our current setup?
- Include in the report with a short summary
- Write the reported version to HANDOFF.md so next run doesn't repeat

If already up to date or already reported: skip silently.

### 8. Instance Version Control

If the workspace has a git repo initialized (instance backup):

1. Run `git status` to see what changed since last commit
2. Review the changes — if new untracked files appear that shouldn't be committed, update `.gitignore`
3. Stage files that belong in the instance repo (memory, tasks, context, settings, etc.)
4. Commit with a descriptive message summarizing what changed
5. Push if remote is configured

If no git repo is initialized, skip this step silently.

### 8b. Project & Knowledge Repo Backup

Scan all directories under `projects/`. For each project directory:

1. Check if it has a git repo initialized (`git -C <path> rev-parse --git-dir`)
2. **If no repo:** Flag it in the report — every project directory should be version controlled
3. **If repo exists:**
   - Run `git status` — check for uncommitted changes
   - Stage and commit any changes with a descriptive message
   - Push if remote is configured
   - If push fails (no remote), flag in report

Also check subdirectories — projects may have multiple repos (e.g., `project/seo/`, `project/homepage/`, `library/`). Each git root gets its own commit+push.

**Include identity repo** if one exists (check for `SOUL.md`, `IDENTITY.md` in workspace root or a configured identity path).

Report format per repo:
- ✅ Clean (no changes)
- 📦 Committed + pushed (N files changed)
- ⚠️ Committed but no remote
- 🚨 No git repo initialized

### 8c. Framework Compliance Audit

Check that the instance follows the framework correctly:

1. **Framework version:** Compare `framework/` git HEAD with the remote. Flag if behind.
2. **Override audit:** Read `FRAMEWORK-OVERRIDES.md` — list all active overrides. Flag any that contradict core framework rules (README.md, TASKS.md).
3. **Cron prompt check:** For each enabled cron, verify:
   - Built-in tasks point to `framework/TASKS/` for TASK.md (not local copies)
   - Instance state dirs exist (HANDOFF.md, CONTEXT.md, runs/)
   - NOTES.md exists in each task dir
4. **File structure check:** Verify the expected framework structure:
   - `framework/` dir exists and is a git repo
   - Key framework files present (README.md, TASKS.md, FRAMEWORK.md)
   - No stale TASK.md copies in instance task dirs (for built-in tasks)
5. **Divergence detection:** Flag anything that looks like it was copied from framework and modified locally instead of using FRAMEWORK-OVERRIDES.md

Report format:
- Framework version: current hash, behind by N commits (or up to date)
- Overrides: N active (list them)
- Cron health: N/N crons properly configured
- Divergence: any issues found

### 9. Generate Report

Create a summary:

```markdown
## Self-Maintain Report — [Date]

### File Health
- [X] files checked
- [N] files in yellow zone
- [N] files in red zone (action needed)

### Duplicates
- [Findings or "None detected"]

### Directory Health
- [All OK or issues found]

### Orphaned Files
- [List or "None"]

### Stale TODOs
- [List or "None"]

### Version Control
- Instance repo: [status]
- Project repos: [N repos checked, status each]
- Identity repo: [status]

### Framework Compliance
- Framework version: [hash, up to date / behind by N]
- Overrides: [N active]
- Cron health: [N/N OK]
- Divergence: [any issues]

### Recommendations
1. [Action item]
2. [Action item]
```

### 10. Notify User

If any issues found:
- Send summary to user via communication channel
- Include severity level (info/warning/critical)

If all healthy:
- Log "Self-maintain completed, no issues" to daily log
- Don't notify user (no news is good news)

## Success Criteria

- All checks completed
- Issues detected are logged and reported
- No false positives (don't alarm unnecessarily)

## Error Handling

If a check fails:
- Log the error
- Continue with remaining checks
- Include failure in report

## Logging

Log to: `memory/YYYY-MM-DD.md`

Format:
```
## Self-Maintain [HH:MM]
- Files checked: X
- Issues found: Y
- [Summary of issues if any]
```
