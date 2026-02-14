# Changelog

All notable changes to the OpenClaw Framework.

## [0.1.4] - 2026-02-08

### Changed
- **TASKS structure overhaul** — Tasks now use directories instead of flat files
  - Each task: `TASKS/[NAME]/TASK.md`, `HANDOFF.md`, `runs/`
  - TASK.md = static instructions
  - HANDOFF.md = dynamic state, updated each run
  - runs/ = append-only session history
  - Cron prompts now minimal: just "Read TASKS/[NAME]/TASK.md"
- **PROJECTS structure overhaul** — Projects now have standardized library
  - Each project: `projects/[name]/repo/` + `library/`
  - repo/ = git repository (version controlled)
  - library/ = agent's accumulated knowledge (local only)
  - 4 standardized library files: research.md, decisions.md, plans.md, notes.md

### Added
- **TASKS/EXAMPLE/** — Template directory with TASK.md, HANDOFF.md, runs/
- Updated FRAMEWORK.md with new structures
- Updated TASKS.md with directory structure documentation
- Updated PROJECTS.md with library structure documentation

---

## [0.1.3] - 2026-02-07

### Fixed
- **Cron creation instructions** — INSTALLATION.md now includes exact cron payloads
  - Previously only said "Create cron" without specifying the payload
  - Now includes full `cron action=add` commands with proper payloads
  - Each cron references its TASKS/*.md file for instructions
  - Fixes: Reminders not working on new installs

---

## [0.1.2] - 2026-02-07

### Added
- **DELEGATION.md** — Model delegation guide for token savings
  - Three model tiers: Smart, Worker, Coding
  - Guidelines for when to use each
  - Model equivalents table (Anthropic/OpenAI/Google)
- **Model configuration** in USER-SETTINGS.md
  - smart_model, worker_model, coding_agent settings
  - Auto-detected during installation
- **TODO-PROCESSOR.md** task template
- Updated INSTALLATION.md with model setup step (Step 4b)
- Updated README.md and FRAMEWORK.md with delegation section

---

## [0.1.1] - 2026-02-07

### Changed
- **Tasks page** — Renamed tabs for clarity:
  - "Cron Jobs" → "Task Executions"
  - "Task Instructions (.md)" is now the main/first tab
  - Crons sorted: Enabled first, Disabled below
- **TODOs page** — Added cron status banner at top with toggle button
- **Web tools server** — Now uses cron cache file (gateway auth not required)
  - `framework/tools/cron-cache.json` — Agent refreshes on request
- **Docs updated** — WEB-TOOLS.md, README.md, FRAMEWORK.md now match reality

### Fixed
- URL paths in docs (was `/tools/*`, now `/*`)
- Web tools descriptions match actual implementation

---

## [0.1.0] - 2026-02-07

### Added
- **SECURITY.md** — Always-loaded security guidelines
  - Prompt injection defense
  - Never execute untrusted code
  - Never expose credentials
  - Skills/plugins: read-only, never auto-execute
  - Trust hierarchy for different sources
- **Git workflow policy** (in PROJECTS.md)
  - All repos private by default
  - Feature branch workflow (never push to main directly)
  - Merge only after user confirmation
- **CONTEXT.md** — Context management across sessions
  - ACTIVE-CONTEXT.md for hot memory
  - Daily brief as shared log (all sessions append)
  - Session startup and completion procedures
  - Compaction recovery protocol
- **LOGGING.md** — Logging standard
  - Daily brief format
  - Session log format
  - What to log, where to log
- **INSTALLATION.md** — Step-by-step installation guide
  - Exact flow agent follows
  - Feature selection
  - Directory creation
  - Task setup
- **WEB-TOOLS.md** — Web interfaces
  - Tasks Manager (view/control crons + edit task files)
  - TODO Manager (view/edit/complete/delete)
  - Reminders Manager (view/edit/pause/delete)
  - Activity Log
  - Context Viewer/Editor
  - Mission Editor
  - Settings Manager
- **WRITING-STYLE.md** — Human-like writing guidelines
  - Anti-AI-detection rules (em-dashes, enthusiasm, etc.)
  - Platform-specific guidelines
  - Context overrides
- **SKILLS.md** — Skill creation guidelines
  - When to create skills
  - Skill structure
  - Wiring skills in
- **TASKS/MISSION-REVIEW.md** — Nightly mission alignment check
- **EXTENDING.md** — How to add custom web tools
  - Extension registration via JSON
  - API documentation
  - Best practices
- **tool-extensions.example.json** — Template for custom tools
- Initial framework structure
- FRAMEWORK.md — The gyst file, always loaded
- USER-SETTINGS.example.md — Template for user preferences
- Projects directory guidance (PROJECTS.md)
- TODO system with individual files (TODO.md)
- Reminder system with smart creation (REMINDERS.md)
- Roles system (ROLES.md, ROLES/MAIN.example.md)
- Tasks system — user-friendly name for crons (TASKS.md)
- Built-in task templates:
  - SELF-MAINTAIN.md — Daily health check
  - AUTO-UPDATE.md — Framework update check (fetch → diff → confirm → pull)
  - REMINDER.md — Reminder execution
- Research guidelines with no-shelf policy (RESEARCH.md)
- Mission template (MISSION.example.md)
- Social media guidelines (SOCIAL.md)
- Framework overrides template (FRAMEWORK-OVERRIDES.example.md)
- **Self-versioning system** (SELF-VERSIONING.md)
  - Separate user "self" files from framework
  - User can version control: SOUL.md, IDENTITY.md, AGENTS.md, MISSION.md, ROLES/, TASKS/
  - Memory and credentials stay per-instance (gitignored)
  - Portable agent personality across OpenClaw instances
- gitignore.example — Template for user's self-repo

### Architecture
- **Two-repo model:**
  - Framework repo → `framework/` (shared, read-only)
  - User's self repo → `workspace/` root (user's own, editable)
- User-editable files live in `workspace/`, NOT in `framework/`
- Framework provides `.example.md` templates only
- Auto-update uses fetch → diff → confirm → pull (no premature file changes)

### Notes
- This is the initial release
- Not yet wired into OpenClaw — framework files only
- Ready for testing and feedback

---

## Version Format

- MAJOR.MINOR.PATCH
- MAJOR: Breaking changes, restructures
- MINOR: New features, significant additions
- PATCH: Bug fixes, small improvements
