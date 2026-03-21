# Spisetid

Madplan og opskrifter — statisk site hostet på GitHub Pages.

## Tilføj en opskrift

1. Opret en ny `.md`-fil i `recipes/` med dette format:

```markdown
---
title: Opskriftens navn
tags: [tag1, tag2, hverdagsret]
servings: 4
time: 30 min
ingredients:
  - 500g noget
  - 1 løg
---

## Fremgangsmåde

Skriv fremgangsmåden her.
```

2. Tilføj filnavnet (uden `.md`) til `recipes/index.json`.

## Bed Claude om en madplan

Åbn Claude Code i dette projekt og skriv f.eks.:

> Lav en madplan til denne uge baseret på opskrifterne vi har

Claude vil:
1. Læse opskrifterne i `recipes/`
2. Skrive `planner/YYYY-WXX.md` med en ugentlig madplan
3. Skrive `shopping/YYYY-WXX.md` med en indkøbsliste
4. Committe og pushe til GitHub

## Kør lokalt

Da siden bruger `fetch()` til at hente filer, kræves en lokal HTTP-server:

```bash
python3 -m http.server 8000
```

Åbn derefter `http://localhost:8000` i browseren.

## GitHub Pages

Siden er tilgængelig på: `https://sejrsgaard.github.io/spisetid/`

Aktivér GitHub Pages i repository-indstillingerne: **Settings → Pages → Source: Deploy from branch → main → / (root)**.
