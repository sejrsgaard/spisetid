# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local development

The site uses `fetch()` so it requires an HTTP server — opening `index.html` directly via `file://` will not work:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

There is no build step, no package manager, and no test suite.

## Architecture

Plain HTML/CSS/JS single-page app deployed to GitHub Pages at `https://sejrsgaard.github.io/spisetid/`.

**Hash routing** — `js/app.js` listens to `hashchange` and renders pages into `<main id="app">`:
- `#/recipes` — recipe grid with search + tag filter
- `#/recipe/:slug` — single recipe detail
- `#/planner/YYYY-MM-DD` — weekly meal plan keyed by the Saturday start date (defaults to current week's Saturday)
- `#/shopping` — shopping list

**Data flow:**
- `recipes/index.json` — ordered array of slugs; must be updated when adding/removing recipes
- `recipes/<slug>.md` — recipe files with YAML-like frontmatter parsed by `parseFrontmatter()` in `app.js`
- `planner/YYYY-MM-DD.md` — meal plan per week, keyed by the Saturday start date; H2 headings per day, recipe links use `#/recipe/slug` hash format
- `shopping/list.md` — single shopping list; plain `- item` per line, no category headings (the app renders all items as checkboxes)
- `marked.js` is loaded from CDN — no local dependency

**Frontmatter format** for recipes:
```
---
title: Recipe name
tags: [tag1, tag2]
servings: 4
time: 30 min
ingredients:
  - item 1
  - (SubSection) item 2
---
```
Ingredients are displayed in a sticky sidebar. The markdown body (after frontmatter) is rendered as instructions.

## Meal plan workflow

The food week runs **Saturday to Friday** — shopping happens on Saturday, so the plan starts there.

When the user asks for a meal plan:
1. Read `recipes/index.json` and relevant recipe files to see available ingredients
2. Write `planner/YYYY-MM-DD.md` (Saturday of that week) — use H2 per day, link recipes with `#/recipe/slug`
3. Write `shopping/list.md` — group by `### Category`, use `- [ ] item` format
4. Commit and push to `main`; GitHub Pages auto-deploys

## Recipe formatting rules

These rules apply to all recipe `.md` files. Enforce them when adding or editing recipes.

**Body structure:**
- First heading must be `## Fremgangsmåde` (H2, not H3/H4)
- If the recipe has distinct sub-steps (e.g. sauce + protein), use `**SubSection**` bold labels as paragraphs — never as headings
- No `### Samlet tid` or similar meta-headings in the body; time goes in frontmatter

**Numbered steps:**
- Use a flat numbered list — one step per line, no nested bullet points under numbers
- Inline the step label: `1. **Kartofler:** Kog kartoflerne...` — not a heading + bullet

**Bold text:**
- Bold markers must open and close on the same line: `**text**`
- Never split a bold across lines (`**text\n**`)

**Example of correct body:**
```markdown
## Fremgangsmåde

**Sauce**

Rist karry i en tør gryde...

**Kylling**

Bank fileterne flade...
```

Or with numbered steps:
```markdown
## Fremgangsmåde

1. **Kartofler:** Kog kartoflerne i 15 minutter.
2. **Dressing:** Bland olie, sennep og citronsaft.
```

## Adding recipes

1. Create `recipes/<slug>.md` with frontmatter (title, tags, servings, time, ingredients list)
2. Add the slug to `recipes/index.json`

Source recipes live in Google Drive at:
`/Users/ksj/Library/CloudStorage/GoogleDrive-ksj2209@gmail.com/My Drive/Garden/Garden/Opskrifter/`
These are Obsidian-formatted `.md` files with `dg-publish: true` frontmatter that must be converted (strip Obsidian frontmatter/embeds, extract ingredients section into frontmatter list).
