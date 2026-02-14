#!/usr/bin/env node
/**
 * Memory DB Sync Script
 * 
 * Syncs .jsonl session transcripts from all OpenClaw instances into PostgreSQL.
 * Runs every 5 minutes via system cron.
 * 
 * Usage: node sync.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment
dotenv.config({ path: path.join(__dirname, '.env') });

const CONFIG = {
  host: process.env.MEMORY_DB_HOST || 'localhost',
  port: parseInt(process.env.MEMORY_DB_PORT || '5432'),
  database: process.env.MEMORY_DB_NAME || 'openclaw',
  user: process.env.MEMORY_DB_USER || 'openclaw',
  password: process.env.MEMORY_DB_PASSWORD || '',
  schema: process.env.MEMORY_DB_SCHEMA || 'memory',
};

// Default search paths for OpenClaw instances
const DEFAULT_OPENCLAW_DIR = '/Users/plamen';
const SESSION_DIR_PATTERN = /^\.openclaw(-[\w]+)?$/;

// Create connection pool
const pool = new Pool({
  ...CONFIG,
  max: 5,
});

/**
 * Find all OpenClaw instance directories
 */
function findInstanceDirs(openclawDir) {
  const instances = [];
  const entries = fs.readdirSync(openclawDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && SESSION_DIR_PATTERN.test(entry.name)) {
      let instanceName = entry.name
        .replace('.openclaw-', '')
        .replace('.openclaw', '');
      
      // .openclaw (no suffix) becomes 'default'
      if (!instanceName) instanceName = 'default';
      
      instanceName = instanceName.toLowerCase();
      
      const sessionsPath = path.join(openclawDir, entry.name, 'agents', 'main', 'sessions');
      
      if (fs.existsSync(sessionsPath)) {
        instances.push({
          dir: entry.name,
          instance: instanceName,
          sessionsPath,
        });
      }
    }
  }
  
  return instances;
}

/**
 * Parse a single .jsonl line
 */
function parseLine(line) {
  try {
    const entry = JSON.parse(line);
    return entry;
  } catch (e) {
    return null;
  }
}

/**
 * Extract text content from a message, skipping thinking blocks
 */
function extractContent(message) {
  if (!message) return null;
  
  // If it's a simple string
  if (typeof message.content === 'string') {
    return message.content;
  }
  
  // If it's an array of blocks (newer format)
  if (Array.isArray(message.content)) {
    const texts = [];
    for (const block of message.content) {
      // Skip thinking blocks
      if (block.type === 'thinking') continue;
      if (block.type === 'tool_call') continue;
      if (block.type === 'tool_result') continue;
      
      if (block.text) {
        texts.push(block.text);
      }
    }
    return texts.join('\n') || null;
  }
  
  return null;
}

/**
 * Detect if session is a cron session
 */
function detectCronSession(messages) {
  if (!messages || messages.length === 0) return null;
  
  // First user message should contain cron marker like "[cron:UUID <name>]"
  const firstUser = messages.find(m => m.role === 'user' && m.content);
  if (!firstUser) return null;
  
  const content = typeof firstUser.content === 'string' ? firstUser.content : 
    (firstUser.content?.[0]?.text || '');
  
  const cronMatch = content.match(/^\[cron:([\w-]+)\s+([^\]]+)\]/);
  if (cronMatch) {
    return {
      cronId: cronMatch[1],
      cronName: cronMatch[2].toLowerCase().replace(/\s+/g, '-'),
    };
  }
  
  return null;
}

/**
 * Extract summary from last assistant message
 */
function extractSummary(messages) {
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  if (!lastAssistant) return null;
  
  return extractContent(lastAssistant);
}

/**
 * Get or create session record
 */
async function getSession(client, instance, sessionId) {
  const result = await client.query(
    `SELECT * FROM ${CONFIG.schema}.sessions WHERE instance = $1 AND session_id = $2`,
    [instance, sessionId]
  );
  return result.rows[0] || null;
}

/**
 * Upsert session
 */
async function upsertSession(client, instance, sessionId, data) {
  await client.query(
    `INSERT INTO ${CONFIG.schema}.sessions (instance, session_id, started_at, model, source, message_count, last_synced_byte, last_synced_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (instance, session_id) DO UPDATE SET
       model = EXCLUDED.model,
       source = EXCLUDED.source,
       message_count = EXCLUDED.message_count,
       last_synced_byte = EXCLUDED.last_synced_byte,
       last_synced_at = NOW()`,
    [instance, sessionId, data.started_at, data.model, data.source, data.message_count, data.last_synced_byte]
  );
}

/**
 * Insert message with ON CONFLICT DO NOTHING
 */
async function insertMessage(client, instance, sessionId, message) {
  await client.query(
    `INSERT INTO ${CONFIG.schema}.messages (instance, session_id, message_id, parent_id, role, content, source, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (instance, session_id, message_id) DO NOTHING`,
    [
      instance,
      sessionId,
      message.message_id,
      message.parent_id,
      message.role,
      message.content,
      message.source,
      message.created_at,
    ]
  );
}

/**
 * Insert cron report
 */
async function insertCronReport(client, instance, sessionId, cronName, summary, runStartedAt, runEndedAt, eventAt) {
  await client.query(
    `INSERT INTO ${CONFIG.schema}.cron_reports (instance, cron_name, session_id, summary, run_started_at, run_ended_at, event_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (instance, session_id, cron_name) DO NOTHING`,
    [instance, cronName, sessionId, summary, runStartedAt, runEndedAt, eventAt]
  );
}

