# Projects Directory

## Rule

All cloned repositories and project work go in `workspace/projects/`.

**Never** clone repos directly into workspace root. It clutters the main directory and makes navigation harder.

## Directory Structure

Each project has a standardized structure:

```
workspace/projects/
├── my-app/
│   ├── repo/                   # Git repository (version controlled)
│   └── library/                # Agent's knowledge (local only)
│       ├── research.md
│       ├── decisions.md
│       ├── plans.md
│       └── notes.md
├── another-project/
│   ├── repo/
│   └── library/
├── client-work/                # Subdirectory for organization
│   ├── project-a/
│   │   ├── repo/
│   │   └── library/
│   └── project-b/
│       ├── repo/
│       └── library/
└── experiments/                # Quick experiments
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
# Project Dev Task

## Project Location
- **Repo:** `projects/[name]/repo/`
- **Library:** `projects/[name]/library/`

## Before Starting
1. Read HANDOFF.md
2. Check library/ for project context
...
```

The flow:
- **TASKS/[NAME]/HANDOFF.md** — Session-to-session state (what's happening now)
- **projects/[name]/library/** — Long-term knowledge (what we know about this project)

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

### Feature Branch Workflow

**Never work directly on main/master.** All work happens on feature branches.

```
main/master (protected)
    │
    ├── feature/add-login
    ├── feature/fix-bug-123
    ├── feature/update-docs
    └── ...
```

### Branch Naming

```
feature/[short-description]    # New features
fix/[short-description]        # Bug fixes
chore/[short-description]      # Maintenance, deps, cleanup
```

Examples:
- `feature/add-dark-mode`
- `fix/login-crash`
- `chore/update-dependencies`

### The Workflow

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Do the work
   (commits on feature branch)

3. Push feature branch
   git push -u origin feature/my-feature

4. Tell user it's ready for review
   "Feature complete on branch `feature/my-feature`. Ready to merge when you approve."

5. WAIT for user confirmation
   User says "looks good" / "merge it" / "approved"

6. ONLY THEN merge to main
   git checkout main
   git merge feature/my-feature
   git push origin main

7. Clean up
   git branch -d feature/my-feature
   git push origin --delete feature/my-feature
```

### ⚠️ NEVER Do This

❌ Push directly to main/master
❌ Merge without user approval
❌ Force push to main
❌ Create public repos without explicit permission

### ✅ Always Do This

✅ Work on feature branches
✅ Push feature branch for review
✅ Wait for user's "merge it" / "looks good" / explicit approval
✅ Then merge to main
✅ Keep repos private unless told otherwise

### Quick Commands

```bash
# Start new feature
git checkout main
git pull
git checkout -b feature/my-feature

# Save progress
git add -A
git commit -m "feat: description"
git push -u origin feature/my-feature

# After user approves
git checkout main
git merge feature/my-feature
git push origin main
```

---

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
- Group related projects in subdirectories
- Use clear, descriptive folder names
- Archive old projects: `projects/archive/`

## Why This Matters

1. **Clean workspace** — Self-files (AGENTS.md, MEMORY.md) stay findable
2. **Easy navigation** — All code in one place
3. **Clear separation** — Framework, settings, and projects don't mix
4. **Standardized library** — Agent always knows where project knowledge lives
