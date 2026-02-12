# Projects Directory

## Rule

All project work goes in `workspace/projects/`.

**Never** clone repos or create projects directly in workspace root. It clutters the main directory and makes navigation harder.

## Directory Structure

Each project has a standardized structure:

```
workspace/projects/
├── my-saas/                    # Code repo is separate
│   ├── project/                # Actual code (its own git repo, CI/CD, deployable)
│   ├── library/                # Agent's knowledge about the project
│   │   ├── research.md
│   │   ├── decisions.md
│   │   ├── plans.md
│   │   └── notes.md
│   └── TASKS/                  # Project-specific tasks
│       └── BUILD/
├── my-landing-page/            # Code lives with knowledge (single repo)
│   ├── project/                # Simple site, no separate CI needed
│   ├── library/
│   └── TASKS/
└── market-research/            # Non-code project
    ├── project/                # Research docs
    ├── library/
    └── TASKS/
```

## Scaling: Single Repo to Multi-Repo

The `project/` directory is always the boundary for code. It starts simple and grows naturally.

### Single repo (default)

Code lives directly in `project/`:

```
projects/my-saas/
├── project/                # One git repo
│   ├── src/
│   ├── package.json
│   └── ...
├── library/
└── TASKS/
```

### Multi-repo (when the project grows)

When a project needs multiple deployable components (e.g., API + dashboard, detector + bot), create named subdirectories inside `project/`:

```
projects/my-platform/
├── project/
│   ├── api/               # Git repo 1
│   ├── dashboard/         # Git repo 2
│   ├── mobile/            # Git repo 3 (paused — user refactoring)
│   └── README.md          # Map: what's what, who owns what
├── library/
└── TASKS/
```

**Rules:**
- `project/README.md` documents all sub-projects: what they are, which are active, which are paused, who's working on what
- When a sub-project is "owned" by someone (user, another agent, external tool), note it in README.md so crons don't touch it
- TASKS/ and library/ stay at project level — they provide shared context across all sub-projects
- Start with flat `project/` — only nest when you actually add a second component
- TASK.md should reference `project/README.md` so task agents know to read it before working

**Migration from flat to nested:**
1. Move `project/` contents into `project/[original-name]/`
2. Create `project/[new-component]/`
3. Add `project/README.md` documenting both
4. Update TASK.md, CONTEXT.md, and cron prompt paths

---

## Version Control: Separate Code or Combined?

A project's `project/` directory (the actual code/website) can be version-controlled two ways:

### Option A: Separate code repo (recommended for apps)

`project/` is its own git repo — cloned, pushed, and deployed independently. A developer with no knowledge of OpenClaw can clone it and work on it. Suitable for CI/CD pipelines.

The project knowledge repo (library/, TASKS/) gitignores `project/`:

```gitignore
# project/ is its own repo
project/
```

**Use when:**
- Project has a build/deploy pipeline
- Code should be shareable with non-OpenClaw developers
- Project has its own package.json, Dockerfile, tests, etc.
- Multiple people or agents may work on the code

### Option B: Combined repo (simpler)

Everything — code, library, tasks — lives in one repo. Simpler setup, less overhead.

**Use when:**
- Simple project (static site, scripts, research)
- No CI/CD pipeline needed
- Solo agent, no external collaborators
- Prototyping / early stage

### How to decide

When creating a project, ask the user: *"Should the code be its own repo (for CI/CD, external collaboration) or keep everything together?"*

If the user doesn't have a preference, decide based on the project:
- Has package.json, Dockerfile, or deploy config → **separate**
- Static site, research, or simple scripts → **combined**

Record the decision in `library/decisions.md`.

---

## The Three Elements

### 1. project/ (The Work)

The actual project content. Could be:
- **Code:** Git repository, pushed to GitHub
- **Research:** Structured research documents
- **Marketing:** Campaigns, copy, assets
- **Any work type:** Whatever the project needs

```bash
# Separate code repo — clone into project/
cd ~/.openclaw/workspace/projects/[name]
git clone <url> project

# Or init new code project
mkdir -p project && cd project && git init

# Combined — just create files
mkdir -p project && cd project
touch overview.md findings.md conclusions.md
```

### 2. TASKS/ (Project-Specific Tasks)

Tasks that are about this project — build tasks, code reviews, research sprints. Follows the same structure as workspace-level tasks (TASK.md, HANDOFF.md, CONTEXT.md, runs/). See `framework/TASKS.md` for details.

These travel with the project — when another instance clones the project, it gets the full task history.

### 3. library/ (Agent's Knowledge)

Accumulated knowledge about the project.

Contains 4 standardized files:

