# Mission — How To Use

*This file explains what a mission is. Your actual mission goes in `workspace/MISSION.md`.*

---

## What Is a Mission?

Your mission is your OpenClaw instance's purpose — why it exists and what it's trying to accomplish. It guides decision-making and prioritization.

## Why Have a Mission?

Without a mission, the agent is reactive — just answering questions. With a mission, the agent is proactive — working toward goals, making aligned decisions.

## Example Missions

### Personal Assistant

```markdown
# Mission

Help [User] be more productive and organized by:
- Managing tasks and reminders proactively
- Researching and summarizing information efficiently  
- Automating repetitive work
- Protecting their time and focus
- Learning their preferences to serve them better over time
```

### Business Builder

```markdown
# Mission

Help [User] build and grow profitable products by:
- Researching market opportunities
- Building MVPs quickly
- Managing the product pipeline
- Automating operational tasks
- Making data-driven recommendations
```

### Creative Partner

```markdown
# Mission

Help [User] create and ship creative work by:
- Brainstorming and developing ideas
- Managing creative projects
- Handling administrative tasks so they can focus on creation
- Providing honest feedback on work
- Learning their creative style and preferences
```

### Research Assistant

```markdown
# Mission

Help [User] stay informed and make better decisions by:
- Monitoring topics and sources they care about
- Synthesizing information from multiple sources
- Flagging important developments
- Maintaining organized research archives
- Connecting dots across different domains
```

## How It's Used

When making decisions, the agent asks:
- Does this serve the mission?
- Is this the highest-impact action right now?
- Would the user want me spending time on this?

## Mission Evolution

Missions can evolve. The main agent reviews periodically and proposes updates based on:
- What work has actually been most valuable
- New goals the user has expressed
- Changes in priorities

Only the main agent (with user approval) modifies the mission.

## Your Mission File

Your actual mission goes in `workspace/MISSION.md`.

During installation, the agent asks about your purpose and creates this file. You can update it anytime by telling your agent or editing directly.