/**
 * Ensure views exist for all instances
 */
async function ensureViews(client, instances) {
  for (const inst of instances) {
    // Validate instance name (alphanumeric + underscore only)
    if (!/^[\w]+$/.test(inst.instance)) {
      console.log(`  Skipping view for invalid instance name: ${inst.instance}`);
      continue;
    }
    
    // messages view
    const viewName = `v_${inst.instance}`;
    await client.query(`
      CREATE OR REPLACE VIEW ${CONFIG.schema}.${viewName} AS
      SELECT * FROM ${CONFIG.schema}.messages WHERE instance = '${inst.instance}'
    `);
    
    // cron_reports view
    const cronViewName = `v_cron_${inst.instance}`;
    await client.query(`
      CREATE OR REPLACE VIEW ${CONFIG.schema}.${cronViewName} AS
      SELECT * FROM ${CONFIG.schema}.cron_reports WHERE instance = '${inst.instance}'
    `);
  }
}

/**
 * Sync a single .jsonl file
 */
async function syncFile(client, instance, filePath, sessionId) {
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  // Get last synced byte
  const session = await getSession(client, instance, sessionId);
  const lastSyncedByte = session?.last_synced_byte || 0;
  
  // Skip if no new data
  if (fileSize === lastSyncedByte) {
    return { skipped: true };
  }
  
  // Read new content
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(fileSize - lastSyncedByte);
  fs.readSync(fd, buffer, 0, buffer.length, lastSyncedByte);
  fs.closeSync(fd);
  
  const content = buffer.toString('utf8');
  
  // Partial-write safety: split by \n, only process complete lines
  const lines = content.split('\n');
  let completeBytes = lastSyncedByte;
  
  const messages = [];
  let sessionData = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    
    const entry = parseLine(line);
    if (!entry) continue;
    
    // Calculate byte offset up to and including this line + newline
    const lineBytes = Buffer.byteLength(line + '\n', 'utf8');
    completeBytes += lineBytes;
    
    if (entry.type === 'session') {
      sessionData = {
        started_at: entry.timestamp ? new Date(entry.timestamp) : null,
        model: entry.model || null,
        source: entry.source || 'unknown',
      };
    } else if (entry.type === 'message') {
      // Role is in entry.message.role, content in entry.message.content
      const role = entry.message?.role;
      if (role === 'user' || role === 'assistant') {
        const content = extractContent(entry.message);
        if (content) {
          messages.push({
            message_id: entry.id,
            parent_id: entry.parent_id || null,
            role: role,
            content: content,
            source: entry.source || 'unknown',
            created_at: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          });
        }
      }
    }
    // Skip toolCall, thinking, model_change, custom, text fragments
  }
  
  // Update last_synced_byte to end of last complete line (not EOF)
  const lastSyncedByteUpdated = completeBytes;
  
  // Insert messages
  for (const msg of messages) {
    await insertMessage(client, instance, sessionId, msg);
  }
  
  // Detect cron session and insert report
  if (messages.length > 0) {
    const cronInfo = detectCronSession(messages);
    if (cronInfo && sessionData) {
      const summary = extractSummary(messages);
      await insertCronReport(
        client,
        instance,
        sessionId,
        cronInfo.cronName,
        summary,
        sessionData.started_at,
        new Date(), // run_ended_at = now
        sessionData.started_at || new Date()
      );
    }
  }
  
  // Update session record
  await upsertSession(client, instance, sessionId, {
    ...sessionData,
    message_count: messages.length,
    last_synced_byte: lastSyncedByteUpdated,
  });
  
  return {
    processed: messages.length,
    lastSyncedByte: lastSyncedByteUpdated,
  };
}

/**
 * Main sync function
 */
async function main() {
  console.log('=== Memory DB Sync ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  
  const openclawDir = process.env.OPENCLAW_DIR || DEFAULT_OPENCLAW_DIR;
  
  // Find all instances
  const instances = findInstanceDirs(openclawDir);
  console.log(`Found ${instances.length} instances: ${instances.map(i => i.instance).join(', ')}`);
  
  const client = await pool.connect();
  
  try {
    // Ensure views exist
    await ensureViews(client, instances);
    
    let totalFiles = 0;
    let totalMessages = 0;
    
    // Process each instance
    for (const inst of instances) {
      console.log(`\n--- Syncing ${inst.instance} ---`);
      
      const files = fs.readdirSync(inst.sessionsPath).filter(f => f.endsWith('.jsonl'));
      console.log(`Found ${files.length} session files`);
      
      for (const file of files) {
        const sessionId = file.replace('.jsonl', '');
        const filePath = path.join(inst.sessionsPath, file);
        
        try {
          const result = await syncFile(client, inst.instance, filePath, sessionId);
          totalFiles++;
          if (result.processed) {
            totalMessages += result.processed;
            console.log(`  ${sessionId}: +${result.processed} messages`);
          } else if (!result.skipped) {
            console.log(`  ${sessionId}: synced`);
          }
        } catch (err) {
          console.error(`  ${sessionId}: ERROR - ${err.message}`);
        }
      }
    }
    
    console.log(`\n=== Complete ===`);
    console.log(`Files processed: ${totalFiles}`);
    console.log(`Messages synced: ${totalMessages}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
