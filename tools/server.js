const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8890;

// Paths
const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const FRAMEWORK = path.join(WORKSPACE, 'framework');
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:18789';

// Try to get gateway token from various sources
function getGatewayToken() {
  // 1. Environment variable
  if (process.env.GATEWAY_TOKEN) return process.env.GATEWAY_TOKEN;
  
  // 2. Token file
  const tokenPath = path.join(require('os').homedir(), '.openclaw', 'gateway-token');
  try {
    return fs.readFileSync(tokenPath, 'utf8').trim();
  } catch (e) {}
  
  // 3. Check config file for token
  const configPath = path.join(require('os').homedir(), '.openclaw', 'config.yaml');
  try {
    const config = fs.readFileSync(configPath, 'utf8');
    const match = config.match(/gatewayToken:\s*['"]?([^'"\n]+)/);
    if (match) return match[1];
  } catch (e) {}
  
  console.warn('Warning: Gateway token not found. Cron management will not work.');
  return null;
}

const GATEWAY_TOKEN = getGatewayToken();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============ HELPERS ============

function readMd(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

function writeMd(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function listMdFiles(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: path.join(dir, f),
        content: readMd(path.join(dir, f))
      }));
  } catch (e) {
    return [];
  }
}

function parseStructuredMd(content) {
  const lines = (content || '').split('\n');
  const data = {};
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      data.title = line.replace('# ', '').replace('TODO: ', '').replace('Reminder: ', '').replace('Task: ', '');
    } else if (line.startsWith('**') && line.includes(':**')) {
      const match = line.match(/\*\*(.+?):\*\*\s*(.*)/);
      if (match) {
        data[match[1].toLowerCase().replace(/\s/g, '_')] = match[2];
      }
    }
  }
  return data;
}

