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

function instanceColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

// ---- HTML Templates ----

function loginPage(error = '') {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mission Control — Login</title>
<style>${baseCSS()}
.login-box{max-width:360px;margin:100px auto;padding:40px;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3)}
.login-box h1{text-align:center;margin-bottom:32px;text-shadow:0 0 20px rgba(124,58,237,0.3)}
.login-box input{width:100%;padding:14px;margin-bottom:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#e0e0e0;font-size:16px;transition:all .2s}
.login-box input:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,0.2),0 0 20px rgba(124,58,237,0.4);background:rgba(255,255,255,0.08)}
.login-box button{width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:10px;color:#fff;font-size:16px;cursor:pointer;font-weight:600;box-shadow:0 4px 16px rgba(124,58,237,0.3);transition:all .2s}
.login-box button:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(124,58,237,0.5)}
.error{color:#ef4444;text-align:center;margin-bottom:16px;padding:10px;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.2)}
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
a{color:#818cf8;text-decoration:none;transition:color .15s}a:hover{color:#a5b4fc;text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:16px}
mark{background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;padding:2px 5px;border-radius:3px;box-shadow:0 0 8px rgba(124,58,237,0.4)}

/* Glassmorphism base */
.glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);transition:all .2s ease}
.glass:hover{transform:translateY(-1px);box-shadow:0 12px 40px rgba(0,0,0,0.4)}

/* Fade-in animation */
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn .3s ease forwards}

/* Loading skeleton */
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.skeleton{background:rgba(255,255,255,0.05);border-radius:8px;animation:pulse 2s ease-in-out infinite}
.skeleton-text{height:14px;margin:6px 0;width:100%}
.skeleton-text.short{width:60%}

