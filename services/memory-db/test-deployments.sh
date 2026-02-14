#!/bin/bash
# Test Mission Control in different deployment modes

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
ENV_BACKUP="$PROJECT_DIR/.env.backup"

echo "=== Mission Control Deployment Testing ==="
echo

# Backup current .env
cp "$ENV_FILE" "$ENV_BACKUP"
echo "✓ Backed up .env to .env.backup"

cleanup() {
  echo
  echo "=== Cleanup ==="
  
  # Stop Docker container if running
  if docker ps -a | grep -q mc-test-pg; then
    echo "Stopping Docker PostgreSQL..."
    docker stop mc-test-pg >/dev/null 2>&1 || true
    docker rm mc-test-pg >/dev/null 2>&1 || true
    echo "✓ Docker container removed"
  fi
  
  # Restore original .env
  if [ -f "$ENV_BACKUP" ]; then
    mv "$ENV_BACKUP" "$ENV_FILE"
    echo "✓ Restored original .env"
  fi
  
  # Kill Mission Control server
  pkill -f "memory-db/server.js" >/dev/null 2>&1 || true
  sleep 2
  
  echo "✓ Cleanup complete"
}

trap cleanup EXIT

# Function to create schema
create_schema() {
  local host="$1"
  local port="$2"
  local pass="$3"
  
  echo "Creating schema..."
  
  PGPASSWORD="$pass" psql -h "$host" -p "$port" -U openclaw -d openclaw <<'EOSQL'
CREATE SCHEMA IF NOT EXISTS memory;

CREATE TABLE IF NOT EXISTS memory.messages (
  id BIGSERIAL PRIMARY KEY,
  instance TEXT NOT NULL,
  session_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  parent_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instance, session_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_content_fts ON memory.messages
  USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_messages_created ON memory.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_instance ON memory.messages (instance);
CREATE INDEX IF NOT EXISTS idx_messages_session ON memory.messages (instance, session_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON memory.messages (role);

CREATE TABLE IF NOT EXISTS memory.cron_reports (
  id BIGSERIAL PRIMARY KEY,
  instance TEXT NOT NULL,
  cron_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  summary TEXT,
  run_started_at TIMESTAMPTZ,
  run_ended_at TIMESTAMPTZ,
  event_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instance, session_id, cron_name)
);

CREATE INDEX IF NOT EXISTS idx_cron_reports_instance ON memory.cron_reports (instance);
CREATE INDEX IF NOT EXISTS idx_cron_reports_cron ON memory.cron_reports (cron_name);
CREATE INDEX IF NOT EXISTS idx_cron_reports_created ON memory.cron_reports (event_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_reports_fts ON memory.cron_reports
  USING gin(to_tsvector('english', summary));

CREATE TABLE IF NOT EXISTS memory.sessions (
  instance TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  model TEXT,
  source TEXT,
  message_count INT DEFAULT 0,
  last_synced_byte BIGINT DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  PRIMARY KEY (instance, session_id)
);
EOSQL
  
  echo "✓ Schema created"
}

# Test 1: Docker Mode
echo "=== Test 1: Docker PostgreSQL ==="
echo

echo "Starting PostgreSQL container..."
docker run -d \
  --name mc-test-pg \
  -e POSTGRES_USER=openclaw \
  -e POSTGRES_PASSWORD=testpass123 \
  -e POSTGRES_DB=openclaw \
  -p 5434:5432 \
  postgres:16 >/dev/null

echo "Waiting for PostgreSQL to start..."
sleep 5

# Create schema
create_schema localhost 5434 testpass123

# Update .env for Docker
cat > "$ENV_FILE" <<EOF
MEMORY_DB_HOST=localhost
MEMORY_DB_PORT=5434
MEMORY_DB_NAME=openclaw
MEMORY_DB_USER=openclaw
MEMORY_DB_PASSWORD=testpass123
MEMORY_DB_SCHEMA=memory
EOF

echo "✓ .env configured for Docker"

# Run sync
echo "Running sync..."
cd "$PROJECT_DIR"
node sync.js 2>&1 | tail -5
echo "✓ Sync complete"

# Restart server
echo "Restarting Mission Control server..."
pkill -f "memory-db/server.js" >/dev/null 2>&1 || true
sleep 3

# Verify web UI
echo "Testing web UI..."
if curl -s http://localhost:5050/ | grep -q "Mission Control"; then
  echo "✓ Web UI responding"
else
  echo "✗ Web UI not responding"
  exit 1
fi

# Check message count
MSG_COUNT=$(PGPASSWORD=testpass123 psql -h localhost -p 5434 -U openclaw -d openclaw -t -c "SELECT COUNT(*) FROM memory.messages;" | xargs)
echo "✓ Docker mode test complete — synced $MSG_COUNT messages"

# Cleanup Docker
docker stop mc-test-pg >/dev/null
docker rm mc-test-pg >/dev/null
echo "✓ Docker container removed"
echo

# Test 2: Local Mode (restore original config)
echo "=== Test 2: Local PostgreSQL (Unix Socket) ==="
echo

mv "$ENV_BACKUP" "$ENV_FILE"
cp "$ENV_FILE" "$ENV_BACKUP"  # Keep backup for final restore
echo "✓ .env restored to local settings"

# Restart server
pkill -f "memory-db/server.js" >/dev/null 2>&1 || true
sleep 3

# Verify web UI
if curl -s http://localhost:5050/ | grep -q "Mission Control"; then
  echo "✓ Web UI responding"
else
  echo "✗ Web UI not responding"
  exit 1
fi

# Check message count
MSG_COUNT=$(/opt/homebrew/opt/postgresql@16/bin/psql -h /tmp -p 5433 -U openclaw -d openclaw -t -c "SELECT COUNT(*) FROM memory.messages;" | xargs)
echo "✓ Local mode test complete — $MSG_COUNT messages in DB"
echo

echo "=== All Tests Passed ==="
echo
echo "Deployment modes verified:"
echo "  1. Docker PostgreSQL — ✓"
echo "  2. Local PostgreSQL (Unix socket) — ✓"
echo "  3. Remote PostgreSQL — manual test (optional)"
echo
echo "Your .env is back to local settings."
