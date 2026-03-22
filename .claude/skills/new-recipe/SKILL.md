---
name: new-recipe
description: Adds a new recipe to the spisetid project
argument-hint: "<recipe name or slug>"
---

Add a new recipe to the spisetid project.

## Input

`$ARGUMENTS` is the recipe name or a hint (e.g. "pasta carbonara", "shawarma"). If not provided, ask the user what recipe to add.

## Workflow

**Step 1 — Find source**

Check if there is a matching Obsidian source file in:
`/Users/ksj/Library/CloudStorage/GoogleDrive-ksj2209@gmail.com/My Drive/Garden/Garden/Opskrifter/`

List the directory and look for a file whose name matches the requested recipe. If found, read it — it is in Obsidian markdown format with `dg-publish: true` frontmatter and may contain embedded links (`![[...]]`) that must be stripped.

If no source file exists, write the recipe from scratch based on your knowledge. Inform the user either way.

**Step 2 — Convert / compose the recipe**

Produce a recipe file following the formatting rules in `CLAUDE.md` exactly:

- Frontmatter: `title`, `tags` (array), `servings`, `time`, `ingredients` (list, with `(SubSection)` prefixes where the recipe has distinct component groups)
- Slug: lowercase Danish, spaces → hyphens, `æ→ae`, `ø→oe`, `å→aa` — no special characters
- Body: starts with `## Fremgangsmåde`, numbered flat steps with inline bold labels, no sub-headings in the body
- Ingredients: extract from the Obsidian source or compose from scratch; group logically with `(SubSection)` if needed

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
