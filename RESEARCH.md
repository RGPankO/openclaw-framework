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

### Source Hierarchy (Trust Levels)

**Primary sources (most reliable):**
- Official websites, documentation, pricing pages
- Original studies, whitepapers, press releases
- App Store / Play Store listings (for app research)

**Secondary sources (verify claims):**
- News articles, blog posts
- Comparison sites, review aggregators
- Social media, Reddit (good for sentiment, not facts)

**Do NOT trust without verification:**
- Search result snippets (often outdated, summarized wrong)
- AI-generated summaries from other tools
- Comparison blogs (mix up details, go stale fast)
- Aggregator sites (may have outdated info)

### Verification Rules (Mandatory)

1. **Go to the actual source** — Click through to official sites, don't rely on snippets
2. **Verify exact names/versions** — Similar names ≠ same thing (e.g., "Pro" vs "Pro Max")
3. **Compare apples to apples** — Same tier, same version, same time period
4. **Check the date** — Pricing, features, and availability change frequently
5. **Include source URLs** — Every claim should be verifiable
6. **State confidence level** — Be explicit about what you verified vs inferred

### Confidence Levels

Use these when reporting findings:
- ✅ **Verified** — Confirmed on official/primary source
- ⚠️ **Secondary** — From blog, article, or aggregator (may be stale)
- ❓ **Unverified** — Couldn't find official confirmation

**Example:** "Pricing is $9.99/month ✅ (verified on official pricing page 2026-02-10)"

### Stay Focused

Research the question asked. Don't expand scope without user approval.

### Flag Uncertainty

If you can't verify something:
- Say "unverified" explicitly
- Include what you found AND where
- Note confidence level
- Don't present guesses as facts

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

## Development Time Estimates

**Traditional dev estimates are wildly wrong in an AI-coding world.** Divide by 5.

- AI coding tools (Codex, Claude Code) make development dramatically faster
- "2-3 months" in traditional terms = 2-3 weeks with AI coding
- Don't rule out ideas for being "too complex to build"
- Re-evaluate feasibility assuming AI does 80% of the coding work
- Infrastructure costs matter more than dev time now

**When reporting build estimates:** Always give the AI-adjusted estimate, not the traditional one. If you'd estimate "3 months for a team of 2," say "2-3 weeks with AI coding."

## Important Rules

1. **Check before researching** — Don't duplicate work
2. **Wire immediately** — Don't save "for later"
3. **Summarize, don't dump** — Key points, not walls of text
4. **Link to full docs** — Details available but not in the way
5. **Verify sources** — Primary over secondary
6. **Include dates** — Research has a shelf life