| File | Purpose | Example Content |
|------|---------|-----------------|
| `research.md` | Background info, market data, competitors | "Main competitor is X, charges $Y, weakness is Z" |
| `decisions.md` | Key choices + reasoning | "Chose offline-first because privacy is the selling point" |
| `plans.md` | Roadmap, future features, long-term vision | "v1: basic, v2: AI insights, v3: cloud sync" |
| `notes.md` | Everything else | Ideas, random findings, scratch notes |

**Why these 4 files:**
- Standardized = predictable for all projects
- Agent knows where to look without project-specific instructions
- Covers most use cases without overcomplication

**How to use:**
- TASK.md points to the library location
- Agent reads relevant files before working
- Agent updates files when learning something lasting
- HANDOFF.md (in TASKS/) can reference: "Added research to library/research.md"

## Connecting Tasks to Projects

Project tasks live inside the project directory:

```
projects/myproject/TASKS/BUILD/TASK.md
```

The TASK.md references paths relative to the project:

```markdown
## Project Location
- **Code:** `projects/myproject/project/`
- **Library:** `projects/myproject/library/`
```

Cron prompts point to the project path:
```
Read TASKS/README.md for execution rules. Then read projects/myproject/TASKS/BUILD/TASK.md and follow instructions.
```

The flow:
- **TASKS/BUILD/HANDOFF.md** — Session-to-session state (what's happening now)
- **TASKS/BUILD/CONTEXT.md** — Lasting project facts (one-liners)
- **library/** — Deep knowledge (research, decisions, plans, notes)

---

## 🔒 Git Workflow Policy

### Private by Default

**All repos created for the user are PRIVATE by default.**

```bash
# When creating repos via gh CLI:
gh repo create [name] --private

# Never use --public unless user explicitly asks
```

If user wants a public repo, they must explicitly say so.

### Git Workflow

**Default: work on main.** For prototyping, solo projects, and early-stage work, committing directly to main is fine. Keep it simple.

**Switch to feature branches when:**
- The project is live/in production and a bad push breaks things
- Multiple agents or people work on the same repo
- User explicitly asks for branch-based workflow

### Feature Branch Workflow (When Applicable)

```
feature/[short-description]    # New features
fix/[short-description]        # Bug fixes
chore/[short-description]      # Maintenance, deps, cleanup
```

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Do the work (commits on feature branch)

3. Push feature branch
   git push -u origin feature/my-feature

4. Tell user it's ready for review
   "Feature complete on branch `feature/my-feature`. Ready to merge when you approve."

5. WAIT for user confirmation

6. ONLY THEN merge to main
   git checkout main && git merge feature/my-feature && git push

7. Clean up branch
   git branch -d feature/my-feature
   git push origin --delete feature/my-feature
```

### Rules

❌ Force push to main
❌ Merge without user approval (when on feature branches)
❌ Create public repos without explicit permission

✅ Keep repos private unless told otherwise
✅ When using feature branches, wait for user's explicit approval before merging

---

## Creating a New Project

### 1. Create structure
```bash
cd ~/.openclaw/workspace/projects
mkdir -p myproject/{project,library,TASKS}
```

### 2. Set up code
```bash
cd myproject/project
git init  # or: git clone <url> .
```

### 3. Create library files
```bash
cd ../library
touch research.md decisions.md plans.md notes.md
```

### 4. Decide version control approach
Ask the user (or decide based on project type — see "Version Control" section above).

**If separate code repo:**
```bash
# project/ has its own git — create .gitignore at project root
echo "project/" > myproject/.gitignore
# Init knowledge repo
cd myproject && git init
```

**If combined:**
```bash
# Everything in one repo
cd myproject && git init
```

### 5. Create project task (if needed)
```bash
mkdir -p myproject/TASKS/BUILD/runs
# Copy templates from framework/TASKS/
cp framework/TASKS/EXAMPLE/TASK.md myproject/TASKS/BUILD/TASK.md
cp framework/TASKS/HANDOFF.md myproject/TASKS/BUILD/
cp framework/TASKS/CONTEXT.md myproject/TASKS/BUILD/
```

### 6. Record decision
Add to `library/decisions.md`: version control approach chosen and why.

## Organization Tips

- One project = one directory under projects/
- project/ is always the actual work (code, research, etc.)
- library/ is always agent knowledge
- TASKS/ holds project-specific tasks
- Group related projects in subdirectories if needed
- Archive old projects: `projects/archive/`

## Why This Matters

1. **Clean workspace** — Self-files (AGENTS.md, MEMORY.md) stay findable
2. **Easy navigation** — All code in one place
3. **Clear separation** — Framework, settings, and projects don't mix
4. **Standardized library** — Agent always knows where project knowledge lives
