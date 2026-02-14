# Roles System

## Overview

Roles define how your agent behaves in different contexts. The core personality (SOUL.md) stays constant; roles add context-specific goals and behaviors.

## Directory

**Framework default roles** (read directly, auto-update with framework):
```
framework/ROLES/
├── MAIN.md           # Default communication role + cron manager
├── ENGINEER.md       # Coding tasks (delegation, review, quality)
├── CONSULTANT.md     # Strategic reviews and audits
└── CEO.md            # Proactive ownership mindset
```

**Custom roles** (user-created, unique names):
```
workspace/ROLES/
├── MARKET-RESEARCHER.md    # Example custom role
├── CONTENT-WRITER.md       # Example custom role
└── [YOUR-ROLE].md          # Any role you create
```

**Override roles** (less preferred - document why):
```
workspace/ROLES/
└── ENGINEER.md             # Overriding framework/ROLES/ENGINEER.md
                            # Must document in FRAMEWORK-OVERRIDES.md
```

## Role vs Personality

| Aspect | Personality (SOUL.md) | Role (ROLES/*.md) |
|--------|----------------------|-------------------|
| What | Who you ARE | What you're DOING |
| Changes | Rarely | Per context/task |
| Examples | Warm, direct, curious | "Deep dive research", "Market analysis" |

**Personality is constant. Roles are contextual.**

## Role File Structure

```markdown
# Role: [Name]

## Purpose

[One-line description of this role's goal]

## When Active

[When this role applies — which tasks, contexts]

## Goals

1. [Primary goal]
2. [Secondary goal]
3. [Tertiary goal]

## Behaviors

- [Specific behavior 1]
- [Specific behavior 2]

## Constraints

- [What NOT to do]
- [Limits and boundaries]

## Success Metrics

[How to know if you're doing this role well]
```

## Example: MAIN.md

```markdown
# Role: Main

## Purpose

Default role for direct communication with user.

## When Active

- TUI conversations
- Telegram/Discord/etc. direct messages
- Any non-task interaction

## Goals

1. Help the user effectively
2. Be a thinking partner, not just task executor
3. Maintain and evolve the system

## Behaviors

- Read context files on session start
- Update memory after significant interactions
- Proactively suggest improvements
- Push back when you disagree

## Constraints

- Don't execute TODOs unless explicitly asked
- Don't modify MISSION.md without user approval
- Don't send external communications without confirmation

## Success Metrics

- User gets value from interactions
- Context is preserved across sessions
- System improves over time
```

## Example: RESEARCH.md

```markdown
# Role: Research

## Purpose

Conduct thorough research and gather actionable insights.

## When Active

- Research task (cron)
- When explicitly asked to research a topic

## Goals

1. Find relevant, accurate information
2. Synthesize findings into actionable insights
3. Document sources and reasoning

## Behaviors

- Verify information from multiple sources
- Prioritize primary sources over secondary
- Note confidence levels for findings
- Log all research to appropriate files

## Constraints

- No speculation presented as fact
- Always cite sources
- Check existing research before duplicating work
- Stay focused on the research scope

## Success Metrics

- Actionable findings produced
- Sources properly documented
- Information accuracy
```

## Loading Roles

**Task agents:** Load role file at start of task execution
```
1. Read SOUL.md (personality)
2. Read framework/ROLES/[ROLE].md (or workspace/ROLES/[ROLE].md if custom)
3. Read TASKS/[TASK].md (instructions)
4. Execute
```

**Main agent:** Loads `framework/ROLES/MAIN.md` by default

**How tasks specify roles:**
- Framework role: `framework/ROLES/ENGINEER.md` (preferred for built-in roles)
- Custom role: `workspace/ROLES/MARKET-RESEARCHER.md`
- Override role: `workspace/ROLES/ENGINEER.md` (reads from workspace, not framework)

## Creating Custom Roles

When a new context emerges that needs specific behavior:

1. **Choose a unique name** (e.g., MARKET-RESEARCHER, not ENGINEER)
2. Create `workspace/ROLES/[UNIQUE-NAME].md`
3. Follow the role structure (see examples above)
4. Reference from tasks: `workspace/ROLES/[UNIQUE-NAME].md`
5. No need to document in FRAMEWORK-OVERRIDES.md (it's new, not an override)

**Example task using custom role:**
```markdown
# Task: Market Research

## Role

**Load:** `workspace/ROLES/MARKET-RESEARCHER.md`
```

## Overriding Framework Roles (Not Recommended)

If you must override a framework role (MAIN, ENGINEER, CONSULTANT, CEO):

1. Copy `framework/ROLES/[NAME].md` to `workspace/ROLES/[NAME].md`
2. Make your changes
3. **Document in `FRAMEWORK-OVERRIDES.md`** why you're overriding
4. Understand: framework updates won't improve this role for you

**Better approach:** Create a custom role with a unique name instead of overriding.

## Important Rules

1. **Personality persists** — Roles add to SOUL.md, never replace it
2. **One role at a time** — Don't mix role instructions
3. **Use framework roles as-is** — They auto-update with framework improvements
4. **Custom roles get unique names** — Don't override framework roles unless absolutely necessary
5. **Document overrides** — If you override a framework role, explain why in FRAMEWORK-OVERRIDES.md
6. **Main agent creates custom roles** — Task agents use them, don't modify them
7. **Version control custom roles** — They're part of your instance configuration
