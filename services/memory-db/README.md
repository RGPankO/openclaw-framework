# Memory DB Service

PostgreSQL-backed conversation history store that syncs .jsonl session transcripts from all OpenClaw instances into a searchable database.

## Overview

- **Database**: PostgreSQL 16 (Homebrew) on Mac Mini
- **Port**: 5433
- **Database**: `openclaw`
- **Schema**: `memory`
- **Sync Interval**: Every 5 minutes (via launchd)

## Tables

### `memory.messages`
All user/assistant messages across all instances:
- `instance` - OpenClaw instance name (e.g., "entrepreneur", "default")
- `session_id` - Session UUID
- `message_id` - Message UUID
- `role` - "user" or "assistant"
- `content` - Message text content
- `source` - Message source (e.g., "telegram", "cron:polymarket-operate")
- `created_at` - Message timestamp
- `ingested_at` - When the message was added to DB

### `memory.cron_reports`
Cron job summaries:
- `instance` - OpenClaw instance
- `cron_name` - Cron job name (e.g., "polymarket-operate")
- `session_id` - Session UUID
- `summary` - Cron report text
- `run_started_at` / `run_ended_at` - Execution window
- `event_at` - When the cron ran

### `memory.sessions`
Session metadata:
- `instance`, `session_id` - Primary key
- `started_at` - Session start time
- `model` - Model used
- `source` - Session source
- `message_count` - Messages synced
- `last_synced_byte` - For incremental sync

## Views

Per-instance views for convenience:
- `memory.v_entrepreneur` - Messages from entrepreneur instance
- `memory.v_cron_entrepreneur` - Cron reports from entrepreneur instance
- Similar views for `default`, `dteam`, `supervisor`, `seo21digital`, `assistant`

## Usage

### Running Sync Manually

```bash
cd framework/services/memory-db
node sync.js
```

### Query Examples

**Search conversations:**
```sql
SELECT instance, session_id, role, content,
       created_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.messages
WHERE to_tsvector('english', content) @@ websearch_to_tsquery('english', 'australia niches')
ORDER BY created_at DESC
LIMIT 20;
```

**Session startup (last N exchanges):**
```sql
SELECT role, content, created_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.messages
WHERE instance = 'entrepreneur' AND role IN ('user', 'assistant')
ORDER BY created_at DESC
LIMIT 40;
```

**What crons reported yesterday:**
```sql
SELECT cron_name, summary, event_at AT TIME ZONE 'Europe/Sofia' as local_time
FROM memory.cron_reports
WHERE instance = 'entrepreneur'
  AND (event_at AT TIME ZONE 'Europe/Sofia')::date = '2026-02-14'
ORDER BY event_at;
```

## Adding a New Instance

1. Create a new OpenClaw instance directory: `~/.openclaw-newinstance/`
2. Run sync - it auto-discovers new instances
3. Views are created automatically

## Files

```
framework/services/memory-db/
  sync.js              # Main sync script
  package.json         # Dependencies (pg, dotenv)
  .env                # Database connection config
  .env.example        # Template for .env
  ai.openclaw.memory-sync.plist  # launchd config
  logs/
    sync.log          # Sync output
    sync.error.log    # Errors
```

## Troubleshooting

### Check if PostgreSQL is running
```bash
pg_ctl -D /opt/homebrew/var/postgresql@16 status
```

### Check launchd status
```bash
launchctl list | grep memory-sync
```

### View recent sync activity
```bash
tail -20 logs/sync.log
```

### Manual database query
```bash
/opt/homebrew/opt/postgresql@16/bin/psql -h /tmp -p 5433 -U openclaw -d openclaw
```
