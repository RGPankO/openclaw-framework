# Task: Auto-Update

## Model

**Use:** `worker_model` (from USER-SETTINGS.md)

Git operations and simple diff checks — no complex reasoning needed.

## Schedule

Daily at 04:00 (or user-configured time)

## Role

None required — this is a system maintenance task.

## Purpose

Check for updates to the OpenClaw Framework and notify the user.

## Prerequisites

- `auto_update: true` in user.settings.md
- Framework installed in `workspace/framework/`
- Git available

## Instructions

### 1. Check Current Version

Read version from `workspace/framework/FRAMEWORK.md` or `workspace/framework/VERSION`

Store as: `current_version`

### 2. Fetch Remote (Metadata Only)

**CRITICAL:** Only fetch, do NOT pull yet. Files must stay on current version until user confirms.

```bash
cd ~/.openclaw/workspace/framework
git fetch origin main
```

This downloads commit info but does NOT change any local files.

### 3. Check for Updates

Check if remote has new commits:

```bash
git log HEAD..origin/main --oneline
```

If no new commits → Log "No updates available" and exit.

### 4. Analyze What WOULD Change

**Do NOT pull yet.** Use diff to see what changes would be applied:

```bash
# See commit messages
git log HEAD..origin/main --pretty=format:"%h %s"

# See file changes (stat view)
git diff HEAD..origin/main --stat

# See CHANGELOG specifically
git diff HEAD..origin/main -- CHANGELOG.md
```

### 5. Assess Impact

Categorize changes:
- **Low impact:** Documentation, examples, minor tweaks
- **Medium impact:** New features, new task definitions
- **High impact:** Changes to FRAMEWORK.md, core behavior changes

### 6. Prepare Report

Create update notification:

```markdown
## 🔄 Framework Update Available

**Current:** v[current_version]
**Available:** v[new_version]

### Changes
- [commit summary 1]
- [commit summary 2]
- [commit summary 3]

### Impact Assessment
[Low/Medium/High] — [reason]

### Files Changed
- [file list]

### Recommendation
[Safe to update / Review suggested / Caution advised]

---
Reply "update framework" to apply, or "skip update" to defer.
```

### 7. Apply or Notify

**Check `auto_update_style` in USER-SETTINGS.md:**

- **If `auto_update_style: auto-apply`** — Pull immediately without asking. User trusts auto-updates.
- **If `auto_update_style: brief`** — Pull immediately, notify user after with a brief summary.
- **Otherwise (default)** — Send the report and wait for user confirmation before pulling.

### 8. Pull Update (when approved or auto-applying)

```bash
cd ~/.openclaw/workspace/framework
git pull origin main
```

After pull completes, the framework is updated. Then:
1. Read any migration notes in CHANGELOG.md
2. Check if user.settings.md needs new fields
3. **CRITICAL: Full Framework Wiring Check** (see step 8b)
4. Notify user: "Framework updated to v[new_version]. [any action needed]"

### 8b. Framework Wiring Check (ALWAYS after pulling)

After every framework update, verify the instance is fully wired:

1. **Check all framework docs are referenced where needed:**
   - Read `framework/TASKS/README.md` — are all referenced docs present?
   - Read `framework/docs/` — any new docs that tasks should reference?

2. **Check cron prompts match framework expectations:**
   - Do all cron prompts start with "Read framework/TASKS/README.md for execution rules"?
   - Do built-in task crons (Self-Maintain, Auto-Update) point to `framework/TASKS/[NAME]/TASK.md`?

3. **Check for new framework features that need wiring:**
   - New docs in `framework/docs/` → should they be referenced in task files?
   - New settings in `framework/USER-SETTINGS.example.md` → update instance `USER-SETTINGS.md`?
   - New task templates → do existing tasks need updating?

4. **Check example files match reality:**
   - `framework/TASKS/EXAMPLE/TASK.md` — is it still accurate?
   - `framework/USER-SETTINGS.example.md` — does it cover all current settings?

5. **Report any discrepancies** in the update notification. If auto-applying, fix what you can and report what needs manual attention.

### 9. Log the Update

Log to: `memory/YYYY-MM-DD.md`

```
## Framework Update [HH:MM]
- Previous: v[old]
- Updated to: v[new]
- Changes: [summary]
```

## Success Criteria

- Update check completed
- User notified of available updates (if any)
- Updates applied per `auto_update_style` setting
- Update applied cleanly

## Error Handling

If git operations fail:
- Log the error
- Notify user: "Framework update check failed: [error]"
- Don't retry automatically

If update fails mid-way:
- Log state
- Notify user with recovery steps
- Don't leave repo in broken state

## Logging

Log to: `memory/YYYY-MM-DD.md`

Format:
```
## Auto-Update Check [HH:MM]
- Status: [No updates / Update available / Update applied]
- [Details if relevant]
```

## When Auto-Update is OFF

If `auto_update: false` in USER-SETTINGS.md:
- This task should not be scheduled
- User can still manually update: "Update the framework"
