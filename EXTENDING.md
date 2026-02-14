# Extending the Framework

*How to add custom tools and extensions without modifying framework files.*

---

## Overview

The framework's web tools server is extendable. You can add custom pages and tools that:
- Appear in the command center
- Have their own routes
- Survive framework updates

## How It Works

1. Create your tool's files (HTML, JS, CSS)
2. Register it in `workspace/tool-extensions.json`
3. Restart the server
4. Your tool appears in the command center

## Step-by-Step

### 1. Create Your Tool

Create a directory for your tool:

```bash
mkdir -p ~/.openclaw/workspace/my-tools/my-custom-tool
```

Create at least an `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Custom Tool</title>
</head>
<body>
  <h1>My Custom Tool</h1>
  <p>This is my custom tool.</p>
  <a href="/">← Back to Command Center</a>
</body>
</html>
```

### 2. Register the Extension

Copy the example file:
```bash
cp framework/tool-extensions.example.json tool-extensions.json
```

Edit `tool-extensions.json`:

```json
{
  "tools": [
    {
      "id": "my-custom-tool",
      "name": "My Custom Tool",
      "emoji": "🔨",
      "description": "What my tool does",
      "path": "/my-custom-tool/",
      "staticDir": "my-tools/my-custom-tool/"
    }
  ]
}
```

### 3. Restart Server

```bash
# If running manually
pkill -f "framework/tools/server.js"
cd framework/tools && node server.js

# Or tell your agent
"Restart the framework tools server"
```

### 4. Access Your Tool

Your tool is now available at:
- http://localhost:8890/my-custom-tool/

And appears in the Command Center under "Extensions".

## Extension Schema

```json
{
  "tools": [
    {
      "id": "unique-id",           // Required: unique identifier
      "name": "Display Name",       // Required: shown in UI
      "emoji": "🔧",                // Optional: icon in UI
      "description": "What it does", // Optional: shown in UI
      "path": "/url-path/",         // Required: URL path (must end with /)
      "staticDir": "relative/path/" // Required: path to files (relative to workspace)
    }
  ]
}
```

## Using APIs

Your custom tools can use the framework's APIs:

```javascript
// List TODOs
fetch('/api/todos').then(r => r.json())

// List crons
fetch('/api/crons').then(r => r.json())

// Toggle a cron
fetch('/api/crons/JOB_ID/toggle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: true })
})

// Update context
fetch('/api/context', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: '# New Content' })
})
```

### Available APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/crons` | GET | List all cron jobs |
| `/api/crons/:id/toggle` | POST | Enable/disable cron |
| `/api/crons/:id/run` | POST | Run cron immediately |
| `/api/tasks` | GET | List task instruction files |
| `/api/tasks/:id` | GET/PUT | Read/update task file |
| `/api/todos` | GET | List TODO files |
| `/api/todos/:id` | GET/PUT/DELETE | Read/update/delete TODO |
| `/api/todos/:id/complete` | POST | Complete and archive |
| `/api/reminders` | GET | List reminder files |
| `/api/reminders/:id` | GET/PUT/DELETE | Read/update/delete |
| `/api/reminders/:id/toggle` | POST | Pause/resume |
| `/api/activity` | GET | List daily briefs |
| `/api/context` | GET/PUT | Read/update ACTIVE-CONTEXT |
| `/api/mission` | GET/PUT | Read/update MISSION |
| `/api/settings` | GET/PUT | Read/update settings |
| `/api/extensions` | GET | List registered extensions |

## Best Practices

1. **Keep tools self-contained** — All files in one directory
2. **Use relative paths** — For assets within your tool
3. **Link back to Command Center** — `<a href="/">← Back</a>`
4. **Match the framework style** — Use similar CSS for consistency
5. **Don't modify framework files** — Extensions only

## Examples

### Dashboard Tool

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Dashboard</title>
  <style>
    body { font-family: sans-serif; background: #0d1117; color: #c9d1d9; padding: 2rem; }
    .card { background: #161b22; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>My Dashboard</h1>
  <a href="/">← Back</a>
  
  <div class="card" id="stats">Loading...</div>
  
  <script>
    async function load() {
      const [todos, reminders] = await Promise.all([
        fetch('/api/todos').then(r => r.json()),
        fetch('/api/reminders').then(r => r.json())
      ]);
      
      document.getElementById('stats').innerHTML = `
        <p>TODOs: ${todos.length}</p>
        <p>Reminders: ${reminders.length}</p>
      `;
    }
    load();
  </script>
</body>
</html>
```

## Updates

When the framework updates:
- Your extensions remain untouched
- `tool-extensions.json` is not overwritten (it's in workspace, not framework)
- Your custom tools continue to work

If a framework update adds new APIs, you can use them in your extensions.
