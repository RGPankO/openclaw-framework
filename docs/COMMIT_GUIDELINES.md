# Commit Guidelines

Guidelines for creating clean, logical git commits.

## Analysis Phase

Before committing, run:
```bash
git status --porcelain
git diff --name-only
git ls-files --others --exclude-standard
```

**Categorize changes by:**
- **Backend/API**: Express routes, database scripts, server logic
- **Frontend/UI**: Components, styles, user interface
- **Database**: Schema updates, migrations
- **Bug Fixes**: Error handling, calculation fixes
- **Documentation**: CLAUDE.md, README, guides
- **Configuration**: Package.json, env configs
- **Features**: New functionality, enhancements

## Logical Grouping Rules

**Group Together (same commit):**
- Related files implementing a single feature
- Files that depend on each other
- Bug fix + its test
- Component + styles + tests

**Separate Commits:**
- Bug fixes vs new features
- Frontend vs backend changes
- Database migrations vs application code
- Documentation vs project code
- Unrelated features
- Refactoring vs new functionality

## Commit Message Format

```
<Type>: <Clear summary in imperative mood>

<Optional detailed description>
- Key change 1
- Key change 2
```

**Types:** `Add`, `Fix`, `Update`, `Remove`, `Refactor`, `Implement`, `Create`

**IMPORTANT:** Do NOT add promotional messages or signature blocks. Keep professional.

## Staging Strategy

```bash
git add <specific files for this commit>
git commit -m "$(cat <<'EOF'
<commit message>
