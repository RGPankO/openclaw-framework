#!/usr/bin/env node
/**
 * Mission Control — Memory DB Web UI
 * 
 * Start: node server.js
 * Default: http://localhost:5050
 * 
 * Set MISSION_CONTROL_PASSWORD for password protection.
 * Set MISSION_CONTROL_PORT to change port.
 */

const http = require('http');
const { Pool } = require('pg');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = parseInt(process.env.MISSION_CONTROL_PORT || '5050');
const PASSWORD = process.env.MISSION_CONTROL_PASSWORD || '';
const SCHEMA = process.env.MEMORY_DB_SCHEMA || 'memory';

const pool = new Pool({
  host: process.env.MEMORY_DB_HOST || 'localhost',
  port: parseInt(process.env.MEMORY_DB_PORT || '5432'),
  database: process.env.MEMORY_DB_NAME || 'openclaw',
  user: process.env.MEMORY_DB_USER || 'openclaw',
  password: process.env.MEMORY_DB_PASSWORD || '',
});

// Session tokens (in-memory, cleared on restart)
const sessions = new Set();

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [k, v] = c.trim().split('=');
    if (k) cookies[k] = v;
  });
  return cookies;
}

function isAuthed(req) {
  if (!PASSWORD) return true;
  const cookies = parseCookies(req);
  return cookies.mc_token && sessions.has(cookies.mc_token);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(new URLSearchParams(body)));
  });
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function respond(res, status, html, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(html);
}

