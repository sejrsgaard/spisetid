---
name: meal-plan
description: Creates a weekly meal plan with shopping list for spisetid
argument-hint: "[YYYY-WXX] (optional)"
---

Create a weekly meal plan for the spisetid project.

## Week

If `$ARGUMENTS` is provided, use that ISO week (e.g. `2026-W14`). Otherwise ask the user which week.

Remember: the food week runs **Saturday to Friday** — shopping happens on Saturday.

## Workflow

**Step 1 — Gather ingredients**
Ask the user what ingredients they have at home that should be used up. This shapes which recipes to suggest.

**Step 2 — Propose a plan**
Read `recipes/index.json` and skim relevant recipe files to see what's available.

Suggest a day-by-day plan covering Saturday through Friday. Present it as a table first and ask for confirmation before writing any files. Rules:
- Prefer existing recipes where ingredients match
- Propose new recipes where it makes sense — clearly mark them as *(ny)*
- Leftovers are a valid entry (e.g. "Rester — boller i karry")
- Incorporate user feedback iteratively before finalising

**Step 3 — Write files**
Once the user approves the plan:

1. For each new recipe, create `recipes/<slug>.md` following the recipe formatting rules in `CLAUDE.md`. Then add the slug to `recipes/index.json` in alphabetical order.

2. Write `planner/YYYY-WXX.md`:
   - H2 heading per day in Danish (Lørdag, Søndag, Mandag, …, Fredag)
   - Link existing/new recipes: `[Title](#/recipe/slug)`
   - Plain text for leftovers or days without a recipe

3. Write `shopping/list.md`:
   - Only items that need to be bought (not things the user already has)
   - Flat list, no category headings — just `- [ ] item` per line

**Step 4 — Commit and push**
Ask the user if they want to commit and push. If yes, stage all new/modified files and commit with a descriptive message, then push to `main`.
