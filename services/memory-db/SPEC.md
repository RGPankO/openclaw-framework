# Memory DB -- Persistent Conversation History for OpenClaw

## Problem
- Geri wakes up fresh every session, loses context
- Memory files are manually curated -- things fall through the cracks
- No way to search "when did we discuss X?" across sessions
- Multiple OpenClaw instances each have their own sessions, no unified view
- Cron outputs are scattered, main session can't easily search what crons reported

## Solution
PostgreSQL database (local) that stores all user/assistant messages and cron reports from all instances. A lightweight Node.js sync script runs as a system cron (not LLM cron) to parse .jsonl transcripts into the DB.

## Architecture Overview

### Three components:

1. **Service** (`framework/services/memory-db/`) -- sync script + schema + installer
   - During framework install: "Want memory service?" -> yes -> store openclaw dir in USER-SETTINGS
   - Creates a system cron (launchd on Mac, systemd on Linux) running `sync.js` every 5 min
   - NOT an OpenClaw LLM cron -- plain script, no AI overhead

2. **Importer** -- CLI tool for backfill + ongoing sync
   - Reads .jsonl session files from ALL instance dirs
   - Parses user/assistant messages + cron reports
   - Writes to PostgreSQL
   - Handles initial backfill (915 existing sessions) AND incremental sync
   - START HERE -- build this first

3. **Mission Control** -- web UI for browsing/searching memory
   - Search box at top, filtered results below, infinite scroll
   - Filters: instance, role (user/assistant/cron), date range
   - Part of framework tools
   - Built after importer is proven

## Database Setup

### Connection: configurable via `.env`
```env
MEMORY_DB_HOST=localhost
MEMORY_DB_PORT=5432
MEMORY_DB_NAME=openclaw
MEMORY_DB_USER=openclaw
MEMORY_DB_PASSWORD=<from .env>
MEMORY_DB_SCHEMA=memory
```

Can point to local PostgreSQL, Docker, or remote. Currently: local install on Mac Mini.

## Schema

```sql
CREATE SCHEMA IF NOT EXISTS memory;

-- All user <-> assistant conversation across all instances
CREATE TABLE memory.messages (
  id BIGSERIAL PRIMARY KEY,
  instance TEXT NOT NULL,
  session_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  parent_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT,
  source TEXT,                     -- 'telegram', 'cron:polymarket-operate', etc.
  created_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instance, session_id, message_id)
);

CREATE INDEX idx_messages_content_fts ON memory.messages
  USING gin(to_tsvector('english', content));
CREATE INDEX idx_messages_created ON memory.messages (created_at DESC);
CREATE INDEX idx_messages_instance ON memory.messages (instance);
CREATE INDEX idx_messages_session ON memory.messages (instance, session_id);
CREATE INDEX idx_messages_role ON memory.messages (role);

-- What crons spit out -- separated for easy querying from main session
CREATE TABLE memory.cron_reports (
  id BIGSERIAL PRIMARY KEY,
  instance TEXT NOT NULL,
  cron_name TEXT NOT NULL,         -- 'polymarket-operate', '21digital-build', etc.
  session_id TEXT NOT NULL,
  summary TEXT,                    -- the announce/report text
  run_started_at TIMESTAMPTZ,
  run_ended_at TIMESTAMPTZ,
  event_at TIMESTAMPTZ NOT NULL,    -- from transcript timestamp, NOT ingest time
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instance, session_id, cron_name)
);

CREATE INDEX idx_cron_reports_instance ON memory.cron_reports (instance);
CREATE INDEX idx_cron_reports_cron ON memory.cron_reports (cron_name);
CREATE INDEX idx_cron_reports_created ON memory.cron_reports (created_at DESC);
CREATE INDEX idx_cron_reports_fts ON memory.cron_reports
  USING gin(to_tsvector('english', summary));

-- Session metadata
CREATE TABLE memory.sessions (
  instance TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  model TEXT,
  source TEXT,                     -- 'main', 'cron:polymarket-operate', etc.
  message_count INT DEFAULT 0,
  last_synced_byte BIGINT DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  PRIMARY KEY (instance, session_id)
);

```

### Convenience Views (auto-generated per instance)
```sql
-- Created automatically by sync script when new instances are discovered
CREATE VIEW memory.v_entrepreneur AS
  SELECT * FROM memory.messages WHERE instance = 'entrepreneur';
CREATE VIEW memory.v_dteam AS
  SELECT * FROM memory.messages WHERE instance = 'dteam';
-- etc. for each instance

CREATE VIEW memory.v_cron_entrepreneur AS
  SELECT * FROM memory.cron_reports WHERE instance = 'entrepreneur';
-- etc.
```

Sync script checks for missing views on each run and creates them. New instance appears → new views automatically.

### Why one table with instance column (not per-instance tables)?
- Cross-instance search is a simple WHERE, not UNION ALL across N tables
- Adding a new instance = just a new row, no schema changes
- Per-instance views give visual separation when needed
- Same isolation via index, zero overhead

## Sync Script: `sync.js`

Node.js script, runs every 5 min via system cron (launchd/systemd).

### Auto-discovery:
Script globs `/Users/plamen/.openclaw-*/agents/main/sessions/` to find all instances.
Optional config override in `.env` for custom paths.

