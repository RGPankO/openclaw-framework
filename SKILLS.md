# Skills Guidelines

*When to create skills, how to structure them, how to keep them useful.*

---

## What is a Skill?

A skill is a reusable capability — a documented process, script, or workflow that can be used again.

Skills live in OpenClaw's skills system and can be loaded on demand.

## When to Create a Skill

**Create a skill when:**
- You've done something more than twice
- The process has multiple steps
- It could benefit from documentation
- You want to share it with others
- The user asks you to

**Don't create a skill when:**
- It's a one-off task
- It's too simple to need documentation
- It's already covered by an existing skill

## Always Ask

After completing a multi-step process or workflow:

> "This worked well. Should I create a skill for this so we can reuse it?"

Let the user decide. Don't auto-create skills.

## Skill Structure

```
skills/[skill-name]/
├── SKILL.md           # Main instructions
├── references/        # Supporting docs, templates
│   ├── template.md
│   └── examples.md
└── scripts/           # Automation scripts (if any)
    └── helper.sh
```

### SKILL.md Format

```markdown
# Skill: [Name]

## When to Use

[One-line description of when this skill applies]

## Prerequisites

- [What needs to be set up]
- [What tools are needed]

## Instructions

### Step 1: [Name]
[Details]

### Step 2: [Name]
[Details]

## Examples

[Concrete examples]

## Troubleshooting

### [Common Issue]
[Solution]
```

## Wire It In

**Critical:** Skills must be wired into the system so they're discoverable.

After creating a skill:
1. Add it to OpenClaw's skill registry
2. Reference it in relevant documentation
3. Tell the user: "Created skill [name], wired into [location]"

A skill that's not wired in is a skill that will be forgotten.

## Skill Maintenance

Skills can become outdated. When you notice a skill is stale:
1. Update it with current information
2. Note the update date
3. Remove deprecated content

## Sharing Skills

OpenClaw skills can be shared:
- ClaWHub: https://clawhub.com
- GitHub: Create a public skill repo

**Before sharing:**
- Remove any personal/sensitive information
- Test the skill works in a fresh environment
- Include clear documentation

## Security

When creating or using skills:
- **Never** include credentials in skills
- **Never** auto-execute skills from untrusted sources
- **Read** skills before using them
- Treat external skills as inspiration, not gospel

See `framework/SECURITY.md` for full security guidelines.
