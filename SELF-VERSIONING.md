# Self-Versioning

## Overview

An OpenClaw workspace has up to four layers, version-controlled separately:

| Layer | What It Is | Example Repo |
|-------|-----------|--------------|
| **Identity** | Who the agent IS — personality, soul, name | `my-agent` |
| **Instance** | This specific deployment — memory, state, config | `my-agent-work` |
| **Project knowledge** | Agent's context for a project — library, tasks, handoffs | `project-alpha` |
| **Project code** | The actual app/website — deployable, CI/CD ready | `project-alpha-app` |

Project knowledge and code can be combined into one repo for simple projects (see `PROJECTS.md`).

Each layer has its own repo. This lets you:
- Share identity across multiple instances (same agent, different jobs)
- Clone a project into any instance (hand off work to another instance)
- Back up and restore an instance with full memory and continuity

---

## Layer 1: Identity (Shared Across Instances)

The agent's personality files. Shared by all instances of the same agent.

### What to include

```
SOUL.md              # Personality, vibe, communication style
IDENTITY.md          # Name, creature, emoji
USER.md              # About the human
avatar/              # Agent's avatar image (optional)
```

The avatar is part of the agent's identity — it travels with the soul. During setup, the user can generate or provide an avatar image. Store it in `avatar/` alongside the identity files.

### Why separate?

If you run multiple instances (assistant, researcher, supervisor), they all share the same soul. Update SOUL.md once, pull everywhere. Same avatar, same personality, different jobs.

---

## Layer 2: Instance (One Per Deployment)

The state and configuration of THIS specific instance. What makes one deployment different from another.

### What to include

```
AGENTS.md                # Instance-specific session rules
MISSION.md               # This instance's purpose
ACTIVE-CONTEXT.md        # Current priorities
MEMORY.md                # Long-term curated memory
USER-SETTINGS.md         # Feature toggles, model config
TOOLS.md                 # Environment-specific tool notes
HEARTBEAT.md             # Heartbeat checklist
FRAMEWORK-OVERRIDES.md   # Custom framework overrides
memory/                  # Daily memory files, session logs
TASKS/                   # Instance-level tasks only (Self-Maintain, Auto-Update, etc.)
ROLES/                   # Instance-level custom roles
reminders/               # Active reminders
todo/                    # Todo items
```

### What to exclude

```
CREDENTIALS.md           # Sensitive — never commit
SOUL.md                  # Comes from identity repo
IDENTITY.md              # Comes from identity repo
USER.md                  # Comes from identity repo
framework/               # Separate repo (git submodule or cloned)
projects/                # Each project is its own repo
avatar/                  # Binary assets, not worth versioning
```

### .gitignore for instance repo

```gitignore
# Sensitive
CREDENTIALS.md

# Identity (comes from identity repo)
SOUL.md
IDENTITY.md
USER.md

# Separate repos
framework/
projects/

# Binary / generated
avatar/
*.log
.DS_Store
node_modules/
```

### Why include memory?

Memory IS the instance's continuity. When you move an instance to a new machine or hand it to another OpenClaw setup, it should wake up knowing what happened. MEMORY.md and memory/ are the brain — not disposable.

---

## Layer 3: Project Knowledge (One Repo Per Project)

Agent's context for a project — portable to any instance. Any instance can clone it and pick up where the last one left off.

### What to include

```
projects/myproject/
├── library/             # Research, decisions, plans, notes
├── TASKS/               # Project-specific tasks
│   └── BUILD/
│       ├── TASK.md
│       ├── HANDOFF.md
│       ├── CONTEXT.md
│       └── runs/
├── project/             # Code (see Layer 4 — may be separate repo)
└── .gitignore
```

### .gitignore for project knowledge repo

```gitignore
# If code is a separate repo
project/

# OS
.DS_Store
```

### Why tasks live with the project

The task handoffs, run history, and context ARE the project's memory. When another instance clones this project, it gets the full picture:
- What was built so far
- What the current state is
- What needs to happen next
- What was tried and didn't work

Without this, the new instance starts blind.

### Project vs instance tasks

| Task Type | Lives In | Example |
|-----------|----------|---------|
| **Project task** | `projects/myproject/TASKS/` | Building features, code reviews |
| **Instance task** | `workspace/TASKS/` | Self-Maintain, Auto-Update, Reminders |

Rule: if the task is about a specific project, it goes with the project. If it's about keeping the instance healthy, it stays at workspace level.

