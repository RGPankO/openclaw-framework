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
    { id: 'kanban', label: '📋 Kanban', href: '/kanban' },
    { id: 'timeline', label: '⏱️ Timeline', href: '/timeline' },
    { id: 'crons', label: '⚙️ Crons', href: '/crons' },
    { id: 'sessions', label: '💬 Sessions', href: '/sessions' },
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

async function handleTimeline(url) {
  const viewMode = url.searchParams.get('view') || 'day'; // hour, day, week
  const filterInstance = url.searchParams.get('instance') || '';
  
  // Calculate time range based on view mode
  const now = new Date();
  let startTime, endTime, bucketSize, bucketLabel;
  
  if (viewMode === 'hour') {
    // Last 24 hours, 1-hour buckets
    startTime = new Date(now - 24 * 60 * 60 * 1000);
    endTime = now;
    bucketSize = 60 * 60 * 1000; // 1 hour in ms
    bucketLabel = 'hour';
  } else if (viewMode === 'week') {
    // Last 7 days, 1-day buckets
    startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
    endTime = now;
    bucketSize = 24 * 60 * 60 * 1000; // 1 day in ms
    bucketLabel = 'day';
  } else {
    // Default: last 48 hours, 2-hour buckets
    startTime = new Date(now - 48 * 60 * 60 * 1000);
    endTime = now;
    bucketSize = 2 * 60 * 60 * 1000; // 2 hours in ms
    bucketLabel = '2hr';
  }
  
  // Get all instances
  const { rows: instances } = await pool.query(
    `SELECT DISTINCT instance FROM ${SCHEMA}.sessions ORDER BY instance`
  );
  
  const instanceFilter = filterInstance || instances.map(i => i.instance);
  const instanceArray = Array.isArray(instanceFilter) ? instanceFilter : [instanceFilter];
  
  // Get session activity in time range
  const { rows: sessions } = await pool.query(
    `SELECT s.instance, s.session_id, s.started_at, s.source, s.model,
            MIN(m.created_at) as first_msg,
            MAX(m.created_at) as last_msg,
            COUNT(m.id)::int as msg_count
     FROM ${SCHEMA}.sessions s
     LEFT JOIN ${SCHEMA}.messages m ON s.instance = m.instance AND s.session_id = m.session_id
     WHERE s.started_at >= $1 AND s.started_at <= $2
     ${filterInstance ? 'AND s.instance = $3' : ''}
     GROUP BY s.instance, s.session_id, s.started_at, s.source, s.model
     ORDER BY s.started_at DESC`,
    filterInstance ? [startTime, endTime, filterInstance] : [startTime, endTime]
  );
  
  // Build timeline data: buckets x instances
  const numBuckets = Math.ceil((endTime - startTime) / bucketSize);
  const timelineData = [];
  
  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = new Date(startTime.getTime() + i * bucketSize);
    const bucketEnd = new Date(bucketStart.getTime() + bucketSize);
    
    const bucket = {
      start: bucketStart,
      end: bucketEnd,
      label: formatTimeLabel(bucketStart, viewMode),
      instances: {}
    };
    
    instances.forEach(inst => {
      const sessionsInBucket = sessions.filter(s => {
        const sessionStart = new Date(s.first_msg || s.started_at);
        const sessionEnd = new Date(s.last_msg || s.started_at);
        return s.instance === inst.instance &&
               sessionStart < bucketEnd && sessionEnd >= bucketStart;
      });
      
      bucket.instances[inst.instance] = {
        count: sessionsInBucket.length,
        sessions: sessionsInBucket,
        messages: sessionsInBucket.reduce((sum, s) => sum + s.msg_count, 0)
      };
    });
    
    timelineData.push(bucket);
  }
  
  // Build instance filter dropdown
  const instanceOptions = instances.map(i =>
    `<option value="${i.instance}" ${filterInstance === i.instance ? 'selected' : ''}>${i.instance}</option>`
  ).join('');
  
  // Build timeline visualization
  const timelineHTML = timelineData.map((bucket, idx) => {
    const bars = instances.map(inst => {
      const data = bucket.instances[inst.instance];
      const height = Math.min(data.messages * 2, 150); // Scale: 2px per message, max 150px
      const color = instanceColor(inst.instance);
      const opacity = data.count > 0 ? 0.8 : 0.1;
      
      const tooltipContent = data.count > 0 ?
        `${inst.instance}: ${data.count} session${data.count !== 1 ? 's' : ''}, ${data.messages} msg${data.messages !== 1 ? 's' : ''}` :
        `${inst.instance}: no activity`;
      
      return `
<div class="timeline-bar" 
     data-instance="${escapeHtml(inst.instance)}" 
     data-count="${data.count}"
     data-messages="${data.messages}"
     style="height:${height}px;background:${color};opacity:${opacity}"
     title="${tooltipContent}"
     onclick="showBucketSessions(${idx})">
</div>`;
    }).join('');
    
    return `
<div class="timeline-bucket" data-bucket-idx="${idx}">
  <div class="timeline-bars">${bars}</div>
  <div class="timeline-label">${bucket.label}</div>
</div>`;
  }).join('');
  
  // Build instance legend
  const legend = instances.map(inst => {
    const color = instanceColor(inst.instance);
    const totalSessions = sessions.filter(s => s.instance === inst.instance).length;
    const totalMessages = sessions.filter(s => s.instance === inst.instance).reduce((sum, s) => sum + s.msg_count, 0);
    
    return `
<div class="legend-item" onclick="filterByInstance('${inst.instance}')">
  <div class="legend-color" style="background:${color}"></div>
  <div class="legend-label">${escapeHtml(inst.instance)}</div>
  <div class="legend-stats">${totalSessions} sessions, ${totalMessages} msgs</div>
</div>`;
  }).join('');
  
  const sessionsJson = JSON.stringify(timelineData);
  
  const html = `
<div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
  <h2 style="margin:0">Session Timeline</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <select id="viewMode" onchange="changeView(this.value)" style="padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e0e0e0;font-size:13px">
      <option value="hour" ${viewMode === 'hour' ? 'selected' : ''}>Last 24 Hours</option>
      <option value="day" ${viewMode === 'day' ? 'selected' : ''}>Last 48 Hours</option>
      <option value="week" ${viewMode === 'week' ? 'selected' : ''}>Last 7 Days</option>
    </select>
    <select id="instanceFilter" onchange="filterByInstance(this.value)" style="padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e0e0e0;font-size:13px">
      <option value="">All Instances</option>
      ${instanceOptions}
    </select>
  </div>
</div>

<div class="timeline-legend">${legend}</div>

<div class="timeline-container">
  <div class="timeline-grid">${timelineHTML}</div>
</div>

<div id="sessionDetails" class="session-details" style="display:none">
  <h3 style="margin-bottom:16px">Sessions in Time Window</h3>
  <div id="sessionDetailsList"></div>
</div>

<style>
.timeline-container{background:rgba(255,255,255,0.06);border-radius:12px;padding:24px;margin:24px 0;overflow-x:auto}
.timeline-grid{display:flex;gap:4px;align-items:flex-end;min-height:200px}
.timeline-bucket{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:60px}
.timeline-bars{display:flex;gap:2px;align-items:flex-end;min-height:150px}
.timeline-bar{width:12px;border-radius:4px 4px 0 0;transition:all .2s;cursor:pointer;position:relative}
.timeline-bar:hover{opacity:1!important;transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.4)}
.timeline-label{font-size:10px;color:#6b7280;text-align:center;writing-mode:horizontal-tb;transform:rotate(-45deg);transform-origin:center;white-space:nowrap;margin-top:8px}
.timeline-legend{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0;padding:16px;background:rgba(255,255,255,0.04);border-radius:8px}
.legend-item{display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 12px;border-radius:6px;transition:all .2s}
.legend-item:hover{background:rgba(255,255,255,0.08)}
.legend-color{width:16px;height:16px;border-radius:4px}
.legend-label{font-size:13px;font-weight:600;color:#e0e0e0}
.legend-stats{font-size:11px;color:#6b7280}
.session-details{background:rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-top:24px}
.session-item{padding:12px;margin-bottom:8px;background:rgba(255,255,255,0.06);border-radius:8px;border-left:3px solid;font-size:13px;transition:all .2s;cursor:pointer}
.session-item:hover{background:rgba(255,255,255,0.1);transform:translateY(-1px)}
.session-meta{font-size:11px;color:#9ca3af;margin-top:4px}
</style>

<script>
const timelineData = ${sessionsJson};

function changeView(mode) {
  window.location.href = '/timeline?view=' + mode + (document.getElementById('instanceFilter').value ? '&instance=' + document.getElementById('instanceFilter').value : '');
}

function filterByInstance(instance) {
  window.location.href = '/timeline?view=${viewMode}' + (instance ? '&instance=' + instance : '');
}

function showBucketSessions(bucketIdx) {
  const bucket = timelineData[bucketIdx];
  const detailsDiv = document.getElementById('sessionDetails');
  const listDiv = document.getElementById('sessionDetailsList');
  
  // Collect all sessions from this bucket
  let allSessions = [];
  Object.keys(bucket.instances).forEach(inst => {
    bucket.instances[inst].sessions.forEach(s => {
      allSessions.push(s);
    });
  });
  
  if (allSessions.length === 0) {
    listDiv.innerHTML = '<div class="empty">No sessions in this time window</div>';
    detailsDiv.style.display = 'block';
    return;
  }
  
  allSessions.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  
  listDiv.innerHTML = allSessions.map(s => {
    const color = instanceColor(s.instance);
    return \`
<div class="session-item" style="border-left-color:\${color}" onclick="location.href='/session?id=\${s.session_id}&instance=\${s.instance}'">
  <div><strong>\${escapeHtml(s.instance)}</strong> / \${s.session_id.slice(0, 8)}...</div>
  <div class="session-meta">\${s.msg_count} messages • \${formatDate(s.started_at)} → \${formatDate(s.last_msg)}</div>
  <div class="session-meta">Source: \${s.source || '—'} • Model: \${s.model || '—'}</div>
</div>\`;
  }).join('');
  
  detailsDiv.style.display = 'block';
  detailsDiv.scrollIntoView({ behavior: 'smooth' });
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
</script>`;
  
  return layout('Timeline', html, 'timeline');
}

