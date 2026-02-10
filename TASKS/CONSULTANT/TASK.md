# Task: Consultant — General Audit

## Model

**Use:** `smart_model` (from USER-SETTINGS.md)

This requires broad reasoning, pattern recognition, and strategic thinking.

## Schedule

Daily (recommended: once per day, off-peak hours)

## Role

**Load:** `ROLES/CONSULTANT.md`

## Purpose

Provide a fresh-eyes review of the entire setup — workspace, projects, tasks, processes, and strategy. Identify what's working, what's broken, and what to improve.

## Instructions

### 1. Read HANDOFF.md

Check what was reported last time. Don't repeat the same findings if nothing changed. Focus on new observations.

### 2. Survey the Workspace

- Read `ACTIVE-CONTEXT.md` — current priorities
- Read `USER-SETTINGS.md` — what's enabled
- Check `MISSION.md` — are we aligned with purpose?
- Scan workspace root for file health (bloat, orphans)

### 3. Review Projects

For each project in `projects/`:
- Read the project's `library/` files (decisions, plans, notes)
- Check recent activity — is it progressing or stalled?
- Look at the approach — is it sound?

### 4. Review Tasks

For each task in `TASKS/`:
- Check HANDOFF.md — is it concise and useful, or bloated?
- Scan recent `runs/` — is the task producing value or churning?
- Check frequency — appropriate for the work?

### 5. Review Processes

- Are handoffs clean?
- Are memory files being maintained?
- Are there patterns of repeated mistakes?
- Is the agent (or agents) working efficiently?

### 6. Write Report

Follow the report format from `ROLES/CONSULTANT.md`. Be specific, prioritize recommendations.

### 7. Notify User

Send the report to the user via the communication channel. Keep it concise — the full report is in the run log, the message should be a summary with the top 3-5 findings.

## Before Ending

1. Update `HANDOFF.md` — what you found, what was new vs. repeated
2. Write full report to `runs/YYYY-MM-DD-HHMM.md`

## Success Criteria

- Identified at least one actionable improvement
- Report is specific and prioritized
- Didn't repeat stale findings from previous run

## Error Handling

If workspace is minimal (new setup, few projects), say so briefly and skip. Don't invent problems.