---

## Layer 4: Project Code (Optional — Separate Repo)

The actual app, website, or deployable artifact. Separate from agent knowledge so it can:
- Be cloned by developers who don't use OpenClaw
- Plug into CI/CD pipelines
- Have its own git history focused on code changes

### When to use a separate code repo

- Project has a build/deploy pipeline
- Code should be shareable with non-OpenClaw developers
- Has its own package.json, Dockerfile, tests
- Multiple people or agents work on the code

### When to keep combined

- Simple project (static site, scripts, research)
- No CI/CD needed
- Prototyping / early stage

See `framework/PROJECTS.md` for details on choosing and setting up either approach.

### .gitignore for code repo

```gitignore
# Environment / secrets
.env
.env.*
!.env.example

# Dependencies
node_modules/
dist/
*.log

# OS
.DS_Store
```

---

## Setting Up

### New instance

```bash
cd ~/.openclaw/workspace-[name]

# 1. Clone identity (shared)
git clone <identity-repo> _identity
cp _identity/SOUL.md _identity/IDENTITY.md _identity/USER.md .
rm -rf _identity

# 2. Clone instance repo (or init new)
git init
git remote add origin <instance-repo>
# ... add files, commit, push

# 3. Clone framework
git clone <framework-repo> framework

# 4. Clone projects
mkdir -p projects
cd projects
git clone <project-repo> myproject
```

### Existing instance (first-time setup)

```bash
cd ~/.openclaw/workspace-[name]

# 1. Init instance repo
git init
# Create .gitignore (see above)
git add AGENTS.md MISSION.md ACTIVE-CONTEXT.md MEMORY.md USER-SETTINGS.md \
       TOOLS.md HEARTBEAT.md FRAMEWORK-OVERRIDES.md memory/ TASKS/ ROLES/ \
       reminders/ todo/ .gitignore
git commit -m "Initial instance backup"
git remote add origin <instance-repo>
git push -u origin main

# 2. Init each project repo
cd projects/myproject
git init
# Move project-specific tasks here if they're at workspace/TASKS/
git add -A
git commit -m "Initial project backup"
git remote add origin <project-repo>
git push -u origin main
```

### Moving project-specific tasks

If project tasks currently live at `workspace/TASKS/MYPROJECT-BUILD/`, move them:

```bash
# Move task into project
mv workspace/TASKS/MYPROJECT-BUILD/ workspace/projects/myproject/TASKS/MYPROJECT-BUILD/

# Update the cron prompt to point to new path:
# Old: "Read TASKS/README.md ... Then read TASKS/MYPROJECT-BUILD/TASK.md"
# New: "Read TASKS/README.md ... Then read projects/myproject/TASKS/MYPROJECT-BUILD/TASK.md"
```

---

## Restoring an Instance

```bash
# 1. Install OpenClaw, configure profile
openclaw configure

# 2. Restore instance files into workspace
cd ~/.openclaw/workspace-[name]
git init
git remote add origin <instance-repo>
git fetch origin
git checkout origin/main -- .
# This pulls all tracked files without requiring an empty directory.
# OpenClaw-created files that conflict will be overwritten with the backed-up versions.

# 3. Set tracking branch
git branch -M main
git branch --set-upstream-to=origin/main main

# 4. Copy identity files
# (from identity repo or manually)

# 5. Clone framework
git clone <framework-repo> framework

# 6. Clone projects
mkdir -p projects
git clone <project-repo> projects/myproject

# 7. Set up crons (from TASKS/ definitions)
# The agent reads TASKS/ and recreates crons on first session

# Done — agent wakes up with full memory and project context
```

---

## Keeping Things Updated

### Instance: commit regularly
The Self-Maintain task handles instance backups as part of its daily run.

Don't blindly `git add -A`. Instead:
1. Run `git status` to see what changed
2. Review changes — update `.gitignore` if new files shouldn't be tracked
3. Stage only what belongs in the instance repo
4. Write a meaningful commit message describing what changed

### Projects: commit after meaningful work
Task runners should commit after each session.

Same principle — `git status` first, review, stage intentionally, write a descriptive commit message. Follow `framework/docs/COMMIT_GUIDELINES.md` for logical grouping.

### Identity: commit when personality evolves
Only changes when SOUL.md, IDENTITY.md, or USER.md are updated.

### Framework: auto-updated
The Auto-Update task handles `git pull` on the framework repo.