// Gateway proxy helper
function gatewayRequest(tool, action, args = {}) {
  return new Promise((resolve, reject) => {
    if (!GATEWAY_TOKEN) {
      return reject(new Error('Gateway token not configured'));
    }
    
    const body = JSON.stringify({ tool, action, args });
    const url = new URL(GATEWAY_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 18789,
      path: '/tools/invoke',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok && parsed.result?.content?.[0]?.text) {
            resolve(JSON.parse(parsed.result.content[0].text));
          } else if (parsed.ok) {
            resolve(parsed.result || parsed);
          } else {
            reject(new Error(parsed.error || 'Gateway error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ============ CRON API (from cache file) ============

app.get('/api/crons', (req, res) => {
  // Read from cache file (updated by Geri on request)
  const cachePath = path.join(__dirname, 'cron-cache.json');
  try {
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      res.json(data);
    } else {
      res.json({ jobs: [], error: 'No cache. Ask Geri to refresh crons.' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/crons/:id/toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    await gatewayRequest('cron', 'update', { jobId: req.params.id, patch: { enabled } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/crons/:id/run', async (req, res) => {
  try {
    await gatewayRequest('cron', 'run', { jobId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============ TASKS API ============

app.get('/api/tasks', (req, res) => {
  const tasksDir = path.join(WORKSPACE, 'TASKS');
  const tasks = listMdFiles(tasksDir).map(f => {
    const data = parseStructuredMd(f.content);
    return {
      id: f.name.replace('.md', ''),
      filename: f.name,
      title: data.title || f.name.replace('.md', ''),
      schedule: data.schedule || 'Not set',
      content: f.content
    };
  });
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const filePath = path.join(WORKSPACE, 'TASKS', req.params.id + '.md');
  const content = readMd(filePath);
  if (content) {
    res.json({ id: req.params.id, content });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  const filePath = path.join(WORKSPACE, 'TASKS', req.params.id + '.md');
  writeMd(filePath, req.body.content);
  res.json({ ok: true });
});

// ============ TODOS API ============

app.get('/api/todos', (req, res) => {
  const todoDir = path.join(WORKSPACE, 'todo');
  const todos = listMdFiles(todoDir).map(f => {
    const data = parseStructuredMd(f.content);
    return {
      id: f.name,
      filename: f.name,
      title: data.title || f.name.replace('.md', ''),
      status: data.status || 'NEW',
      priority: data.priority || 'MEDIUM',
      created: data.created || 'Unknown',
      content: f.content
    };
  });
  res.json(todos);
});

app.get('/api/todos/:id', (req, res) => {
  const filePath = path.join(WORKSPACE, 'todo', req.params.id);
  const content = readMd(filePath);
  if (content) {
    res.json({ id: req.params.id, content });
  } else {
    res.status(404).json({ error: 'TODO not found' });
  }
});

app.put('/api/todos/:id', (req, res) => {
  const filePath = path.join(WORKSPACE, 'todo', req.params.id);
  writeMd(filePath, req.body.content);
  res.json({ ok: true });
});

app.post('/api/todos/:id/complete', (req, res) => {
  const todoPath = path.join(WORKSPACE, 'todo', req.params.id);
  const archivePath = path.join(WORKSPACE, 'todo', 'archive', req.params.id);
  
  if (fs.existsSync(todoPath)) {
    let content = readMd(todoPath);
    content = content.replace(/\*\*Status:\*\*\s*\w+/, '**Status:** DONE');
    fs.mkdirSync(path.dirname(archivePath), { recursive: true });
    writeMd(archivePath, content);
    fs.unlinkSync(todoPath);
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: 'TODO not found' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  const todoPath = path.join(WORKSPACE, 'todo', req.params.id);
  if (fs.existsSync(todoPath)) {
    fs.unlinkSync(todoPath);
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: 'TODO not found' });
  }
});

// ============ REMINDERS API ============

app.get('/api/reminders', (req, res) => {
  const remindersDir = path.join(WORKSPACE, 'reminders');
  const reminders = listMdFiles(remindersDir).map(f => {
    const data = parseStructuredMd(f.content);
    return {
      id: f.name,
      filename: f.name,
      title: data.title || f.name.replace('.md', ''),
      status: data.status || 'ACTIVE',
      type: data.type || 'ONE_TIME',
      content: f.content
    };
  });
  res.json(reminders);
});

app.get('/api/reminders/:id', (req, res) => {
  const filePath = path.join(WORKSPACE, 'reminders', req.params.id);
  const content = readMd(filePath);
  if (content) {
    res.json({ id: req.params.id, content });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

app.put('/api/reminders/:id', (req, res) => {
  const filePath = path.join(WORKSPACE, 'reminders', req.params.id);
  writeMd(filePath, req.body.content);
  res.json({ ok: true });
});

app.post('/api/reminders/:id/toggle', (req, res) => {
  const reminderPath = path.join(WORKSPACE, 'reminders', req.params.id);
  if (fs.existsSync(reminderPath)) {
    let content = readMd(reminderPath);
    if (content.includes('**Status:** ACTIVE')) {
      content = content.replace('**Status:** ACTIVE', '**Status:** PAUSED');
    } else if (content.includes('**Status:** PAUSED')) {
      content = content.replace('**Status:** PAUSED', '**Status:** ACTIVE');
    }
    writeMd(reminderPath, content);
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

app.delete('/api/reminders/:id', (req, res) => {
  const reminderPath = path.join(WORKSPACE, 'reminders', req.params.id);
  if (fs.existsSync(reminderPath)) {
    fs.unlinkSync(reminderPath);
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: 'Reminder not found' });
  }
});

// ============ ACTIVITY API ============

app.get('/api/activity', (req, res) => {
  const memoryDir = path.join(WORKSPACE, 'memory');
  const files = listMdFiles(memoryDir)
    .filter(f => f.name.startsWith('daily-brief-'))
    .sort((a, b) => b.name.localeCompare(a.name))
    .slice(0, 30); // Limit to 30 days
  
  res.json(files.map(f => ({
    date: f.name.replace('daily-brief-', '').replace('.md', ''),
    content: f.content
  })));
});

// ============ CONTEXT API ============

app.get('/api/context', (req, res) => {
  const content = readMd(path.join(WORKSPACE, 'ACTIVE-CONTEXT.md')) || '# Active Context\n\nNo context set.';
  res.json({ content });
});

app.put('/api/context', (req, res) => {
  writeMd(path.join(WORKSPACE, 'ACTIVE-CONTEXT.md'), req.body.content);
  res.json({ ok: true });
});

// ============ MISSION API ============

app.get('/api/mission', (req, res) => {
  const content = readMd(path.join(WORKSPACE, 'MISSION.md')) || '# Mission\n\nNo mission set.';
  res.json({ content });
});

app.put('/api/mission', (req, res) => {
  writeMd(path.join(WORKSPACE, 'MISSION.md'), req.body.content);
  res.json({ ok: true });
});

// ============ SETTINGS API ============

app.get('/api/settings', (req, res) => {
  res.json({
    settings: readMd(path.join(WORKSPACE, 'USER-SETTINGS.md')) || '# User Settings\n\n(Not configured)',
    overrides: readMd(path.join(WORKSPACE, 'FRAMEWORK-OVERRIDES.md')) || '# Framework Overrides\n\n(No overrides)'
  });
});

app.put('/api/settings', (req, res) => {
  if (req.body.settings) {
    writeMd(path.join(WORKSPACE, 'USER-SETTINGS.md'), req.body.settings);
  }
  if (req.body.overrides) {
    writeMd(path.join(WORKSPACE, 'FRAMEWORK-OVERRIDES.md'), req.body.overrides);
  }
  res.json({ ok: true });
});

// Update specific setting (for cron toggles)
app.put('/api/settings/:key', (req, res) => {
  const settingsPath = path.join(WORKSPACE, 'USER-SETTINGS.md');
  let content = readMd(settingsPath) || '# User Settings\n';
  
  const key = req.params.key;
  const value = req.body.enabled ? 'true' : 'false';
  const line = `**${key}:** ${value}`;
  
  // Check if setting already exists
  const regex = new RegExp(`\\*\\*${key}:\\*\\*.*`, 'i');
  if (regex.test(content)) {
    content = content.replace(regex, line);
  } else {
    // Add new setting
    content = content.trim() + '\n\n' + line + '\n';
  }
  
  writeMd(settingsPath, content);
  res.json({ ok: true });
});

// ============ EXTENSIONS ============

function loadExtensions() {
  const extPath = path.join(WORKSPACE, 'tool-extensions.json');
  try {
    if (fs.existsSync(extPath)) {
      const ext = JSON.parse(fs.readFileSync(extPath, 'utf8'));
      if (ext.tools && Array.isArray(ext.tools)) {
        ext.tools.forEach(tool => {
          if (tool.staticDir && tool.path) {
            const fullPath = path.isAbsolute(tool.staticDir) 
              ? tool.staticDir 
              : path.join(WORKSPACE, tool.staticDir);
            app.use(tool.path, express.static(fullPath));
            console.log(`Extension loaded: ${tool.name} → ${tool.path}`);
          }
        });
      }
      return ext.tools || [];
    }
  } catch (e) {
    console.error('Error loading extensions:', e.message);
  }
  return [];
}

app.get('/api/extensions', (req, res) => {
  res.json(loadExtensions());
});

// Load extensions at startup
const extensions = loadExtensions();

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`OpenClaw Framework Tools running at http://localhost:${PORT}`);
  console.log(`Workspace: ${WORKSPACE}`);
  console.log(`Gateway: ${GATEWAY_URL}`);
  if (extensions.length > 0) {
    console.log(`Extensions: ${extensions.length} loaded`);
  }
});
