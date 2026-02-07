# Web Tools

*Web interfaces for managing Tasks, TODOs, Reminders, and more.*

---

## Overview

The framework includes web-based tools accessible via browser at:

**Access:** `http://localhost:8890/`

## Tools Included

### 1. Command Center (Home)

**URL:** `/`

Central hub linking to all tools.

---

### 2. Tasks

**URL:** `/tasks/`

Manage Task Instructions and Task Executions (crons).

**Two Tabs:**
- **Task Instructions (.md)** — View/edit task definition files from `TASKS/` directory
- **Task Executions** — View cron jobs, their status, schedule, last run

**Features:**
- View all task instructions
- Expand to edit task content
- See cron status (enabled/disabled)
- Crons sorted: Enabled first, Disabled below

**Note:** Cron data is cached. Ask agent to "refresh cron cache" for latest data.

**Data sources:** 
- Task Instructions: `workspace/TASKS/*.md` files
- Task Executions: `framework/tools/cron-cache.json` (refreshed by agent)

---

### 3. TODOs

**URL:** `/todo/`

Manage TODO items.

**Features:**
- **Cron status banner** — Shows if TODO processing cron is ON/OFF with toggle button
- List all TODOs with priority and status
- Expand to view/edit content
- Mark as complete (archives the file)
- Delete TODOs

**Data source:** `workspace/todo/*.md` files

---

### 4. Reminders

**URL:** `/reminders/`

View and manage reminders.

**Features:**
- List all reminders with status
- Toggle pause/resume
- Delete reminders
- Expand to view/edit content

**Data source:** `workspace/reminders/*.md` files

---

### 5. Activity Log

**URL:** `/activity/`

View daily activity across all sessions.

**Features:**
- Display daily brief logs
- Shows what each cron/session did
- Sorted by date (newest first)

**Data source:** `memory/daily-brief-*.md` files

---

### 6. Context

**URL:** `/context/`

View and edit current context.

**Features:**
- Display ACTIVE-CONTEXT.md
- Edit and save changes

**Data source:** `workspace/ACTIVE-CONTEXT.md`

---

### 7. Mission

**URL:** `/mission/`

View and edit agent mission.

**Features:**
- Display MISSION.md
- Edit and save changes

**Data source:** `workspace/MISSION.md`

---

### 8. Settings

**URL:** `/settings/`

Manage framework settings.

**Features:**
- View/edit USER-SETTINGS.md
- View/edit FRAMEWORK-OVERRIDES.md

**Data sources:**
- `workspace/USER-SETTINGS.md`
- `workspace/FRAMEWORK-OVERRIDES.md`

---

## Technical Details

### Server

Single Express server in `framework/tools/server.js`:

```bash
# Start manually
cd ~/.openclaw/workspace/framework/tools
npm install  # first time only
node server.js

# Runs on port 8890
```

### API Endpoints

```
GET  /api/tasks           # List task instructions
GET  /api/tasks/:id       # Get task content
PUT  /api/tasks/:id       # Update task content

GET  /api/crons           # List crons (from cache)

GET  /api/todos           # List TODOs
GET  /api/todos/:id       # Get TODO content
PUT  /api/todos/:id       # Update TODO
POST /api/todos/:id/complete  # Archive TODO
DELETE /api/todos/:id     # Delete TODO

GET  /api/reminders       # List reminders
GET  /api/reminders/:id   # Get reminder
PUT  /api/reminders/:id   # Update reminder
POST /api/reminders/:id/toggle  # Pause/resume
DELETE /api/reminders/:id # Delete reminder

GET  /api/activity        # Get daily briefs

GET  /api/context         # Get ACTIVE-CONTEXT
PUT  /api/context         # Update ACTIVE-CONTEXT

GET  /api/mission         # Get MISSION
PUT  /api/mission         # Update MISSION

GET  /api/settings        # Get settings files
PUT  /api/settings        # Update settings
PUT  /api/settings/:key   # Update single setting
```

### Cron Cache

The web server cannot directly access OpenClaw's gateway API (requires auth token). Instead:

1. Agent fetches crons via `cron` tool
2. Writes to `framework/tools/cron-cache.json`
3. Web server reads from cache

**To refresh:** Ask agent "refresh the cron cache for web tools"

---

## Security

- Localhost only (not exposed to network)
- No authentication (local machine access)
- Never expose port 8890 to public internet
