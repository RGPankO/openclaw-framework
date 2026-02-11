# Code Principles

> **Enforcement**: All agents that write code MUST follow these principles.

## Hard Limits (Enforced)

| Rule | Limit | Rationale |
|------|-------|-----------|
| Function length | Max 50 lines | Fits on screen, single responsibility |
| Parameters | Max 4 params | Use options object for more |
| Nesting depth | Max 4 levels | Use early returns, extract functions |
| File length | Max 300 lines | Split if larger |
| Class methods | Max 10 public | Class doing too much if more |

## Philosophy: Long-Term Solutions Only

> **This codebase is built to last for centuries.**

**ALWAYS choose proper solutions over quick fixes.** When faced with two approaches:

| Quick Fix | Proper Solution | We Choose |
|-----------|-----------------|-----------|
| Patch the symptom | Fix the root cause | **Proper** |
| Add a workaround | Create a separate service | **Proper** |
| Inline the logic | Separate concerns properly | **Proper** |
| "It works for now" | "It's architecturally correct" | **Proper** |

### Why This Matters

Saving 2 hours on development to expose ourselves to:
- Future crashes and instability
- Hidden bugs from tangled responsibilities
- Confusion from "nobody knows how this actually works"
- Technical debt that compounds over time

**...is never acceptable.**

### Decision Framework

When you see a problem with two solutions:

1. **Quick fix**: Faster now, pain later
2. **Proper solution**: More effort now, clean forever

**Always choose #2.** No exceptions. No "just this once."

### Examples

| Scenario | Wrong Choice | Right Choice |
|----------|--------------|--------------|
| Service doing too much | Add more methods to it | Extract a new dedicated service |
| Bug in complex function | Patch the specific case | Refactor to make logic clear |
| Feature needs shared state | Pass data through globals | Create proper state management |
| Two modules need same logic | Copy-paste the code | Extract shared module |
| Error handling scattered | Add try-catch everywhere | Create centralized error handler |

### The Test

Before implementing, ask: *"Will someone in 5 years understand why this code exists and how it works?"*

If the answer is uncertain → choose the cleaner approach.

## Credentials & Secrets

- **NEVER hardcode** credentials, API keys, passwords, or tokens in source code
- **ALL secrets go in `.env`** (which MUST be in `.gitignore`)
- **Use `.env.example`** to document required variables with empty values or placeholders
- **Fallback defaults** in code must NEVER be real credentials -- use empty string or throw a clear error if missing
- **No exceptions**: SSH passwords, database passwords, API auth headers, Stripe keys, webhook secrets -- all `.env`
- **If secrets are already in git history**: rotate them after moving to `.env` (old values are compromised)

## Code Structure

### Functions
- **One thing**: Each function does ONE thing well
- **Early returns**: Guard clauses at top, reduce nesting
- **Pure when possible**: Minimize side effects in calculations
- **Self-documenting names**: `getUserById` not `fetch` or `getData`

### Files
- **One module per file**: No monoliths
- **Clear naming**: Match content (`user.service.ts`, `auth.middleware.ts`)
- **Grouped imports**: External → Internal → Relative

### Error Handling
```javascript
// DO: Specific, informative errors
throw new Error(`User ${userId} not found in database`);

// DON'T: Swallow or generic
catch (e) { return null; }
catch (e) { throw new Error('Error'); }
```

### Validation
- **Validate at boundaries**: API inputs, external data, user input
- **Fail fast**: Check preconditions early, throw immediately
- **Trust internal code**: Don't re-validate between internal modules

## Anti-Patterns (Never Do)

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| God objects/files | Unmaintainable, untestable | Split by responsibility |
| Deep nesting | Hard to read/debug | Early returns, extract functions |
| Magic numbers | Unclear intent | Named constants |
| Silent failures | Bugs hide | Throw or log errors |
| Copy-paste code | Maintenance nightmare | Extract shared function |
| Premature optimization | Wasted effort, complexity | Profile first, optimize proven bottlenecks |

## Testing Requirements

- **Business logic**: Must have unit tests
- **Edge cases**: Null, empty, boundary values tested
- **Error paths**: Test what happens when things fail
- **No implementation details**: Test behavior, not internals

## Comments

- **Why, not what**: Code shows what, comments explain why
- **Complex logic only**: Don't comment obvious code
- **Keep updated**: Outdated comments worse than none
- **TODOs**: Include ticket/issue reference

## Naming Conventions

```
Functions: verb + noun      → getUserById, calculateTotal, validateInput
Booleans: is/has/should    → isActive, hasPermission, shouldRetry
Constants: UPPER_SNAKE     → MAX_RETRIES, DEFAULT_TIMEOUT
Classes: PascalCase        → UserService, AuthMiddleware
Files: dot-separated       → user.service.ts, auth.middleware.ts
```

## Database Changes & Migrations

**CRITICAL: Every database schema change MUST have a migration.**

> Adapt the commands below to your ORM (Prisma, Drizzle, Knex, Django, etc.). The principles are universal.

### Rules

1. **Never modify schema without creating a migration**
   - Changing the schema without a migration breaks other environments
   - Migrations ensure identical database state across all computers

2. **Create migration for every schema change**
   - Use your ORM's migration command immediately after schema changes
   - Use descriptive names: `add_user_email_field`, `add_order_status_index`

3. **Never edit migration files after creation**
   - Migrations are version-controlled history
   - Editing them breaks databases that already applied them
   - If mistake: create a new migration to fix it

### What Requires a Migration

| Change | Migration Needed |
|--------|------------------|
| Add/remove table | ✅ Yes |
| Add/remove column | ✅ Yes |
| Change column type | ✅ Yes |
| Add/remove index | ✅ Yes |
| Add/remove constraint | ✅ Yes |
| Rename table/column | ✅ Yes |
| Change default value | ✅ Yes |
| Add seed data | ❌ No (use seed script) |
| Change app logic only | ❌ No |

### Anti-Patterns

- ❌ Manually run SQL to change production schema → ✅ Use migrations
- ❌ Share database dumps to sync schema → ✅ Commit migrations
- ❌ Edit existing migration files → ✅ Create new migration to fix
- ❌ Change schema and forget to migrate → ✅ Run migration immediately

## Quality Checklist (Before Committing)

- [ ] Functions under 50 lines
- [ ] No deep nesting (max 4 levels)
- [ ] Error cases handled
- [ ] Input validation at boundaries
- [ ] No magic numbers
- [ ] Tests for business logic
- [ ] No copy-pasted code blocks
- [ ] **Database changes have migrations**
- [ ] **Schema file and migration committed together**