function respondJson(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', { timeZone: 'Europe/Sofia', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---- HTML Templates ----

function loginPage(error = '') {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mission Control — Login</title>
<style>${baseCSS()}
.login-box{max-width:360px;margin:100px auto;padding:32px;background:#1e1e2e;border-radius:12px}
.login-box h1{text-align:center;margin-bottom:24px}
.login-box input{width:100%;padding:12px;margin-bottom:16px;background:#2a2a3e;border:1px solid #3a3a5e;border-radius:8px;color:#e0e0e0;font-size:16px}
.login-box button{width:100%;padding:12px;background:#7c3aed;border:none;border-radius:8px;color:#fff;font-size:16px;cursor:pointer}
.login-box button:hover{background:#6d28d9}
.error{color:#ef4444;text-align:center;margin-bottom:12px}
</style></head><body>
<div class="login-box">
<h1>🦞 Mission Control</h1>
${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
<form method="POST" action="/login">
<input type="password" name="password" placeholder="Password" autofocus>
<button type="submit">Enter</button>
</form>
</div></body></html>`;
}

function baseCSS() {
  return `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f1a;color:#e0e0e0;line-height:1.6}
a{color:#818cf8;text-decoration:none}a:hover{text-decoration:underline}
.container{max-width:1200px;margin:0 auto;padding:16px}
`;
}

function layout(title, content, activeTab = '') {
  const tabs = [
    { id: 'search', label: '🔍 Search', href: '/' },
    { id: 'crons', label: '⚙️ Crons', href: '/crons' },
    { id: 'sessions', label: '📋 Sessions', href: '/sessions' },
    { id: 'stats', label: '📊 Stats', href: '/stats' },
  ];
  const tabsHtml = tabs.map(t => 
    `<a href="${t.href}" class="tab ${activeTab === t.id ? 'active' : ''}">${t.label}</a>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — Mission Control</title>
<style>${baseCSS()}
header{background:#1a1a2e;border-bottom:1px solid #2a2a3e;padding:12px 0}
.header-inner{max-width:1200px;margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:20px;font-weight:700;color:#e0e0e0}
.tabs{display:flex;gap:4px}
.tab{padding:8px 16px;border-radius:8px;color:#a0a0b0;font-size:14px;transition:all .15s}
.tab:hover{background:#2a2a3e;color:#e0e0e0;text-decoration:none}
.tab.active{background:#7c3aed;color:#fff}
.search-box{margin:24px 0;display:flex;gap:8px;flex-wrap:wrap}
.search-box input,.search-box select{padding:10px 14px;background:#1e1e2e;border:1px solid #3a3a5e;border-radius:8px;color:#e0e0e0;font-size:15px}
.search-box input[type=text]{flex:1;min-width:200px}
.search-box select{min-width:130px}
.search-box button{padding:10px 20px;background:#7c3aed;border:none;border-radius:8px;color:#fff;font-size:15px;cursor:pointer}
.search-box button:hover{background:#6d28d9}
.msg{padding:16px;margin-bottom:8px;background:#1e1e2e;border-radius:8px;border-left:3px solid #3a3a5e}
.msg.user{border-left-color:#3b82f6}
.msg.assistant{border-left-color:#10b981}
.msg-meta{font-size:12px;color:#6b7280;margin-bottom:6px;display:flex;gap:12px;flex-wrap:wrap}
.msg-meta .instance{background:#2a2a3e;padding:2px 8px;border-radius:4px;font-weight:600}
.msg-meta .role{text-transform:uppercase;font-weight:600}
.msg-meta .role.user{color:#3b82f6}
.msg-meta .role.assistant{color:#10b981}
.msg-content{white-space:pre-wrap;word-break:break-word;font-size:14px;max-height:300px;overflow:hidden;position:relative}
.msg-content.expanded{max-height:none}
.msg-content.truncated::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,#1e1e2e)}
.expand-btn{color:#818cf8;cursor:pointer;font-size:13px;margin-top:4px;display:inline-block}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:24px 0}
.stat-card{background:#1e1e2e;padding:20px;border-radius:12px;text-align:center}
.stat-card .number{font-size:32px;font-weight:700;color:#7c3aed}
.stat-card .label{font-size:14px;color:#6b7280;margin-top:4px}
table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #2a2a3e;font-size:14px}
th{color:#6b7280;font-weight:600;font-size:12px;text-transform:uppercase}
.cron-summary{max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.page-nav{display:flex;justify-content:center;gap:8px;margin:24px 0}
.page-nav a{padding:8px 16px;background:#1e1e2e;border-radius:8px;color:#a0a0b0}
.page-nav a:hover{background:#2a2a3e;color:#e0e0e0;text-decoration:none}
.empty{text-align:center;padding:60px;color:#6b7280;font-size:16px}
.date-range{display:flex;gap:8px;align-items:center}
.date-range label{color:#6b7280;font-size:13px}
</style></head><body>
<header><div class="header-inner">
<span class="logo">🦞 Mission Control</span>
<div class="tabs">${tabsHtml}</div>
</div></header>
<div class="container">${content}</div>
<script>
document.querySelectorAll('.msg-content').forEach(el => {
  if (el.scrollHeight > 300) {
    el.classList.add('truncated');
    const btn = document.createElement('span');
    btn.className = 'expand-btn';
    btn.textContent = 'Show more ▼';
    btn.onclick = () => {
      el.classList.toggle('expanded');
      el.classList.toggle('truncated');
      btn.textContent = el.classList.contains('expanded') ? 'Show less ▲' : 'Show more ▼';
    };
    el.parentNode.insertBefore(btn, el.nextSibling);
  }
});
</script>
</body></html>`;
}

function renderMessages(rows) {
  if (!rows.length) return '<div class="empty">No messages found</div>';
  return rows.map(r => `
<div class="msg ${r.role}">
  <div class="msg-meta">
    <span class="instance">${escapeHtml(r.instance)}</span>
    <span class="role ${r.role}">${r.role}</span>
    <span>${formatDate(r.created_at)}</span>
    ${r.rank ? `<span>relevance: ${parseFloat(r.rank).toFixed(3)}</span>` : ''}
  </div>
  <div class="msg-content">${escapeHtml(r.content)}</div>
</div>`).join('');
}

// ---- Routes ----

async function handleSearch(url) {
  const q = url.searchParams.get('q') || '';
  const instance = url.searchParams.get('instance') || '';
  const role = url.searchParams.get('role') || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 30;
  const offset = (page - 1) * limit;

  let rows = [];
  if (q) {
    const params = [q, limit, offset];
    let where = [`to_tsvector('english', content) @@ websearch_to_tsquery('english', $1)`];
    let paramIdx = 4;
    if (instance) { where.push(`instance = $${paramIdx}`); params.push(instance); paramIdx++; }
    if (role) { where.push(`role = $${paramIdx}`); params.push(role); paramIdx++; }
    if (from) { where.push(`created_at >= $${paramIdx}::date`); params.push(from); paramIdx++; }
    if (to) { where.push(`created_at < ($${paramIdx}::date + interval '1 day')`); params.push(to); paramIdx++; }
    
    const { rows: r } = await pool.query(
      `SELECT instance, role, content, created_at,
              ts_rank(to_tsvector('english', content), websearch_to_tsquery('english', $1)) as rank
       FROM ${SCHEMA}.messages
       WHERE ${where.join(' AND ')}
       ORDER BY rank DESC, created_at DESC
       LIMIT $2 OFFSET $3`, params
    );
    rows = r;
  }

  // Get instances for dropdown
  const { rows: instances } = await pool.query(
    `SELECT DISTINCT instance FROM ${SCHEMA}.messages ORDER BY instance`
  );

  const instanceOptions = instances.map(i => 
    `<option value="${i.instance}" ${instance === i.instance ? 'selected' : ''}>${i.instance}</option>`
  ).join('');

  const queryParams = new URLSearchParams({ q, instance, role, from, to });
  const prevPage = page > 1 ? `<a href="/?${queryParams}&page=${page-1}">← Previous</a>` : '';
  const nextPage = rows.length === limit ? `<a href="/?${queryParams}&page=${page+1}">Next →</a>` : '';

  const html = `
<form class="search-box" method="GET" action="/">
  <input type="text" name="q" value="${escapeHtml(q)}" placeholder="Search conversations..." autofocus>
  <select name="instance"><option value="">All instances</option>${instanceOptions}</select>
  <select name="role">
    <option value="">All roles</option>
    <option value="user" ${role === 'user' ? 'selected' : ''}>User</option>
    <option value="assistant" ${role === 'assistant' ? 'selected' : ''}>Assistant</option>
  </select>
  <div class="date-range">
    <label>From</label><input type="date" name="from" value="${escapeHtml(from)}">
    <label>To</label><input type="date" name="to" value="${escapeHtml(to)}">
  </div>
  <button type="submit">Search</button>
</form>
${q ? `<p style="color:#6b7280;margin-bottom:16px">${rows.length} result${rows.length !== 1 ? 's' : ''} for "${escapeHtml(q)}"${instance ? ' in ' + escapeHtml(instance) : ''}</p>` : ''}
${q ? renderMessages(rows) : '<div class="empty">Search across 12,000+ messages from all OpenClaw instances</div>'}
${(prevPage || nextPage) ? `<div class="page-nav">${prevPage}${nextPage}</div>` : ''}`;

  return layout('Search', html, 'search');
}

async function handleCrons(url) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const instance = url.searchParams.get('instance') || '';
  const limit = 30;
  const offset = (page - 1) * limit;

  const params = [limit, offset];
  let where = '';
  if (instance) { where = 'WHERE instance = $3'; params.push(instance); }

  const { rows } = await pool.query(
    `SELECT instance, cron_name, summary, event_at, session_id
     FROM ${SCHEMA}.cron_reports ${where}
     ORDER BY event_at DESC LIMIT $1 OFFSET $2`, params
  );

  const tableRows = rows.map(r => `
<tr>
  <td>${formatDate(r.event_at)}</td>
  <td><span class="instance" style="background:#2a2a3e;padding:2px 8px;border-radius:4px">${escapeHtml(r.instance)}</span></td>
  <td>${escapeHtml(r.cron_name)}</td>
  <td class="cron-summary" title="${escapeHtml(r.summary?.slice(0, 500))}">${escapeHtml(r.summary?.slice(0, 150))}</td>
</tr>`).join('');

  const queryParams = new URLSearchParams({ instance });
  const prevPage = page > 1 ? `<a href="/crons?${queryParams}&page=${page-1}">← Previous</a>` : '';
  const nextPage = rows.length === limit ? `<a href="/crons?${queryParams}&page=${page+1}">Next →</a>` : '';

  const html = `
<h2 style="margin:24px 0 16px">Cron Reports</h2>
<table>
<thead><tr><th>Time</th><th>Instance</th><th>Cron</th><th>Summary</th></tr></thead>
<tbody>${tableRows || '<tr><td colspan="4" class="empty">No cron reports</td></tr>'}</tbody>
</table>
${(prevPage || nextPage) ? `<div class="page-nav">${prevPage}${nextPage}</div>` : ''}`;

  return layout('Crons', html, 'crons');
}

async function handleSessions(url) {
  const instance = url.searchParams.get('instance') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const params = [limit, offset];
  let where = '';
  if (instance) { where = 'WHERE s.instance = $3'; params.push(instance); }

  const { rows } = await pool.query(
    `SELECT s.instance, s.session_id, s.source, s.started_at, s.model,
            (SELECT count(*) FROM ${SCHEMA}.messages m WHERE m.instance = s.instance AND m.session_id = s.session_id) as msg_count
     FROM ${SCHEMA}.sessions s ${where}
     ORDER BY s.started_at DESC NULLS LAST
     LIMIT $1 OFFSET $2`, params
  );

  const tableRows = rows.map(r => `
<tr>
  <td>${formatDate(r.started_at)}</td>
  <td><span class="instance" style="background:#2a2a3e;padding:2px 8px;border-radius:4px">${escapeHtml(r.instance)}</span></td>
  <td>${escapeHtml(r.source || '—')}</td>
  <td>${r.msg_count}</td>
  <td><a href="/session?id=${r.session_id}&instance=${r.instance}">${r.session_id.slice(0, 8)}...</a></td>
</tr>`).join('');

  const html = `
<h2 style="margin:24px 0 16px">Sessions</h2>
<table>
<thead><tr><th>Started</th><th>Instance</th><th>Source</th><th>Messages</th><th>ID</th></tr></thead>
<tbody>${tableRows || '<tr><td colspan="5" class="empty">No sessions</td></tr>'}</tbody>
</table>
<div class="page-nav">
${page > 1 ? `<a href="/sessions?instance=${instance}&page=${page-1}">← Previous</a>` : ''}
${rows.length === limit ? `<a href="/sessions?instance=${instance}&page=${page+1}">Next →</a>` : ''}
</div>`;

  return layout('Sessions', html, 'sessions');
}

async function handleSession(url) {
  const sessionId = url.searchParams.get('id');
  const instance = url.searchParams.get('instance');
  if (!sessionId || !instance) return layout('Session', '<div class="empty">Missing session ID</div>');

  const { rows } = await pool.query(
    `SELECT role, content, created_at FROM ${SCHEMA}.messages
     WHERE instance = $1 AND session_id = $2
     ORDER BY created_at ASC`, [instance, sessionId]
  );

  const html = `
<h2 style="margin:24px 0 16px">Session ${escapeHtml(sessionId.slice(0, 8))}... <span style="color:#6b7280">(${escapeHtml(instance)})</span></h2>
<p style="color:#6b7280;margin-bottom:16px">${rows.length} messages</p>
${renderMessages(rows.map(r => ({ ...r, instance })))}`;

  return layout(`Session ${sessionId.slice(0, 8)}`, html);
}

async function handleStats() {
  const messages = await pool.query(`SELECT count(*)::int as c FROM ${SCHEMA}.messages`);
  const sessions = await pool.query(`SELECT count(*)::int as c FROM ${SCHEMA}.sessions`);
  const crons = await pool.query(`SELECT count(*)::int as c FROM ${SCHEMA}.cron_reports`);
  const instances = await pool.query(
    `SELECT instance, count(*)::int as msgs, 
            count(DISTINCT session_id)::int as sess,
            min(created_at) as first_msg,
            max(created_at) as last_msg
     FROM ${SCHEMA}.messages GROUP BY instance ORDER BY msgs DESC`
  );
  const roles = await pool.query(
    `SELECT role, count(*)::int as c FROM ${SCHEMA}.messages GROUP BY role`
  );
  const recentCrons = await pool.query(
    `SELECT cron_name, count(*)::int as runs, max(event_at) as last_run
     FROM ${SCHEMA}.cron_reports GROUP BY cron_name ORDER BY last_run DESC`
  );

  const userCount = roles.rows.find(r => r.role === 'user')?.c || 0;
  const assistantCount = roles.rows.find(r => r.role === 'assistant')?.c || 0;

  const instanceRows = instances.rows.map(r => `
<tr>
  <td><strong>${escapeHtml(r.instance)}</strong></td>
  <td>${r.msgs.toLocaleString()}</td>
  <td>${r.sess}</td>
  <td>${formatDate(r.first_msg)}</td>
  <td>${formatDate(r.last_msg)}</td>
</tr>`).join('');

  const cronRows = recentCrons.rows.map(r => `
<tr>
  <td>${escapeHtml(r.cron_name)}</td>
  <td>${r.runs}</td>
  <td>${formatDate(r.last_run)}</td>
</tr>`).join('');

  const html = `
<h2 style="margin:24px 0 16px">Database Stats</h2>
<div class="stat-grid">
  <div class="stat-card"><div class="number">${messages.rows[0].c.toLocaleString()}</div><div class="label">Messages</div></div>
  <div class="stat-card"><div class="number">${sessions.rows[0].c.toLocaleString()}</div><div class="label">Sessions</div></div>
  <div class="stat-card"><div class="number">${crons.rows[0].c.toLocaleString()}</div><div class="label">Cron Reports</div></div>
  <div class="stat-card"><div class="number">${userCount.toLocaleString()}</div><div class="label">User Messages</div></div>
  <div class="stat-card"><div class="number">${assistantCount.toLocaleString()}</div><div class="label">Assistant Messages</div></div>
  <div class="stat-card"><div class="number">${instances.rows.length}</div><div class="label">Instances</div></div>
</div>

<h3 style="margin:24px 0 12px">By Instance</h3>
<table>
<thead><tr><th>Instance</th><th>Messages</th><th>Sessions</th><th>First Message</th><th>Last Message</th></tr></thead>
<tbody>${instanceRows}</tbody>
</table>

<h3 style="margin:24px 0 12px">Cron Activity</h3>
<table>
<thead><tr><th>Cron</th><th>Total Runs</th><th>Last Run</th></tr></thead>
<tbody>${cronRows}</tbody>
</table>`;

  return layout('Stats', html, 'stats');
}

// ---- Server ----

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Login flow
    if (PASSWORD) {
      if (url.pathname === '/login' && req.method === 'POST') {
        const body = await parseBody(req);
        if (body.get('password') === PASSWORD) {
          const token = crypto.randomBytes(32).toString('hex');
          sessions.add(token);
          res.writeHead(302, { 
            'Location': '/',
            'Set-Cookie': `mc_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
          });
          return res.end();
        }
        return respond(res, 200, loginPage('Wrong password'));
      }
      if (!isAuthed(req)) {
        return respond(res, 200, loginPage());
      }
    }

    // API endpoints (for future use)
    if (url.pathname === '/api/search') {
      const q = url.searchParams.get('q') || '';
      const instance = url.searchParams.get('instance') || '';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      if (!q) return respondJson(res, { results: [] });
      
      const params = [q, limit];
      let where = `to_tsvector('english', content) @@ websearch_to_tsquery('english', $1)`;
      if (instance) { where += ` AND instance = $3`; params.push(instance); }
      
      const { rows } = await pool.query(
        `SELECT instance, role, content, created_at FROM ${SCHEMA}.messages
         WHERE ${where} ORDER BY created_at DESC LIMIT $2`, params
      );
      return respondJson(res, { results: rows });
    }

    // Page routes
    let html;
    switch (url.pathname) {
      case '/': html = await handleSearch(url); break;
      case '/crons': html = await handleCrons(url); break;
      case '/sessions': html = await handleSessions(url); break;
      case '/session': html = await handleSession(url); break;
      case '/stats': html = await handleStats(); break;
      default:
        res.writeHead(404);
        return res.end('Not found');
    }
    respond(res, 200, html);
  } catch (err) {
    console.error('Error:', err);
    respond(res, 500, `<pre>Error: ${escapeHtml(err.message)}</pre>`);
  }
});

server.listen(PORT, () => {
  console.log(`🦞 Mission Control running at http://localhost:${PORT}`);
  if (PASSWORD) console.log('Password protection enabled');
});
