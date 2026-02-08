# Projects Directory

## Rule

All cloned repositories and project work go in `workspace/projects/`.

**Never** clone repos directly into workspace root. It clutters the main directory.

## Directory Structure

Each project has a standardized structure:

```
workspace/projects/
├── tanksio/
│   ├── repo/                   # Git repository (version controlled)
│   └── library/                # Agent's knowledge (local only)
│       ├── research.md
│       ├── decisions.md
│       ├── plans.md
│       └── notes.md
├── quicknutrition/
│   ├── repo/
│   └── library/
└── [project-name]/
    ├── repo/
    └── library/
```

## The Two Elements

### 1. repo/ (The Code)

The actual git repository. Version controlled, pushed to GitHub.

```bash
# Clone into repo/
cd ~/.openclaw/workspace/projects/[name]
git clone <url> repo

# Or init new
mkdir -p repo && cd repo && git init
```

### 2. library/ (Agent's Knowledge)

Accumulated knowledge about the project. **Local only** — not pushed to GitHub.

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

A task that works on a project references it in TASK.md:

```markdown
# Tanksio Dev

## Project Location
- **Repo:** `projects/tanksio/repo/`
- **Library:** `projects/tanksio/library/`

## Before Starting
1. Read HANDOFF.md
2. Check library/ for project context
...
```

The flow:
- **TASKS/[NAME]/HANDOFF.md** — Session-to-session state (what's happening now)
- **projects/[name]/library/** — Long-term knowledge (what we know about this project)

## 🔒 Git Workflow Policy

### Private by Default

All repos are **PRIVATE by default**. Never create public without explicit permission.

```bash
gh repo create [name] --private
```

### Feature Branch Workflow

**Never work directly on main/master.**

```
main/master (protected)
    │
    ├── feature/add-login
    ├── fix/bug-123
    └── chore/update-deps
```

### Branch Naming

```
feature/[description]    # New features
fix/[description]        # Bug fixes
chore/[description]      # Maintenance
```

### The Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Do the work, commit
git add -A && git commit -m "feat: description"

# 3. Push for review
git push -u origin feature/my-feature

# 4. Tell user "Ready for review on branch feature/my-feature"

# 5. WAIT for user approval ("looks good" / "merge it")

# 6. Only then merge
git checkout main && git merge feature/my-feature && git push

# 7. Clean up
git branch -d feature/my-feature
```

### ⚠️ NEVER

❌ Push directly to main/master
❌ Merge without user approval
❌ Force push to main
❌ Create public repos without permission

### ✅ ALWAYS

✅ Work on feature branches
✅ Push for review, wait for approval
✅ Keep repos private unless told otherwise

## Creating a New Project

```bash
# 1. Create project structure
cd ~/.openclaw/workspace/projects
mkdir -p myproject/repo myproject/library

# 2. Init or clone repo
cd myproject/repo
git init  # or: git clone <url> .

# 3. Create library files
cd ../library
touch research.md decisions.md plans.md notes.md

# 4. Create corresponding task if needed
mkdir -p ~/.openclaw/workspace/TASKS/MYPROJECT
# ... create TASK.md, HANDOFF.md, runs/
```

## Organization Tips

- One project = one directory under projects/
- repo/ is always the git content
- library/ is always local knowledge
- Group related projects in subdirectories if needed: `projects/clients/acme/`
