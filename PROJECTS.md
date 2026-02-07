# Projects Directory

## Rule

All cloned repositories and project work go in `workspace/projects/`.

**Never** clone repos directly into workspace root. It clutters the main directory and makes navigation harder.

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

## Structure

```
workspace/projects/
├── my-app/                 # A cloned repo
├── another-project/        # Another repo
├── client-work/            # Subdirectory for organization
│   ├── project-a/
│   └── project-b/
└── experiments/            # Quick experiments
```

## When Cloning

```bash
cd ~/.openclaw/workspace/projects
git clone <repo-url>
```

Or create new projects:
```bash
cd ~/.openclaw/workspace/projects
mkdir new-project && cd new-project
git init
```

## Organization Tips

- Group related projects in subdirectories
- Use clear, descriptive folder names
- Archive old projects: `projects/archive/`

## Why This Matters

1. **Clean workspace** — Self-files (AGENTS.md, MEMORY.md) stay findable
2. **Easy navigation** — All code in one place
3. **Clear separation** — Framework, settings, and projects don't mix
