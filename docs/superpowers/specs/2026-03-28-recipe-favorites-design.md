# Recipe Favorites — Design Spec

**Date:** 2026-03-28

## Summary

Mark recipes as favorites via frontmatter, display a star icon on cards and detail pages, and add a filter chip to show only favorites on the recipe list.

## Data

Add `favorite: true` to the frontmatter of any recipe `.md` file to mark it as a favorite. The existing `parseFrontmatter()` parser already handles this — no code changes needed to the parser.

```
---
title: Chicken Tikka Masala
favorite: true
tags: [kylling, indisk]
...
---
```

Frontmatter values are parsed as strings, so the check is `r.favorite === 'true'`.

## UI Changes

### Recipe cards (`renderRecipesPage`)

- Show a `★` icon in the top-right corner of `.recipe-card` when `r.favorite === 'true'`.

### Recipe detail page (`renderRecipePage`)

- Show `★ Favorit` in the `.recipe-detail-meta` row alongside time and servings.

### Filter chip (`renderRecipesPage`)

- Add a `★ Favoritter` chip at the start of the tag-filter bar.
- Clicking it toggles `showFavoritesOnly` (boolean, local to `renderRecipesPage`).
- The chip gets the `active` class when toggled on, same as tag chips.
- `filtered()` is extended: when `showFavoritesOnly` is true, only recipes where `r.favorite === 'true'` are included.
- The favorites filter and tag filter can be combined (both conditions must match).

## Out of Scope

- No interactive rating (clicking stars in the UI to set favorites).
- No localStorage persistence — favorites live in the markdown files only.
- No sorting by favorites; the filter chip hides non-favorites instead.
