# Memory DB — Agent Guide

The Memory DB stores all conversation history from every OpenClaw instance in PostgreSQL. Use it to search past conversations, find decisions, and recall context.

## Connection

```
Host: /tmp (Unix socket) or localhost
Port: 5433
Database: openclaw
Schema: memory
User: openclaw
Password: openclaw123
```

## Quick Queries (CLI)

The `memq` command is available system-wide:

```bash
memq stats                          # DB stats
memq last 10                        # Last 10 messages across all instances
memq search "polymarket scoring"    # Full-text search
memq search "leads" --instance entrepreneur  # Search within instance
memq range 2026-02-10 2026-02-12   # Messages in date range
memq crons 5                        # Last 5 cron reports
memq sessions entrepreneur          # List sessions for instance
```

## Direct SQL

Connect: `/opt/homebrew/opt/postgresql@16/bin/psql -p 5433 -d openclaw`

### Tables

**memory.messages** — All user/assistant messages
- `instance` — which OpenClaw instance (entrepreneur, default, supervisor, dteam, seo21digital, assistant)
- `session_id` — UUID of the session
- `role` — 'user' or 'assistant'
- `content` — message text (no tool calls, no thinking blocks)
- `created_at` — timestamp

**memory.sessions** — Session metadata
- `instance`, `session_id`, `started_at`, `model`, `source`, `message_count`, `last_synced_byte`

**memory.cron_reports** — Extracted cron summaries
- `instance`, `cron_name`, `session_id`, `summary`, `run_started_at`, `run_ended_at`, `event_at`

### Common Queries

```sql
-- Search for a topic
SELECT instance, role, left(content, 200), created_at
FROM memory.messages
WHERE to_tsvector('english', content) @@ websearch_to_tsquery('english', 'your search term')
ORDER BY created_at DESC LIMIT 20;

-- What did Plamen say about X?
SELECT left(content, 300), created_at
FROM memory.messages
WHERE role = 'user'
  AND to_tsvector('english', content) @@ websearch_to_tsquery('english', 'topic')
ORDER BY created_at DESC LIMIT 10;

-- Recent cron activity
SELECT cron_name, left(summary, 200), event_at
FROM memory.cron_reports
ORDER BY event_at DESC LIMIT 10;

-- Messages in a timeframe
SELECT instance, role, left(content, 200), created_at
FROM memory.messages
WHERE created_at BETWEEN '2026-02-14' AND '2026-02-15'
ORDER BY created_at;

-- Per-instance views also exist: memory.v_entrepreneur, memory.v_supervisor, etc.
```

## When to Use

- **Before answering questions about past decisions** — search Memory DB if MEMORY.md and memory/*.md don't have it
- **Finding what was discussed** — "when did we talk about X?"
- **Cross-instance context** — what happened in the seo21digital instance?
- **Cron history** — what did a cron report 3 days ago?

## Sync

The `ai.openclaw.memory-sync` launchd service runs every 5 minutes, auto-discovering all OpenClaw instances and syncing new messages incrementally.
