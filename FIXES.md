# Fixes Log

*Institutional memory for bugs and problems solved.*

---

## Purpose

When you fix a bug, solve a tricky problem, or figure out a non-obvious workaround, log it here. This prevents:

- Future sessions (including yourself after compaction) rediscovering the same issue
- Repeating failed approaches
- Wasting time on already-solved problems

## Who Maintains This

**Everyone.** All sessions (main + crons) should:
- **Read** FIXES.md when encountering errors or unexpected behavior
- **Add** entries after fixing non-trivial bugs
- **Update** entries if a fix changes or becomes obsolete
- **Remove** entries that no longer apply (e.g., fixed by framework update)

## File Health

This file is subject to the same size limits as other self-files:
- ✅ Green (<15,000 chars) — Healthy
- 🟡 Yellow (15,000-17,000) — Consider pruning old entries
- 🔴 Red (18,000-20,000) — Prune aggressively
- 💥 Critical (>20,000) — Will break agent context

**Pruning strategy:** Remove fixes that are:
- No longer relevant (underlying issue fixed upstream)
- Very old (>6 months) and never referenced
- Specific to a project that's been archived

## Entry Format

```markdown
### [Short Description]
**Date:** YYYY-MM-DD
**Symptom:** What went wrong / what error appeared
**Cause:** Why it happened (root cause)
**Fix:** What solved it
**Applies to:** [scope — e.g., "all projects", "mobile-skeleton", "specific to X"]
```

## Example Entries

### Git push rejected after rebase
**Date:** 2026-02-10
**Symptom:** `git push` fails with "non-fast-forward" after interactive rebase
**Cause:** Rebase rewrites history, remote has different commits
**Fix:** `git push --force-with-lease` (safer than `--force`)
**Applies to:** All git repos

### npm install fails with ERESOLVE
**Date:** 2026-02-08
**Symptom:** `npm install` fails with peer dependency conflicts
**Cause:** Conflicting version requirements between packages
**Fix:** Try `npm install --legacy-peer-deps` or resolve conflicts manually
**Applies to:** React Native / Expo projects

---

## Fixes Log

*(Add new entries below this line, newest first)*

