---
name: new-recipe
description: Adds a new recipe to the spisetid project
argument-hint: "<recipe name or slug>"
---

Add a new recipe to the spisetid project.

## Input

`$ARGUMENTS` is the recipe name or a hint (e.g. "pasta carbonara", "shawarma"). If not provided, ask the user what recipe to add.

## Preferences

Apply these when composing or adapting any recipe:

- **No curry** — do not add curry-based recipes. The one exception already in the collection is Boller i Karry.
- **Reduce acid reflux triggers** — avoid or minimise ingredients that commonly cause acid reflux: large amounts of tomato, citrus juice (lemon/lime as a finish is fine, but not as a primary flavour), raw garlic in large quantities, chili/cayenne beyond mild seasoning, and alcohol-based sauces. Where these appear, use them sparingly or substitute — e.g. cream or stock instead of tomato as a sauce base, mild herbs instead of chili heat.

## Workflow

**Step 1 — Compose the recipe**

Produce a recipe file following the formatting rules in `CLAUDE.md` exactly:

- Frontmatter: `title`, `tags` (array), `servings`, `time`, `ingredients` (list, with `(SubSection)` prefixes where the recipe has distinct component groups)
- Slug: lowercase Danish, spaces → hyphens, `æ→ae`, `ø→oe`, `å→aa` — no special characters
- Body: starts with `## Fremgangsmåde`, numbered flat steps with inline bold labels, no sub-headings in the body
- Ingredients: group logically with `(SubSection)` prefixes if the recipe has distinct component groups

Show the recipe to the user and ask for confirmation or adjustments before writing.

**Step 3 — Write files**

Once confirmed:

1. Write `recipes/<slug>.md`
2. Add the slug to `recipes/index.json` in alphabetical order

If the recipe was in `suggestions/index.json`, ask the user if it should be removed from there.

**Step 4 — Commit and push**

Ask the user if they want to commit and push. If yes, stage all changed files and commit:

```
feat: add recipe — <title>
```

Then push to `main`.