/* Context panel */
.context-panel{position:fixed;top:0;right:-500px;width:500px;height:100vh;background:rgba(15,15,26,0.98);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-left:1px solid rgba(255,255,255,0.15);box-shadow:-8px 0 32px rgba(0,0,0,0.5);transition:right .3s ease;z-index:1000;overflow-y:auto;padding:20px}
.context-panel.open{right:0}
.context-panel-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1)}
.context-panel-header h3{font-size:16px;color:#e0e0e0}
.context-panel-close{background:rgba(255,255,255,0.08);border:none;color:#e0e0e0;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;transition:all .2s}
.context-panel-close:hover{background:rgba(255,255,255,0.15);transform:translateY(-1px)}
.context-msg{padding:14px;margin-bottom:10px;background:rgba(255,255,255,0.06);border-radius:10px;border-left:3px solid #3a3a5e;font-size:13px;transition:all .15s}
.context-msg.current{background:rgba(124,58,237,0.15);border-left-color:#7c3aed;box-shadow:0 0 16px rgba(124,58,237,0.3)}
.context-msg.user{border-left-color:#3b82f6}
.context-msg.assistant{border-left-color:#10b981}
.context-msg:hover{background:rgba(255,255,255,0.09);transform:translateY(-1px)}
.context-msg-meta{font-size:11px;color:#9ca3af;margin-bottom:6px;display:flex;gap:8px;align-items:center}
.context-msg-meta .role{text-transform:uppercase;font-weight:600}
.context-msg-meta .role.user{color:#3b82f6}
.context-msg-meta .role.assistant{color:#10b981}
.context-msg-content{color:#d1d5db;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.view-session-btn{display:block;width:100%;margin-top:16px;padding:12px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:10px;color:#fff;font-size:14px;cursor:pointer;font-weight:600;text-align:center;box-shadow:0 4px 16px rgba(124,58,237,0.3);transition:all .2s;text-decoration:none}
.view-session-btn:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(124,58,237,0.5);color:#fff}
.msg{cursor:pointer}
.msg.selected{background:rgba(124,58,237,0.2);border-color:#7c3aed;box-shadow:0 0 20px rgba(124,58,237,0.5),0 4px 20px rgba(0,0,0,0.2);transform:translateY(-2px) scale(1.01)}
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
header{background:rgba(255,255,255,0.05);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.1);padding:12px 0}
.header-inner{max-width:1200px;margin:0 auto;padding:0 16px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:20px;font-weight:700;color:#e0e0e0;text-shadow:0 0 20px rgba(124,58,237,0.3)}
.tabs{display:flex;gap:4px}
.tab{padding:8px 16px;border-radius:8px;color:#a0a0b0;font-size:14px;transition:all .2s;background:transparent}
.tab:hover{background:rgba(255,255,255,0.08);color:#e0e0e0;text-decoration:none;transform:translateY(-1px)}
.tab.active{background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.4)}
.search-box{margin:24px 0;display:flex;gap:8px;flex-wrap:wrap}
.search-box input,.search-box select{padding:12px 16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#e0e0e0;font-size:15px;transition:all .2s}
.search-box input[type=text]{flex:1;min-width:200px}
.search-box input[type=text]:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,0.2),0 0 20px rgba(124,58,237,0.4);background:rgba(255,255,255,0.08)}
.search-box select{min-width:130px}
.search-box select:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,0.2)}
.search-box button{padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:10px;color:#fff;font-size:15px;cursor:pointer;font-weight:600;box-shadow:0 4px 16px rgba(124,58,237,0.3);transition:all .2s}
.search-box button:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(124,58,237,0.5)}
.msg{padding:18px;margin-bottom:12px;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:12px;border:1px solid rgba(255,255,255,0.12);border-left:3px solid #3a3a5e;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:all .2s}
.msg:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.3)}
.msg.user{border-left-color:#3b82f6;border-left-width:4px}
.msg.assistant{border-left-color:#10b981;border-left-width:4px}
.msg-meta{font-size:12px;color:#9ca3af;margin-bottom:8px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.msg-meta .instance{padding:3px 10px;border-radius:6px;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.msg-meta .role{text-transform:uppercase;font-weight:600}
.msg-meta .role.user{color:#3b82f6}
.msg-meta .role.assistant{color:#10b981}
.msg-content{white-space:pre-wrap;word-break:break-word;font-size:14px;max-height:300px;overflow:hidden;position:relative}
.msg-content.expanded{max-height:none}
.msg-content.truncated::after{content:'';position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(transparent,#1e1e2e)}
.expand-btn{color:#818cf8;cursor:pointer;font-size:13px;margin-top:4px;display:inline-block}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:24px 0}
.stat-card{background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);padding:24px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:all .2s}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.3)}
.stat-card .number{font-size:36px;font-weight:700;background:linear-gradient(135deg,#7c3aed,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card .label{font-size:13px;color:#9ca3af;margin-top:8px;text-transform:uppercase;letter-spacing:0.5px}
table{width:100%;border-collapse:separate;border-spacing:0;margin:16px 0;background:rgba(255,255,255,0.06);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.2)}
th,td{padding:12px 16px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px}
th{color:#9ca3af;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;background:rgba(255,255,255,0.03)}
tr:hover td{background:rgba(255,255,255,0.04)}
tr:last-child td{border-bottom:none}
.cron-summary{max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.page-nav{display:flex;justify-content:center;gap:8px;margin:24px 0}
.page-nav a{padding:10px 20px;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#a0a0b0;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.page-nav a:hover{background:rgba(255,255,255,0.12);color:#e0e0e0;text-decoration:none;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.3)}
.empty{text-align:center;padding:60px;color:#6b7280;font-size:16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px dashed rgba(255,255,255,0.1)}
.date-range{display:flex;gap:8px;align-items:center}
.date-range label{color:#6b7280;font-size:13px}
</style></head><body>
<header><div class="header-inner">
<span class="logo">🦞 Mission Control</span>
<div class="tabs">${tabsHtml}</div>
</div></header>
<div class="container">${content}</div>

<!-- Context Panel -->
<div id="contextPanel" class="context-panel">
  <div class="context-panel-header">
    <h3>Conversation Context</h3>
    <button class="context-panel-close" onclick="closeContext()">Close ✕</button>
  </div>
  <div id="contextContent"></div>
</div>

<script>
document.querySelectorAll('.msg-content').forEach(el => {
  if (el.scrollHeight > 300) {
    el.classList.add('truncated');
    const btn = document.createElement('span');
    btn.className = 'expand-btn';
    btn.textContent = 'Show more ▼';
    btn.onclick = (e) => {
      e.stopPropagation();
      el.classList.toggle('expanded');
      el.classList.toggle('truncated');
      btn.textContent = el.classList.contains('expanded') ? 'Show less ▲' : 'Show more ▼';
    };
    el.parentNode.insertBefore(btn, el.nextSibling);
  }
});

async function showContext(msgId, instance, sessionId) {
  if (!msgId || !instance) return;
  
  const panel = document.getElementById('contextPanel');
  const content = document.getElementById('contextContent');
  
  // Show loading
  content.innerHTML = '<div class="skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>'.repeat(5);
  panel.classList.add('open');
  
  try {
    const res = await fetch(\`/api/context?id=\${msgId}&instance=\${encodeURIComponent(instance)}\`);
    const data = await res.json();
    
    if (!data.context || !data.context.length) {
      content.innerHTML = '<div class="empty" style="padding:20px">No context available</div>';
      return;
    }
    
    const contextHtml = data.context.map(m => {
      const isCurrent = m.id === parseInt(msgId);
      return \`
<div class="context-msg \${m.role} \${isCurrent ? 'current' : ''}">
  <div class="context-msg-meta">
    <span class="role \${m.role}">\${m.role}</span>
    <span>\${formatDate(m.created_at)}</span>
    \${isCurrent ? '<span style="color:#7c3aed">← Current</span>' : ''}
  </div>
  <div class="context-msg-content">\${escapeHtml(m.content)}</div>
</div>\`;
    }).join('');
    
    const viewSessionLink = sessionId ? 
      \`<a href="/session?id=\${sessionId}&instance=\${encodeURIComponent(instance)}" class="view-session-btn">View Full Session</a>\` : '';
    
    content.innerHTML = contextHtml + viewSessionLink;
  } catch (err) {
    console.error('Context fetch error:', err);
    content.innerHTML = '<div class="empty" style="padding:20px">Failed to load context</div>';
  }
}

function closeContext() {
  document.getElementById('contextPanel').classList.remove('open');
}

// Keyboard navigation
let selectedIndex = -1;

function getMessages() {
  return Array.from(document.querySelectorAll('.msg[data-msg-id]'));
}

function selectMessage(index) {
  const messages = getMessages();
  if (index < 0 || index >= messages.length) return;
  
  // Remove previous selection
  messages.forEach(m => m.classList.remove('selected'));
  
  // Select new message
  selectedIndex = index;
  const msg = messages[index];
  msg.classList.add('selected');
  
  // Scroll into view
  msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function openSelectedContext() {
  const messages = getMessages();
  if (selectedIndex < 0 || selectedIndex >= messages.length) return;
  
  const msg = messages[selectedIndex];
  const msgId = msg.dataset.msgId;
  const instance = msg.dataset.instance;
  const sessionId = msg.dataset.sessionId;
  
  if (msgId && instance) {
    showContext(msgId, instance, sessionId);
  }
}

function clearSelection() {
  getMessages().forEach(m => m.classList.remove('selected'));
  selectedIndex = -1;
}

// Global keyboard handler
document.addEventListener('keydown', (e) => {
  const target = e.target;
  const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
  
  // / to focus search (only when not already in an input)
  if (e.key === '/' && !isInputFocused) {
    e.preventDefault();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }
  
  // Don't interfere with typing in inputs
  if (isInputFocused && e.key !== 'Escape') return;
  
  // Esc to close context panel and clear selection
  if (e.key === 'Escape') {
    e.preventDefault();
    closeContext();
    clearSelection();
    // Also blur any focused input
    if (isInputFocused) target.blur();
    return;
  }
  
  const messages = getMessages();
  if (!messages.length) return;
  
  // j to select next message
  if (e.key === 'j') {
    e.preventDefault();
    const nextIndex = selectedIndex < 0 ? 0 : Math.min(selectedIndex + 1, messages.length - 1);
    selectMessage(nextIndex);
    return;
  }
  
  // k to select previous message
  if (e.key === 'k') {
    e.preventDefault();
    const prevIndex = selectedIndex < 0 ? 0 : Math.max(selectedIndex - 1, 0);
    selectMessage(prevIndex);
    return;
  }
  
  // Enter to open context for selected message
  if (e.key === 'Enter' && selectedIndex >= 0) {
    e.preventDefault();
    openSelectedContext();
    return;
  }
});

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', { timeZone: 'Europe/Sofia', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
</body></html>`;
}

function renderMessages(rows, useHeadline = false) {
  if (!rows.length) return '<div class="empty">No messages found</div>';
  return rows.map((r, idx) => {
    const content = useHeadline && r.headline ? r.headline : escapeHtml(r.content);
    const color = instanceColor(r.instance);
    const msgId = r.id || r.message_id || '';
    return `
<div class="msg ${r.role} fade-in" style="animation-delay:${idx * 0.03}s" 
     data-msg-id="${msgId}" 
     data-instance="${escapeHtml(r.instance)}" 
     data-session-id="${escapeHtml(r.session_id || '')}"
     onclick="showContext('${msgId}', '${escapeHtml(r.instance)}', '${escapeHtml(r.session_id || '')}')">
  <div class="msg-meta">
    <span class="instance" style="background:${color};color:#fff">${escapeHtml(r.instance)}</span>
    <span class="role ${r.role}">${r.role}</span>
    <span>${formatDate(r.created_at)}</span>
    ${r.rank ? `<span style="color:#7c3aed">relevance: ${parseFloat(r.rank).toFixed(3)}</span>` : ''}
  </div>
  <div class="msg-content">${content}</div>
</div>`;
  }).join('');
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
      `SELECT id, instance, session_id, role, content, created_at,
              ts_rank(to_tsvector('english', content), websearch_to_tsquery('english', $1)) as rank,
              ts_headline('english', content, websearch_to_tsquery('english', $1),
                'StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MaxWords=30') as headline
       FROM ${SCHEMA}.messages
       WHERE ${where.join(' AND ')}
       ORDER BY rank DESC, created_at DESC
       LIMIT $2 OFFSET $3`, params
    );
    rows = r;
  } else {
    // Default: show latest 50 messages
    const { rows: r } = await pool.query(
      `SELECT id, instance, session_id, role, content, created_at
       FROM ${SCHEMA}.messages
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`, [limit, offset]
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
<form class="search-box" method="GET" action="/" id="searchForm">
  <input type="text" name="q" id="searchInput" value="${escapeHtml(q)}" placeholder="Search conversations..." autofocus>
  <select name="instance" id="instanceFilter"><option value="">All instances</option>${instanceOptions}</select>
  <select name="role" id="roleFilter">
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
${q ? `<p style="color:#6b7280;margin-bottom:16px" id="resultCount">${rows.length} result${rows.length !== 1 ? 's' : ''} for "${escapeHtml(q)}"${instance ? ' in ' + escapeHtml(instance) : ''}</p>` : ''}
<div id="resultsContainer">
${q ? renderMessages(rows, true) : renderMessages(rows, false)}
</div>
${(prevPage || nextPage) ? `<div class="page-nav">${prevPage}${nextPage}</div>` : ''}
<script>
let searchTimeout;
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const resultCount = document.getElementById('resultCount');
let isLoading = false;
let offset = ${q ? rows.length : limit};

// Live search on keydown (debounced)
searchInput?.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  
  if (query.length >= 3) {
    searchTimeout = setTimeout(() => performSearch(query), 300);
  } else if (query.length === 0) {
    // Empty query = show default latest messages
    searchTimeout = setTimeout(() => loadDefaultMessages(), 300);
  }
});

async function performSearch(query) {
  const instance = document.getElementById('instanceFilter')?.value || '';
  
  // Show loading skeleton
  resultsContainer.innerHTML = \`
<div class="msg skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
<div class="msg skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
<div class="msg skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
\`;
  
  try {
    const res = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&instance=\${instance}\`);
    const data = await res.json();
    displayResults(data.results, query, true);
  } catch (err) {
    console.error('Search error:', err);
    resultsContainer.innerHTML = '<div class="empty">Search failed. Please try again.</div>';
  }
}

async function loadDefaultMessages() {
  // Show loading skeleton
  resultsContainer.innerHTML = \`
<div class="msg skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
<div class="msg skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
<div class="msg skeleton"><div class="skeleton-text"></div><div class="skeleton-text short"></div></div>
\`;
  
  try {
    const res = await fetch(\`/api/messages?offset=0&limit=50\`);
    const data = await res.json();
    displayResults(data.results, '', false);
    offset = data.results.length;
  } catch (err) {
    console.error('Load error:', err);
    resultsContainer.innerHTML = '<div class="empty">Failed to load messages. Please try again.</div>';
  }
}

function displayResults(results, query, isSearch) {
  if (!results.length) {
    resultsContainer.innerHTML = '<div class="empty">No messages found</div>';
    if (resultCount) resultCount.textContent = '';
    return;
  }
  
  if (resultCount && query) {
    resultCount.textContent = \`\${results.length} result\${results.length !== 1 ? 's' : ''} for "\${query}"\`;
  } else if (resultCount) {
    resultCount.textContent = '';
  }
  
  resultsContainer.innerHTML = results.map((r, idx) => {
    const content = isSearch && r.headline ? r.headline : escapeHtml(r.content);
    const color = instanceColor(r.instance);
    const msgId = r.id || '';
    const sessionId = r.session_id || '';
    return \`
<div class="msg \${r.role} fade-in" style="animation-delay:\${idx * 0.03}s" 
     data-msg-id="\${msgId}" 
     data-instance="\${escapeHtml(r.instance)}" 
     data-session-id="\${sessionId}"
     onclick="showContext('\${msgId}', '\${escapeHtml(r.instance)}', '\${sessionId}')">
  <div class="msg-meta">
    <span class="instance" style="background:\${color};color:#fff">\${escapeHtml(r.instance)}</span>
    <span class="role \${r.role}">\${r.role}</span>
    <span>\${formatDate(r.created_at)}</span>
    \${r.rank ? \`<span style="color:#7c3aed">relevance: \${parseFloat(r.rank).toFixed(3)}</span>\` : ''}
  </div>
  <div class="msg-content">\${content}</div>
</div>\`;
  }).join('');
  
  // Re-attach expand handlers
  attachExpandHandlers();
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', { timeZone: 'Europe/Sofia', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function instanceColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return \`hsl(\${hue}, 70%, 45%)\`;
}

function attachExpandHandlers() {
  document.querySelectorAll('.msg-content').forEach(el => {
    const existingBtn = el.nextElementSibling;
    if (existingBtn?.classList.contains('expand-btn')) {
      existingBtn.remove();
    }
    
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
}

// Infinite scroll for default view
window.addEventListener('scroll', () => {
  if (isLoading || searchInput.value.trim().length >= 3) return;
  
  const scrolledToBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
  if (scrolledToBottom) {
    loadMore();
  }
});

async function loadMore() {
  if (isLoading) return;
  isLoading = true;
  
  try {
    const res = await fetch(\`/api/messages?offset=\${offset}&limit=50\`);
    const data = await res.json();
    
    if (data.results.length > 0) {
      const newMessages = data.results.map((r, idx) => {
        const color = instanceColor(r.instance);
        const msgId = r.id || '';
        const sessionId = r.session_id || '';
        return \`
<div class="msg \${r.role} fade-in" style="animation-delay:\${idx * 0.03}s"
     data-msg-id="\${msgId}" 
     data-instance="\${escapeHtml(r.instance)}" 
     data-session-id="\${sessionId}"
     onclick="showContext('\${msgId}', '\${escapeHtml(r.instance)}', '\${sessionId}')">
  <div class="msg-meta">
    <span class="instance" style="background:\${color};color:#fff">\${escapeHtml(r.instance)}</span>
    <span class="role \${r.role}">\${r.role}</span>
    <span>\${formatDate(r.created_at)}</span>
  </div>
  <div class="msg-content">\${escapeHtml(r.content)}</div>
</div>\`;
      }).join('');
      
      resultsContainer.insertAdjacentHTML('beforeend', newMessages);
      offset += data.results.length;
      attachExpandHandlers();
    }
  } catch (err) {
    console.error('Load more error:', err);
  } finally {
    isLoading = false;
  }
}
</script>`;

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

    // API endpoints
    if (url.pathname === '/api/search') {
      const q = url.searchParams.get('q') || '';
      const instance = url.searchParams.get('instance') || '';
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
      if (!q) return respondJson(res, { results: [] });
      
      const params = [q, limit];
      let where = `to_tsvector('english', content) @@ websearch_to_tsquery('english', $1)`;
      if (instance) { 
        where += ` AND instance = $${params.length + 1}`; 
        params.push(instance); 
      }
      
      const { rows } = await pool.query(
        `SELECT id, instance, session_id, role, content, created_at,
                ts_headline('english', content, websearch_to_tsquery('english', $1),
                  'StartSel=<mark>, StopSel=</mark>, MaxFragments=2, MaxWords=30') as headline
         FROM ${SCHEMA}.messages
         WHERE ${where} 
         ORDER BY created_at DESC 
         LIMIT $2`, params
      );
      return respondJson(res, { results: rows });
    }

    if (url.pathname === '/api/messages') {
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      
      const { rows } = await pool.query(
        `SELECT id, instance, session_id, role, content, created_at 
         FROM ${SCHEMA}.messages
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`, [limit, offset]
      );
      return respondJson(res, { results: rows, offset, limit });
    }

    if (url.pathname === '/api/context') {
      const msgId = url.searchParams.get('id');
      const instance = url.searchParams.get('instance');
      if (!msgId || !instance) {
        return respondJson(res, { error: 'Missing id or instance' });
      }
      
      // Get the target message's created_at timestamp
      const { rows: target } = await pool.query(
        `SELECT created_at, session_id FROM ${SCHEMA}.messages WHERE id = $1 AND instance = $2`,
        [msgId, instance]
      );
      
      if (!target.length) {
        return respondJson(res, { error: 'Message not found' });
      }
      
      const targetTime = target[0].created_at;
      const sessionId = target[0].session_id;
      
      // Get ±5 messages around this time in the same session
      const { rows } = await pool.query(
        `(SELECT id, role, content, created_at 
          FROM ${SCHEMA}.messages 
          WHERE instance = $1 AND session_id = $2 AND created_at < $3
          ORDER BY created_at DESC LIMIT 5)
         UNION ALL
         (SELECT id, role, content, created_at 
          FROM ${SCHEMA}.messages 
          WHERE instance = $1 AND session_id = $2 AND created_at >= $3
          ORDER BY created_at ASC LIMIT 6)
         ORDER BY created_at ASC`,
        [instance, sessionId, targetTime]
      );
      
      return respondJson(res, { context: rows });
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