function formatTimeLabel(date, mode) {
  const opts = { timeZone: 'Europe/Sofia' };
  if (mode === 'hour') {
    return date.toLocaleString('en-GB', { ...opts, hour: '2-digit', minute: '2-digit' });
  } else if (mode === 'week') {
    return date.toLocaleDateString('en-GB', { ...opts, month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleString('en-GB', { ...opts, month: 'short', day: 'numeric', hour: '2-digit' });
  }
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

async function handleKanban(url) {
  const boardId = url.searchParams.get('board');
  
  if (boardId) {
    // Show specific board with replay UI
    const { rows: [board] } = await pool.query(
      `SELECT id, instance, cron_name, name, created_at 
       FROM ${SCHEMA}.kanban_boards WHERE id = $1`, [boardId]
    );
    
    if (!board) {
      return layout('Kanban', '<div class="empty">Board not found</div>');
    }
    
    // Get all events for this board
    const { rows: events } = await pool.query(
      `SELECT e.id, e.item_id, e.event_type, e.data, e.created_by, e.created_at,
              i.title as item_title
       FROM ${SCHEMA}.kanban_events e
       LEFT JOIN ${SCHEMA}.kanban_items i ON e.item_id = i.id
       WHERE e.board_id = $1
       ORDER BY e.created_at ASC`, [boardId]
    );
    
    // Get current state of items
    const { rows: items } = await pool.query(
      `SELECT id, title, current_status, priority, created_at, updated_at
       FROM ${SCHEMA}.kanban_items
       WHERE board_id = $1
       ORDER BY priority DESC, created_at DESC`, [boardId]
    );
    
    const itemsJson = JSON.stringify(items);
    const eventsJson = JSON.stringify(events);
    
    const html = `
<div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
  <div>
    <a href="/kanban" style="color:#818cf8;font-size:14px">← Back to boards</a>
    <h2 style="margin:12px 0 4px">${escapeHtml(board.name)}</h2>
    <p style="color:#6b7280;font-size:13px">${escapeHtml(board.instance)} / ${escapeHtml(board.cron_name)}</p>
  </div>
  <div style="color:#6b7280;font-size:13px">
    ${items.length} item${items.length !== 1 ? 's' : ''} • ${events.length} event${events.length !== 1 ? 's' : ''}
  </div>
</div>

<div id="kanbanBoard" class="kanban-board">
  <div class="kanban-column" data-status="backlog">
    <h3>Backlog</h3>
    <div class="kanban-cards" id="backlog"></div>
  </div>
  <div class="kanban-column" data-status="in_progress">
    <h3>In Progress</h3>
    <div class="kanban-cards" id="in_progress"></div>
  </div>
  <div class="kanban-column" data-status="review">
    <h3>Review</h3>
    <div class="kanban-cards" id="review"></div>
  </div>
  <div class="kanban-column" data-status="done">
    <h3>Done</h3>
    <div class="kanban-cards" id="done"></div>
  </div>
</div>

${events.length > 0 ? `
<div class="timeline-controls">
  <button id="playBtn" class="timeline-btn">▶ Play</button>
  <button id="stepBackBtn" class="timeline-btn">◀ Step</button>
  <button id="stepFwdBtn" class="timeline-btn">Step ▶</button>
  <button id="resetBtn" class="timeline-btn">↺ Reset</button>
  <div class="timeline-speed">
    <label>Speed:</label>
    <select id="speedSelect">
      <option value="100">0.1s</option>
      <option value="500" selected>0.5s</option>
      <option value="1000">1s</option>
      <option value="2000">2s</option>
      <option value="5000">5s</option>
    </select>
  </div>
  <div class="timeline-scrubber">
    <input type="range" id="timelineScrubber" min="0" max="${events.length}" value="0" step="1">
    <div id="timelineLabel">Event <span id="eventIdx">0</span> / ${events.length}</div>
  </div>
</div>

<div class="event-log" id="eventLog"></div>
` : '<div class="empty" style="margin-top:24px">No events yet</div>'}

<style>
.kanban-board{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
.kanban-column{background:rgba(255,255,255,0.06);border-radius:12px;padding:16px;min-height:400px}
.kanban-column h3{margin:0 0 12px;font-size:14px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px}
.kanban-cards{display:flex;flex-direction:column;gap:8px}
.kanban-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:12px;font-size:13px;transition:all .2s;cursor:pointer}
.kanban-card:hover{background:rgba(255,255,255,0.12);transform:translateY(-1px)}
.kanban-card.priority-high{border-left:3px solid #ef4444}
.kanban-card.priority-medium{border-left:3px solid #f59e0b}
.kanban-card.priority-low{border-left:3px solid #10b981}
.kanban-card-title{font-weight:600;margin-bottom:4px}
.kanban-card-meta{font-size:11px;color:#6b7280}
.timeline-controls{background:rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:24px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.timeline-btn{padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:8px;color:#fff;font-size:14px;cursor:pointer;font-weight:600;transition:all .2s}
.timeline-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(124,58,237,0.4)}
.timeline-btn:disabled{opacity:0.4;cursor:not-allowed}
.timeline-speed{display:flex;align-items:center;gap:8px}
.timeline-speed label{color:#9ca3af;font-size:13px}
.timeline-speed select{padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e0e0e0;font-size:13px}
.timeline-scrubber{flex:1;display:flex;flex-direction:column;gap:4px}
.timeline-scrubber input{width:100%;height:6px;border-radius:3px;background:rgba(255,255,255,0.1);outline:none;-webkit-appearance:none;appearance:none}
.timeline-scrubber input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#7c3aed;cursor:pointer}
.timeline-scrubber input::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#7c3aed;cursor:pointer;border:none}
#timelineLabel{color:#9ca3af;font-size:12px;text-align:center}
#eventIdx{color:#7c3aed;font-weight:600}
.event-log{background:rgba(255,255,255,0.06);border-radius:12px;padding:16px;max-height:300px;overflow-y:auto}
.event-log-item{padding:10px;margin-bottom:8px;background:rgba(255,255,255,0.04);border-radius:6px;font-size:12px;border-left:3px solid #6366f1}
.event-log-item.current{border-left-color:#7c3aed;background:rgba(124,58,237,0.1)}
.event-log-time{color:#6b7280;font-size:11px;margin-bottom:4px}
.event-log-desc{color:#d1d5db}
@keyframes cardAppear{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
@keyframes cardMove{0%,100%{transform:translateX(0)}50%{transform:translateX(20px)}}
.kanban-card.animate-appear{animation:cardAppear .3s ease}
.kanban-card.animate-move{animation:cardMove .5s ease}
</style>

<script>
const boardData = ${itemsJson};
const eventsData = ${eventsJson};
let currentEventIdx = 0;
let isPlaying = false;
let playInterval = null;

function renderBoard(state) {
  ['backlog', 'in_progress', 'review', 'done'].forEach(status => {
    document.getElementById(status).innerHTML = '';
  });
  
  state.forEach(item => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    if (item.priority >= 75) card.classList.add('priority-high');
    else if (item.priority >= 50) card.classList.add('priority-medium');
    else card.classList.add('priority-low');
    
    card.innerHTML = '<div class="kanban-card-title">' + escapeHtml(item.title) + '</div><div class="kanban-card-meta">Priority: ' + item.priority + '</div>';
    
    const column = document.getElementById(item.current_status);
    if (column) {
      column.appendChild(card);
      setTimeout(() => card.classList.add('animate-appear'), 10);
    }
  });
}

function applyEvent(state, event) {
  const newState = JSON.parse(JSON.stringify(state));
  
  switch (event.event_type) {
    case 'item_created':
      newState.push({
        id: event.item_id,
        title: event.data.title,
        current_status: event.data.status || 'backlog',
        priority: event.data.priority || 50
      });
      break;
    
    case 'status_changed':
      const item = newState.find(i => i.id === event.item_id);
      if (item) item.current_status = event.data.new_status;
      break;
    
    case 'priority_changed':
      const item2 = newState.find(i => i.id === event.item_id);
      if (item2) item2.priority = event.data.new_priority;
      break;
    
    case 'title_changed':
      const item3 = newState.find(i => i.id === event.item_id);
      if (item3) item3.title = event.data.new_title;
      break;
  }
  
  return newState;
}

function replayToIndex(idx) {
  let state = [];
  for (let i = 0; i < idx && i < eventsData.length; i++) {
    state = applyEvent(state, eventsData[i]);
  }
  renderBoard(state);
  updateEventLog(idx);
  document.getElementById('eventIdx').textContent = idx;
  document.getElementById('timelineScrubber').value = idx;
  currentEventIdx = idx;
}

function updateEventLog(currentIdx) {
  const log = document.getElementById('eventLog');
  if (!log) return;
  
  log.innerHTML = eventsData.slice(Math.max(0, currentIdx - 5), currentIdx + 5).map((e, i) => {
    const globalIdx = Math.max(0, currentIdx - 5) + i;
    const isCurrent = globalIdx === currentIdx - 1;
    const dt = new Date(e.created_at).toLocaleString('en-GB', { timeZone: 'Europe/Sofia' });
    return '<div class="event-log-item ' + (isCurrent ? 'current' : '') + '"><div class="event-log-time">' + dt + '</div><div class="event-log-desc"><strong>' + e.event_type + '</strong>: ' + (e.item_title || 'item #' + e.item_id) + ' by ' + (e.created_by || 'unknown') + '</div></div>';
  }).join('');
}

function play() {
  if (currentEventIdx >= eventsData.length) currentEventIdx = 0;
  isPlaying = true;
  document.getElementById('playBtn').textContent = '⏸ Pause';
  const speed = parseInt(document.getElementById('speedSelect').value);
  playInterval = setInterval(() => {
    if (currentEventIdx >= eventsData.length) { pause(); return; }
    replayToIndex(currentEventIdx + 1);
  }, speed);
}

function pause() {
  isPlaying = false;
  document.getElementById('playBtn').textContent = '▶ Play';
  if (playInterval) { clearInterval(playInterval); playInterval = null; }
}

document.getElementById('playBtn')?.addEventListener('click', () => { if (isPlaying) pause(); else play(); });
document.getElementById('stepBackBtn')?.addEventListener('click', () => { pause(); replayToIndex(Math.max(0, currentEventIdx - 1)); });
document.getElementById('stepFwdBtn')?.addEventListener('click', () => { pause(); replayToIndex(Math.min(eventsData.length, currentEventIdx + 1)); });
document.getElementById('resetBtn')?.addEventListener('click', () => { pause(); replayToIndex(0); });
document.getElementById('timelineScrubber')?.addEventListener('input', (e) => { pause(); replayToIndex(parseInt(e.target.value)); });
document.getElementById('speedSelect')?.addEventListener('change', () => { if (isPlaying) { pause(); play(); } });

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

replayToIndex(eventsData.length);
</script>`;
    
    return layout('Kanban: ' + escapeHtml(board.name), html, 'kanban');
  }
  
  // List all boards
  const { rows: boards } = await pool.query(
    `SELECT b.id, b.instance, b.cron_name, b.name, b.created_at,
            (SELECT count(*) FROM ${SCHEMA}.kanban_items WHERE board_id = b.id) as item_count,
            (SELECT count(*) FROM ${SCHEMA}.kanban_events WHERE board_id = b.id) as event_count
     FROM ${SCHEMA}.kanban_boards b
     ORDER BY b.created_at DESC`
  );
  
  if (!boards.length) {
    const html = `
<h2 style="margin:24px 0 16px">Kanban Boards</h2>
<div class="empty">
  <p>No kanban boards yet.</p>
  <p style="margin-top:12px;font-size:14px">Crons can create boards and track tasks using the kanban tables.</p>
</div>`;
    return layout('Kanban', html, 'kanban');
  }
  
  const boardCards = boards.map((b, idx) => {
    const color = instanceColor(b.instance);
    return `
<div class="stat-card fade-in" style="animation-delay:${idx * 0.05}s;cursor:pointer" onclick="location.href='/kanban?board=${b.id}'">
  <div style="text-align:left;margin-bottom:12px">
    <h3 style="font-size:16px;margin-bottom:4px">${escapeHtml(b.name)}</h3>
    <div style="font-size:12px;color:#6b7280">
      <span class="instance" style="background:${color};color:#fff;padding:2px 8px;border-radius:4px">${escapeHtml(b.instance)}</span>
      <span style="margin-left:8px">${escapeHtml(b.cron_name)}</span>
    </div>
  </div>
  <div style="display:flex;gap:16px;justify-center;margin-top:16px">
    <div><div class="number" style="font-size:24px">${b.item_count}</div><div class="label">Items</div></div>
    <div><div class="number" style="font-size:24px">${b.event_count}</div><div class="label">Events</div></div>
  </div>
</div>`;
  }).join('');
  
  const html = `
<h2 style="margin:24px 0 16px">Kanban Boards</h2>
<div class="stat-grid">${boardCards}</div>`;
  
  return layout('Kanban', html, 'kanban');
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

    // Kanban API endpoints
    if (url.pathname === '/api/kanban/boards' && req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT id, instance, cron_name, name, created_at FROM ${SCHEMA}.kanban_boards ORDER BY created_at DESC`
      );
      return respondJson(res, { boards: rows });
    }
    
    if (url.pathname === '/api/kanban/board' && req.method === 'POST') {
      const body = await parseBody(req);
      const instance = body.get('instance');
      const cronName = body.get('cron_name');
      const name = body.get('name');
      
      if (!instance || !cronName || !name) {
        return respondJson(res, { error: 'Missing required fields' });
      }
      
      const { rows } = await pool.query(
        `INSERT INTO ${SCHEMA}.kanban_boards (instance, cron_name, name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (instance, cron_name) DO UPDATE SET name = $3
         RETURNING id`, [instance, cronName, name]
      );
      return respondJson(res, { board_id: rows[0].id });
    }
    
    if (url.pathname === '/api/kanban/item' && req.method === 'POST') {
      const body = await parseBody(req);
      const boardId = body.get('board_id');
      const title = body.get('title');
      const status = body.get('status') || 'backlog';
      const priority = parseInt(body.get('priority') || '50');
      const createdBy = body.get('created_by');
      
      if (!boardId || !title) {
        return respondJson(res, { error: 'Missing required fields' });
      }
      
      // Insert item
      const { rows: [item] } = await pool.query(
        `INSERT INTO ${SCHEMA}.kanban_items (board_id, title, current_status, priority) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`, [boardId, title, status, priority]
      );
      
      // Log event
      await pool.query(
        `INSERT INTO ${SCHEMA}.kanban_events (board_id, item_id, event_type, data, created_by)
         VALUES ($1, $2, 'item_created', $3, $4)`,
        [boardId, item.id, JSON.stringify({ title, status, priority }), createdBy]
      );
      
      return respondJson(res, { item_id: item.id });
    }
    
    if (url.pathname === '/api/kanban/event' && req.method === 'POST') {
      const body = await parseBody(req);
      const boardId = body.get('board_id');
      const itemId = body.get('item_id');
      const eventType = body.get('event_type');
      const data = body.get('data'); // JSON string
      const createdBy = body.get('created_by');
      
      if (!boardId || !itemId || !eventType || !data) {
        return respondJson(res, { error: 'Missing required fields' });
      }
      
      let dataObj;
      try {
        dataObj = JSON.parse(data);
      } catch (e) {
        return respondJson(res, { error: 'Invalid JSON in data field' });
      }
      
      // Update item based on event type
      if (eventType === 'status_changed' && dataObj.new_status) {
        await pool.query(
          `UPDATE ${SCHEMA}.kanban_items SET current_status = $1, updated_at = NOW() WHERE id = $2`,
          [dataObj.new_status, itemId]
        );
      } else if (eventType === 'priority_changed' && dataObj.new_priority !== undefined) {
        await pool.query(
          `UPDATE ${SCHEMA}.kanban_items SET priority = $1, updated_at = NOW() WHERE id = $2`,
          [dataObj.new_priority, itemId]
        );
      } else if (eventType === 'title_changed' && dataObj.new_title) {
        await pool.query(
          `UPDATE ${SCHEMA}.kanban_items SET title = $1, updated_at = NOW() WHERE id = $2`,
          [dataObj.new_title, itemId]
        );
      }
      
      // Log event
      const { rows: [event] } = await pool.query(
        `INSERT INTO ${SCHEMA}.kanban_events (board_id, item_id, event_type, data, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`, [boardId, itemId, eventType, JSON.stringify(dataObj), createdBy]
      );
      
      return respondJson(res, { event_id: event.id });
    }

    // Page routes
    let html;
    switch (url.pathname) {
      case '/': html = await handleSearch(url); break;
      case '/kanban': html = await handleKanban(url); break;
      case '/timeline': html = await handleTimeline(url); break;
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
