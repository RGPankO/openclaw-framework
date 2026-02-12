# Delegation Guide

*How to delegate tasks to save tokens while maintaining quality.*

---

## Purpose

**Save tokens.** Not every task needs your smartest (most expensive) model.

- **Research** → Use a capable but cheaper model
- **Simple tasks** (reminders, logging) → Use the cheapest model that works
- **Complex reasoning** → Use your best model
- **Coding** → Use a dedicated coding agent (Codex, etc.)

## Model Tiers

The framework uses three model tiers configured in `USER-SETTINGS.md`:

| Tier | Setting | Default | Use For |
|------|---------|---------|---------|
| **Smart** | `smart_model` | claude-opus-4-5 | Complex reasoning, decisions, main session |
| **Worker** | `worker_model` | claude-sonnet-4-5 | Research, simple tasks, reminders |
| **Coding** | `coding_agent` | codex | All coding work |

### Tier Selection Rules

**Use Smart Model when:**
- Making decisions that affect project direction
- Complex multi-step reasoning
- Tasks requiring deep context understanding
- User-facing communication that needs nuance

**Use Worker Model when:**
- Research and information gathering
- Processing/summarizing content
- Simple CRUD operations
- Reminders and notifications
- Status checks and logging

**Use Coding Agent when:**
- Writing or modifying code
- Debugging
- Creating scripts/tools
- Any file manipulation in codebases

---

## How to Delegate

### From Main Session

**Research task:**
```
sessions_spawn model="[worker_model from settings]" task="""
Research [topic].
Save findings to memory/research-notes/[topic].md
"""
```

**Coding task (preferred - uses Codex CLI):**
```bash
bash pty:true workdir:[repo-path] background:true command:"codex --yolo exec '[task description]. When done: openclaw system event --text \"Done: [summary]\" --mode now'"
```

**Simple task:**
```
sessions_spawn model="[worker_model from settings]" task="""
[Simple task instructions]
"""
```

### From Cron Jobs

Each cron can specify its model in the payload:

**Reminder cron** → Worker model (simple task)
**TODO Processor** → Smart model (may need complex reasoning)  
**Research crons** → Worker model

---

## Token Savings Example

| Task Type | Smart Model Cost | Worker Model Cost | Savings |
|-----------|------------------|-------------------|---------|
| Research (10K tokens) | ~$0.25 | ~$0.05 | 80% |
| Simple reminder | ~$0.02 | ~$0.004 | 80% |
| Complex decision | ~$0.25 | N/A (need smart) | 0% |

**Rule of thumb:** If a task doesn't require the smartest model's unique capabilities, delegate down.

---

## Coding Delegation

**Always prefer Codex CLI for coding work.**

Why:
- Token-efficient (uses subscription, not API tokens)
- Purpose-built for code
- Can run in background
- Reports back when done

**Critical: Always instruct the coding agent to read the coding principles first.** Include this in every coding delegation:

> Before coding, read these files and follow them strictly:
> - `framework/docs/CODE_PRINCIPLES.md`
> - `framework/docs/FILE_PRINCIPLES.md`
> - `framework/docs/COMMIT_GUIDELINES.md`

The coding agent doesn't inherit your context. Without this, it codes with its own defaults.

**Pattern:**
```bash
bash pty:true workdir:[path] background:true command:"codex --yolo exec 'Read framework/docs/CODE_PRINCIPLES.md, framework/docs/FILE_PRINCIPLES.md, and framework/docs/COMMIT_GUIDELINES.md first. Then: [task]. When done: openclaw system event --text \"Done: [summary]\" --mode now'"
```

## Post-Delegation Review (MANDATORY)

**After the coding agent finishes, you MUST review before marking done:**

1. **Read the diff** — `git diff` or check changed files. Understand what was changed.
2. **Verify correctness** — Does the code do what you asked? Any obvious bugs?
3. **Check principles** — No hardcoded credentials? Proper error handling? Clean code?
4. **Test it** — Run the code, hit the endpoint, check the output. Don't trust "it compiled."
5. **Check edge cases** — What happens with empty data? Missing fields? Network errors?

If something's wrong, send the agent back with specific feedback. Don't fix it yourself unless it's trivial.

**The coding agent is your hands. You are the brain and the quality gate.**

**Fallback (if Codex unavailable):**
Use worker model with explicit coding instructions, but expect higher token cost.

---

## Model Equivalents

Framework is model-agnostic. Configure based on what you have:

| Tier | Anthropic | OpenAI | Google |
|------|-----------|--------|--------|
| Smart | claude-opus-4-5 | gpt-4o | gemini-1.5-pro |
| Worker | claude-sonnet-4-5 | gpt-4o-mini | gemini-1.5-flash |
| Coding | — | codex | — |

**Note:** Codex is OpenAI's coding model, accessed via CLI (subscription-based, not API tokens).

---

## Configuration

In `USER-SETTINGS.md`:

```markdown
## Models

**smart_model:** anthropic/claude-opus-4-5
**worker_model:** anthropic/claude-sonnet-4-5
**coding_agent:** codex

## Notes
- smart_model: Used for main session, complex tasks
- worker_model: Used for research, simple tasks, reminders
- coding_agent: CLI tool for coding (e.g., "codex", "aider", "cursor")
```

---

## Best Practices

1. **Default to worker model** — Only escalate to smart when needed
2. **Always use coding agent for code** — It's cheaper and better
3. **Batch simple tasks** — One worker call for multiple simple items
4. **Log which model handled what** — Track in daily-brief for optimization
5. **Review monthly** — Are you over-using smart model?

---

## Framework Tasks Default Models

| Task | Model Tier | Reason |
|------|------------|--------|
| Self-Maintain | Worker | Simple file checks |
| Auto-Update | Worker | Git operations, simple logic |
| Reminder | Worker | Read file, send message |
| TODO Processor | Smart | May need complex reasoning |
| Mission Review | Smart | Strategic thinking |

---

## Anti-Patterns

❌ **Don't** use smart model for simple lookups
❌ **Don't** use API tokens for coding when Codex available
❌ **Don't** spawn smart model sub-agents for research
❌ **Don't** run expensive models for status checks

✅ **Do** delegate research to worker model
✅ **Do** use Codex CLI for all coding
✅ **Do** batch simple operations
✅ **Do** reserve smart model for decisions and complex reasoning
