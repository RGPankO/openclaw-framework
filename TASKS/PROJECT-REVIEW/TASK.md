# Task: Project Review

> **This is a template.** Copy to `workspace/TASKS/[PROJECT]-REVIEW/` and customize for your specific project.

## Model

**Use:** `smart_model` (from USER-SETTINGS.md)

## Schedule

Weekly (recommended) — adjust to project pace.

## Role

**Load:** `ROLES/CONSULTANT.md`

## Project Location

- **Repo:** `projects/[name]/repo/`
- **Library:** `projects/[name]/library/`

> ⚠️ Update these paths for your project.

## Purpose

Deep-dive review of a specific project — architecture, code quality, performance, opportunities. Not a general workspace audit (that's CONSULTANT). This focuses on one project's internals.

## Customization Guide

Before using this template, tailor it to your project:

- **What stack?** Add specific checks (e.g. "review SQL queries for N+1", "check bundle size")
- **What matters?** Prioritize what the project cares about (speed? cost? security? UX?)
- **What's the scope?** Full codebase or specific areas?
- **Known pain points?** Add them so the reviewer checks on progress

## Instructions

### 1. Read HANDOFF.md and CONTEXT.md

Know what was found last time. Don't repeat unchanged findings — focus on what's new.

### 2. Review Architecture

- Is the structure clean and maintainable?
- Are there obvious scaling concerns?
- Is there unnecessary complexity?
- Are dependencies up to date and justified?

### 3. Review Code Quality

- Any code smells, duplication, or dead code?
- Are error handling and edge cases covered?
- Is the code testable? Are there tests?
- Are there performance bottlenecks?

### 4. Review Opportunities

- Features or optimizations being missed?
- Better tools/libraries for what's being done?
- Quick wins that would improve quality of life?
- Technical debt worth paying down?

### 5. Check Progress

- Compare with previous review — did recommendations get addressed?
- Is the project moving in the right direction?
- Any new risks introduced since last review?

### 6. Write Report

Follow the report format from `ROLES/CONSULTANT.md`. Be specific to this project — code references, file paths, concrete suggestions.

### 7. Notify User

Send a summary with top findings. Full report lives in `runs/`.

## Before Ending

1. Update `HANDOFF.md` — what's new, what's resolved since last review
2. Update `CONTEXT.md` — any new lasting facts about the project
3. Write full report to `runs/YYYY-MM-DD-HHMM.md`

## Success Criteria

- Found at least one actionable improvement specific to the project
- Report references actual code/files, not generic advice
- Didn't repeat stale findings

## Error Handling

- If project is new/minimal — note initial observations and set baseline for future reviews
- If blocked (can't access repo, missing context) — log in HANDOFF.md for next run
