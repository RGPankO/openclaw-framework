# Memory DB Service

PostgreSQL-backed conversation history store that syncs .jsonl session transcripts from all OpenClaw instances into a searchable database.

## Overview

- **Database**: PostgreSQL 16 (configurable: local/Docker/remote)
- **Default**: Local PostgreSQL via Unix socket (port 5433)
- **Database**: `openclaw`
- **Schema**: `memory`
- **Sync Interval**: Every 5 minutes (via launchd)
- **Web UI**: Mission Control at http://localhost:5050

## Deployment Modes

Mission Control supports three deployment configurations via `.env`:

### 1. Local PostgreSQL (Default, Unix Socket)

Best for: Development on Mac with Homebrew PostgreSQL

```env
MEMORY_DB_HOST=/tmp
MEMORY_DB_PORT=5433
MEMORY_DB_NAME=openclaw
MEMORY_DB_USER=openclaw
MEMORY_DB_PASSWORD=openclaw123
MEMORY_DB_SCHEMA=memory
```

**Setup:**
```bash
# Install PostgreSQL via Homebrew (if not already installed)
brew install postgresql@16

# Start PostgreSQL
brew services start postgresql@16

# Create database and user
/opt/homebrew/opt/postgresql@16/bin/createdb openclaw
/opt/homebrew/opt/postgresql@16/bin/psql -d openclaw -c "
  CREATE USER openclaw WITH PASSWORD 'openclaw123';
  GRANT ALL PRIVILEGES ON DATABASE openclaw TO openclaw;
"

# Run schema creation (from test-deployments.sh or manually)
/opt/homebrew/opt/postgresql@16/bin/psql -h /tmp -p 5433 -U openclaw -d openclaw < schema.sql
```

### 2. Docker PostgreSQL

Best for: Isolated testing, consistent environments, non-Mac systems

```env
MEMORY_DB_HOST=localhost
MEMORY_DB_PORT=5434
MEMORY_DB_NAME=openclaw
MEMORY_DB_USER=openclaw
MEMORY_DB_PASSWORD=yourpassword
MEMORY_DB_SCHEMA=memory
```

**Setup:**
```bash
# Start PostgreSQL container
docker run -d \
  --name mission-control-pg \
  -e POSTGRES_USER=openclaw \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=openclaw \
  -p 5434:5432 \
  postgres:16

# Wait for PostgreSQL to start
sleep 5

# Create schema
PGPASSWORD=yourpassword psql -h localhost -p 5434 -U openclaw -d openclaw < schema.sql

# Update .env to point to Docker (see config above)

# Run sync
node sync.js

# Restart Mission Control
pkill -f "memory-db/server.js"
# (launchd auto-restarts)
```

**Persistence:**
```bash
# To persist data across container restarts:
docker run -d \
  --name mission-control-pg \
  -e POSTGRES_USER=openclaw \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=openclaw \
  -p 5434:5432 \
  -v mission-control-data:/var/lib/postgresql/data \
  postgres:16
```

### 3. Remote PostgreSQL (VPS/Cloud)

Best for: Multi-machine setups, VPS deployments, team access

```env
MEMORY_DB_HOST=167.99.39.168
MEMORY_DB_PORT=5432
MEMORY_DB_NAME=openclaw
MEMORY_DB_USER=openclaw
MEMORY_DB_PASSWORD=yourpassword
MEMORY_DB_SCHEMA=memory
```

**Setup:**
```bash
# On the remote server:
# 1. Install PostgreSQL
sudo apt update && sudo apt install -y postgresql-16

# 2. Configure PostgreSQL to accept remote connections
# Edit /etc/postgresql/16/main/postgresql.conf:
#   listen_addresses = '*'
# Edit /etc/postgresql/16/main/pg_hba.conf:
#   host openclaw openclaw 0.0.0.0/0 scram-sha-256

# 3. Create database and user
sudo -u postgres psql -c "CREATE DATABASE openclaw;"
sudo -u postgres psql -c "CREATE USER openclaw WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE openclaw TO openclaw;"

# 4. Restart PostgreSQL
sudo systemctl restart postgresql

# On your local machine:
# 1. Update .env with remote host details
# 2. Create schema remotely
PGPASSWORD=yourpassword psql -h 167.99.39.168 -p 5432 -U openclaw -d openclaw < schema.sql

# 3. Run sync
node sync.js

# 4. Restart Mission Control
pkill -f "memory-db/server.js"
```

**Security Notes:**
- Use strong passwords for remote deployments
- Consider SSH tunneling instead of exposing PostgreSQL:
  ```bash
  ssh -L 5432:localhost:5432 user@167.99.39.168 -N -f
  # Then use MEMORY_DB_HOST=localhost in .env
  ```
- Firewall rules: Only allow your IP to access port 5432

## Testing Deployments

Use the included test script to verify all modes work:

```bash
cd framework/services/memory-db
chmod +x test-deployments.sh
./test-deployments.sh
```

This script:
1. Tests Docker mode (spins up container, creates schema, syncs, verifies UI)
2. Tests local mode (restores original config, verifies)
3. Cleans up and restores your original .env

**Note:** Docker image download may take a few minutes on first run.

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
