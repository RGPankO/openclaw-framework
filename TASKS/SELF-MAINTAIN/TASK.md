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

### 8. Generate Report

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

### Recommendations
1. [Action item]
2. [Action item]
```

### 9. Notify User

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
