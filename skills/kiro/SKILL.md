---
name: kiro
description: Create and execute Kiro-style structured specs and tasks. Use when asked to create a Kiro spec (requirements.md, design.md, tasks.md) for a project, or when asked to execute Kiro tasks from an existing spec. Kiro specs break down projects into structured requirements, design decisions, and incremental implementation tasks.
---

# Kiro Specs

Kiro is a structured planning and execution format that breaks projects into three phases:
1. **Spec Creation** -- requirements.md → design.md → tasks.md
2. **Task Execution** -- implement tasks incrementally from the spec

## When to Create a Spec

Read `references/KIRO_SPEC_GUIDE.md` for the full guide on creating specs.

Create a spec when:
- Starting a new feature or project
- The task has multiple moving parts that benefit from upfront planning
- You need to break a large build into incremental, testable steps

Output goes in a `.kiro/specs/[feature-name]/` directory:
- `requirements.md` -- user stories with acceptance criteria
- `design.md` -- technical design (schema, APIs, components)
- `tasks.md` -- ordered implementation tasks with file changes

## When to Execute Tasks

Read `references/KIRO_TASK_EXECUTION_GUIDE.md` for the full execution guide.

Execute tasks when:
- A Kiro spec already exists and you're told to implement it
- You're resuming work on a partially-completed spec

### Test Generation

Kiro tasks may include test steps. Follow this policy:

- **If the calling task/user specifies whether to generate tests** -- follow that instruction.
- **If not specified** -- default to **no tests**. Skip test-related steps in the spec.
- **If unsure** -- ask the user before generating tests.

This avoids wasting time on tests when the project doesn't need them or when a simpler model is executing.

## Key Principles

- Execute tasks **in order** -- each builds on the previous
- Mark tasks done as you complete them (change `[ ]` to `[x]`)
- One task at a time -- commit/verify before moving to next
- If a task is blocked, note why and move to the next unblocked task
