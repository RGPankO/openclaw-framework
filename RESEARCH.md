# Research Guidelines

## Core Rule: No Shelf Research

**All research MUST be wired into existing structures.**

A research file sitting in `/research/` that nobody reads is wasted work. Research exists to inform action.

## Before Researching

1. **Check existing research** — Has this been researched before?
   - Search `memory/research-notes/`
   - Check relevant project files
   - Ask: "Do we already know this?"

2. **If similar research exists:**
   - Tell user: "We researched this on [date]. Here's what we found: [summary]. Do you want fresh research?"
   - Only proceed if user confirms new research is needed

## During Research

### Use Reliable Sources

1. **Primary sources first** — Official websites, documentation, original studies
2. **Verify claims** — Don't trust search snippets or blog summaries
3. **Check dates** — Information goes stale quickly
4. **Include source URLs** — Everything should be verifiable

### Stay Focused

Research the question asked. Don't expand scope without user approval.

### Flag Uncertainty

If you can't verify something:
- Say "unverified" explicitly
- Include what you found AND where
- Note confidence level

## After Research

### 1. Wire It In

Research must connect to something actionable:

| Finding Type | Wire Into |
|--------------|-----------|
| Market data | Relevant project/product page |
| Competitor info | Product comparison section |
| User pain points | Marketing copy, feature backlog |
| Technical approach | Architecture docs |
| Pricing info | Cost analysis |

### 2. Format

**In the destination file:**
```markdown
## [Topic] Research (YYYY-MM-DD)

**Key Findings:**
- Point 1
- Point 2

**Source:** [link to full research if saved separately]
```

**Full research (if needed):**
Save to `memory/research-notes/[topic]-YYYY-MM-DD.md`

### 3. Summarize for User

After wiring, tell user:
- What you found (key points)
- Where you put it (which files updated)
- What actions this suggests

## Research File Structure

If saving full research:

```markdown
# Research: [Topic]

**Date:** YYYY-MM-DD
**Requested by:** [User/Task name]
**Wired into:** [List of files updated]

## Question

[What were we trying to find out?]

## Key Findings

1. **Finding 1** — [detail]
   - Source: [URL]
2. **Finding 2** — [detail]
   - Source: [URL]

## Raw Notes

[Detailed notes, quotes, data]

## Recommendations

[What to do with this information]
```

## What NOT to Research

Skip research that can't lead to action:
- General industry trends (unless specifically relevant)
- News without actionable insight
- Funding announcements (unless competitive intel)
- Anything you can't answer: "How do we USE this?"

## Important Rules

1. **Check before researching** — Don't duplicate work
2. **Wire immediately** — Don't save "for later"
3. **Summarize, don't dump** — Key points, not walls of text
4. **Link to full docs** — Details available but not in the way
5. **Verify sources** — Primary over secondary
6. **Include dates** — Research has a shelf life
