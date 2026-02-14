#!/usr/bin/env node
/**
 * Memory DB Query Tool
 * 
 * Quick queries against the Memory DB.
 * 
 * Usage:
 *   node query.js last [N]                    — Last N messages (default 10)
 *   node query.js search <term>               — Full-text search
 *   node query.js search <term> --instance X  — Search within instance
 *   node query.js range <from> <to>           — Messages in date range (YYYY-MM-DD)
 *   node query.js crons [N]                   — Last N cron reports
 *   node query.js sessions [instance]         — List sessions
 *   node query.js stats                       — DB stats
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SCHEMA = process.env.MEMORY_DB_SCHEMA || 'memory';

const pool = new Pool({
  host: process.env.MEMORY_DB_HOST || 'localhost',
  port: parseInt(process.env.MEMORY_DB_PORT || '5432'),
  database: process.env.MEMORY_DB_NAME || 'openclaw',
  user: process.env.MEMORY_DB_USER || 'openclaw',
  password: process.env.MEMORY_DB_PASSWORD || '',
});

function truncate(str, len = 200) {
  if (!str) return '';
  const oneLine = str.replace(/\n/g, ' ').trim();
  return oneLine.length > len ? oneLine.slice(0, len) + '...' : oneLine;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { timeZone: 'Europe/Sofia', dateStyle: 'short', timeStyle: 'short' });
}

async function last(n = 10) {
  const { rows } = await pool.query(
    `SELECT instance, role, content, created_at 
     FROM ${SCHEMA}.messages 
     ORDER BY created_at DESC 
     LIMIT $1`, [n]
  );
  for (const r of rows) {
    console.log(`[${formatDate(r.created_at)}] ${r.instance}/${r.role}: ${truncate(r.content)}`);
  }
  console.log(`\n${rows.length} messages`);
}

async function search(term, instance = null) {
  const params = [term];
  let where = `to_tsvector('english', content) @@ websearch_to_tsquery('english', $1)`;
  if (instance) {
    where += ` AND instance = $2`;
    params.push(instance);
  }
  const { rows } = await pool.query(
    `SELECT instance, role, content, created_at,
            ts_rank(to_tsvector('english', content), websearch_to_tsquery('english', $1)) as rank
     FROM ${SCHEMA}.messages 
     WHERE ${where}
     ORDER BY rank DESC, created_at DESC
     LIMIT 20`, params
  );
  for (const r of rows) {
    console.log(`[${formatDate(r.created_at)}] ${r.instance}/${r.role} (rank ${r.rank.toFixed(3)}):`);
    console.log(`  ${truncate(r.content, 300)}\n`);
  }
  console.log(`${rows.length} results`);
}

async function range(from, to) {
  const { rows } = await pool.query(
    `SELECT instance, role, content, created_at 
     FROM ${SCHEMA}.messages 
     WHERE created_at >= $1::date AND created_at < ($2::date + interval '1 day')
     ORDER BY created_at ASC
     LIMIT 100`, [from, to]
  );
  for (const r of rows) {
    console.log(`[${formatDate(r.created_at)}] ${r.instance}/${r.role}: ${truncate(r.content)}`);
  }
  console.log(`\n${rows.length} messages`);
}

async function crons(n = 10) {
  const { rows } = await pool.query(
    `SELECT instance, cron_name, summary, event_at
     FROM ${SCHEMA}.cron_reports
     ORDER BY event_at DESC
     LIMIT $1`, [n]
  );
  for (const r of rows) {
    console.log(`[${formatDate(r.event_at)}] ${r.instance}/${r.cron_name}:`);
    console.log(`  ${truncate(r.summary, 300)}\n`);
  }
  console.log(`${rows.length} reports`);
}

async function sessions(instance = null) {
  const params = [];
  let where = '';
  if (instance) {
    where = 'WHERE instance = $1';
    params.push(instance);
  }
  const { rows } = await pool.query(
    `SELECT instance, session_id, source, message_count, started_at
     FROM ${SCHEMA}.sessions
     ${where}
     ORDER BY started_at DESC
     LIMIT 30`, params
  );
  for (const r of rows) {
    console.log(`[${formatDate(r.started_at)}] ${r.instance} | ${r.source} | ${r.message_count} msgs | ${r.session_id.slice(0,8)}...`);
  }
  console.log(`\n${rows.length} sessions`);
}

async function stats() {
  const messages = await pool.query(`SELECT count(*) as c FROM ${SCHEMA}.messages`);
  const sessions = await pool.query(`SELECT count(*) as c FROM ${SCHEMA}.sessions`);
  const crons = await pool.query(`SELECT count(*) as c FROM ${SCHEMA}.cron_reports`);
  const instances = await pool.query(`SELECT instance, count(*) as msgs FROM ${SCHEMA}.messages GROUP BY instance ORDER BY msgs DESC`);
  const roles = await pool.query(`SELECT role, count(*) as c FROM ${SCHEMA}.messages GROUP BY role`);
  
  console.log('=== Memory DB Stats ===');
  console.log(`Messages: ${messages.rows[0].c}`);
  console.log(`Sessions: ${sessions.rows[0].c}`);
  console.log(`Cron Reports: ${crons.rows[0].c}`);
  console.log('\nBy instance:');
  for (const r of instances.rows) {
    console.log(`  ${r.instance}: ${r.msgs} messages`);
  }
  console.log('\nBy role:');
  for (const r of roles.rows) {
    console.log(`  ${r.role}: ${r.c}`);
  }
}

// Parse args
const args = process.argv.slice(2);
const cmd = args[0] || 'stats';

// Extract --instance flag
let instanceFlag = null;
const instIdx = args.indexOf('--instance');
if (instIdx !== -1) {
  instanceFlag = args[instIdx + 1];
  args.splice(instIdx, 2);
}

(async () => {
  try {
    switch (cmd) {
      case 'last': await last(parseInt(args[1]) || 10); break;
      case 'search': await search(args.slice(1).join(' '), instanceFlag); break;
      case 'range': await range(args[1], args[2]); break;
      case 'crons': await crons(parseInt(args[1]) || 10); break;
      case 'sessions': await sessions(args[1]); break;
      case 'stats': await stats(); break;
      default: 
        console.log('Commands: last [N], search <term>, range <from> <to>, crons [N], sessions [instance], stats');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();
