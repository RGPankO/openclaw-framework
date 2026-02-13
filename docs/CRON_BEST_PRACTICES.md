# Cron Best Practices

These principles apply to ALL cron tasks — builders, researchers, consultants, health checkers, everyone.

## Core Principles

### 1. Ship Every Run
Every session must produce a tangible outcome. "Checked status, nothing to do" is never acceptable. If your primary task is blocked, find secondary work. If truly nothing exists, improve documentation or clean up.

### 2. Harvest Before Planting
First thing every run: check if a previous session left unfinished work. Check git status, check for draft files, check HANDOFF for "in progress" items. Finish what's started before starting something new.

### 3. BUILD QUEUE Always Populated
HANDOFF.md must always have a prioritized queue of work. "Waiting for X" is never the top priority — there's always something else to do while waiting.

### 4. Recovery Notes
If you start something you can't finish this session, write explicit recovery instructions in HANDOFF.md:
- What you started and where it is
- What state it's in (e.g., "Codex session X building Y")
- What the next session should do to pick it up
- What "done" looks like

Without recovery notes, the next session wastes time rediscovering context.

### 5. Never Exit With Just a Status Report
"All systems healthy" is not a session outcome — it's a 30-second check. Do the check, then build.

## When Delegating to a Coding Agent

These apply when your task involves delegating code work (e.g., to Codex).

### Right-Sized Tasks
- Too small = context loading overhead exceeds work done
- Too big = won't finish in one session
- Right size = one focused feature, service, or fix (typically one file or module)

### Two Valid Patterns

**Pattern A: Wait and Ship**
Delegate a right-sized task. Wait for it to finish (poll every 30-60s). Review, commit, push. Best when the task fits within your session time.

**Pattern B: Delegate and Sign Off**
Delegate a bigger task. Write detailed recovery notes in HANDOFF. Sign off. Next session harvests the completed work. Best when the task needs 10+ minutes and you've already shipped something this session.

Both patterns are fine. What's NOT fine: delegating, polling twice, then exiting with "still working" and no recovery plan.

### Always Commit Before Ending
Check `git status`. If there are changes, review them, commit with a descriptive message, and push. Uncommitted work is invisible to the next session.