### Instance name detection (all lowercase):
```
.openclaw-entrepreneur  -> entrepreneur
.openclaw-supervisor    -> supervisor
.openclaw-seo21digital  -> seo21digital
.openclaw-assistant     -> assistant
.openclaw-DTeam         -> dteam
.openclaw               -> default
```

### Sync logic per .jsonl file:
1. Look up `memory.sessions` for `last_synced_byte`
2. If file size unchanged, skip
3. Seek to `last_synced_byte`, read new bytes
4. **Partial-write safety:** Split by `\n`. Only process complete lines (ending with newline). Update `last_synced_byte` to byte offset after last complete line, NOT EOF. Any trailing partial line is re-read on next sync.
5. Parse each complete line:
   - `"type":"session"` -> extract metadata (timestamp, model), upsert session row
   - `"type":"message"` with `role: "user"` -> extract text content, detect source
   - `"type":"message"` with `role: "assistant"` -> extract text content (skip thinking blocks)
   - Skip everything else (toolCall, thinking, model_change, custom, text fragments)
6. **Cron detection:** If session starts with `[cron:UUID <name>]` in first user message, mark as cron session. Extract the summary from the last assistant message and write to `memory.cron_reports`.
7. INSERT with `ON CONFLICT DO NOTHING` (transcripts are immutable/append-only)
8. Update `last_synced_byte` and `message_count`

### Source detection from message content:
- Starts with `[cron:UUID <name>]` -> source = `cron:<name-slug>`
- Otherwise -> source = `unknown` (unless channel metadata explicitly says telegram/web/etc.)

## How Geri Uses It

### Search past conversations:
```sql
SELECT instance, session_id, role, content,
       created_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.messages
WHERE to_tsvector('english', content) @@ websearch_to_tsquery('english', 'australia niches')
ORDER BY created_at DESC
LIMIT 20;
```

### Session startup -- last N exchanges:
```sql
SELECT role, content, created_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.messages
WHERE instance = 'entrepreneur' AND role IN ('user', 'assistant')
ORDER BY created_at DESC
LIMIT 40;
```

### What happened on a specific day:
```sql
SELECT role, content, created_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.messages
WHERE instance = 'entrepreneur'
  AND (created_at AT TIME ZONE 'Europe/Sofia')::date = '2026-02-13'
  AND role IN ('user', 'assistant')
ORDER BY created_at;
```

### Cross-instance search:
```sql
SELECT instance, role, content, created_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.messages
WHERE content ILIKE '%20 niches%'
ORDER BY created_at DESC;
```

### What did a cron report yesterday?
```sql
SELECT cron_name, summary, event_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.cron_reports
WHERE instance = 'entrepreneur'
  AND cron_name = 'polymarket-operate'
  AND (event_at AT TIME ZONE 'Europe/Sofia')::date = '2026-02-14'
ORDER BY event_at;
```

### All cron activity across instances:
```sql
SELECT instance, cron_name, summary, event_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.cron_reports
ORDER BY event_at DESC
LIMIT 50;
```

## Existing Data to Backfill
| Instance | Sessions |
|----------|----------|
| entrepreneur | 575 |
| default | 172 |
| supervisor | 133 |
| seo21digital | 18 |
| dteam | 16 |
| assistant | 1 |
| **Total** | **915** |

## Framework Integration

### Location: `framework/services/memory-db/`
```
framework/services/memory-db/
  README.md              -- setup guide
  schema.sql             -- tables, indexes, views
  sync.js                -- the sync/importer script
  package.json           -- pg dependency
  .env.example           -- connection template
  install.sh             -- optional: creates DB, schema, launchd plist
```

### USER-SETTINGS integration:
```yaml
memory_db:
  enabled: true
  openclaw_dir: /Users/plamen        # parent dir containing .openclaw-* dirs
  db_env_path: framework/services/memory-db/.env
```

### System cron setup (launchd on Mac):
```xml
<!-- ~/Library/LaunchAgents/ai.openclaw.memory-sync.plist -->
<plist>
  <dict>
    <key>Label</key>
    <string>ai.openclaw.memory-sync</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/bin/env</string>
      <string>node</string>
      <string>/path/to/framework/services/memory-db/sync.js</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
  </dict>
</plist>
```

## Mission Control (Web UI)

### Purpose:
Browser-based interface for searching and browsing all memory.

### Features:
- Search box at top (full-text search)
- Filters: instance, role (user/assistant/cron), date range, cron name
- Results: infinite scroll, chronological
- Separate tabs/views: Conversations | Cron Reports
- Part of framework tools (could be canvas-based or standalone Express app)

### Build after importer is proven and backfill complete.

## Build Order
1. Install PostgreSQL locally (Homebrew)
2. Create DB + schema + tables
3. Build importer/sync script (parse .jsonl, write to DB)
4. Backfill all 915 existing sessions
5. Verify: search for "australia niches", "20 niches" etc.
6. Set up launchd system cron for ongoing sync
7. Build Mission Control web UI
8. Package into framework (installer, USER-SETTINGS)

## Open Questions
- Store tool call results? (useful for "what did Codex build?" but verbose)
- Store thinking blocks? (debugging, but very verbose)
- Retention policy? (probably never delete, PostgreSQL handles the scale easily)
- Growth estimate: ~50-100 sessions/day, ~500-1000 messages/day. Tiny for PostgreSQL.
