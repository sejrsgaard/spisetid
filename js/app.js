function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return { meta: {}, content: text };
  const fenceEnd = text.indexOf('\n---\n', 4);
  if (fenceEnd === -1) return { meta: {}, content: text };

  const yamlLines = text.slice(4, fenceEnd).split('\n');
  const content = text.slice(fenceEnd + 5);
  const meta = {};
  let currentListKey = null;

  for (const line of yamlLines) {
    if (line.startsWith('  - ')) {
      if (currentListKey) meta[currentListKey].push(line.slice(4));
      continue;
    }
    currentListKey = null;
    if (line.endsWith(':') && !line.includes(': ')) {
      const key = line.slice(0, -1).trim();
      meta[key] = [];
      currentListKey = key;
    } else {
      const idx = line.indexOf(': ');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 2).trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          meta[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
        } else {
          meta[key] = val;
        }
      }
    }
  }

  return { meta, content };
}

// Week utilities (Saturday–Friday weeks)

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function currentWeekKey() {
  const now = new Date();
  const daysFromSat = (now.getDay() + 1) % 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() - daysFromSat);
  return formatDate(sat);
}

function addWeeks(key, delta) {
  const d = parseDate(key);
  d.setDate(d.getDate() + delta * 7);
  return formatDate(d);
}

function weekLabel(key) {
  const sat = parseDate(key);
  const fri = new Date(sat);
  fri.setDate(sat.getDate() + 6);
  const fmt = d => d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  return `${fmt(sat)}\u2013${fmt(fri)}`;
}

// Recipe cache

const recipeCache = new Map();
let allRecipes = null;

async function loadRecipes() {
  if (allRecipes) return allRecipes;
  const res = await fetch('recipes/index.json');
  const slugs = await res.json();
  allRecipes = await Promise.all(slugs.map(fetchRecipe));
  return allRecipes;
}

async function fetchRecipe(slug) {
  if (recipeCache.has(slug)) return recipeCache.get(slug);
  const res = await fetch(`recipes/${slug}.md`);
  const text = await res.text();
  const { meta, content } = parseFrontmatter(text);
  const recipe = { slug, ...meta, content };
  recipeCache.set(slug, recipe);
  return recipe;
}

// Router

let currentPage = '';

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  navLinks.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  route();
});

function updateNavActive() {
  document.querySelectorAll('nav a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === currentPage);
  });
}

async function route() {
  const hash = location.hash || '#/recipes';
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading">Indlæser\u2026</div>';

  if (hash === '#/recipes' || hash === '' || hash === '#/') {
    currentPage = 'recipes';
    updateNavActive();
    await renderRecipesPage(app);
  } else if (hash.startsWith('#/recipe/')) {
    currentPage = 'recipes';
    updateNavActive();
    await renderRecipePage(app, hash.slice('#/recipe/'.length));
  } else if (hash.startsWith('#/planner')) {
    currentPage = 'planner';
    updateNavActive();
    await renderPlannerPage(app, hash.split('/')[2] || currentWeekKey());
  } else if (hash.startsWith('#/shopping')) {
    currentPage = 'shopping';
    updateNavActive();
    await renderShoppingPage(app);
  } else if (hash.startsWith('#/suggestion/')) {
    currentPage = 'suggestions';
    updateNavActive();
    await renderSuggestionPage(app, decodeURIComponent(hash.slice('#/suggestion/'.length)));
  } else if (hash.startsWith('#/suggestions')) {
    currentPage = 'suggestions';
    updateNavActive();
    await renderSuggestionsPage(app);
  }
}

// Recipes list page

async function renderRecipesPage(app) {
  const recipes = await loadRecipes();
  let activeTag = null;
  let searchQuery = '';
  let showFavoritesOnly = false;
  const allTags = [...new Set(recipes.flatMap(r => r.tags || []))].sort();

  function filtered() {
    return recipes.filter(r => {
      const matchesSearch = !searchQuery || (r.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !activeTag || (r.tags || []).includes(activeTag);
      const matchesFavorite = !showFavoritesOnly || r.favorite === 'true';
      return matchesSearch && matchesTag && matchesFavorite;
    });
  }

  function renderGrid() {
    const list = filtered();
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>Ingen opskrifter fundet.</p></div>';
      return;
    }
    grid.innerHTML = list.map(r => `
      <a href="#/recipe/${r.slug}" class="recipe-card">
        <div class="recipe-card-header">
          <h2>${r.title || r.slug}</h2>
          ${r.favorite === 'true' ? '<span class="recipe-card-favorite">★</span>' : ''}
        </div>
        <div class="recipe-card-meta">
          ${r.time ? `<span>&#9201; ${r.time}</span>` : ''}
          ${r.servings ? `<span>&#128101; ${/^\d+$/.test(String(r.servings).trim()) ? r.servings + ' pers.' : r.servings}</span>` : ''}
        </div>
        <div class="recipe-card-tags">
          ${(r.tags || []).map(t => `<span>${t}</span>`).join('')}
        </div>
      </a>
    `).join('');
  }

  app.innerHTML = `
    <div class="page-header"><h1>Opskrifter</h1></div>
    <div class="search-bar">
      <input type="text" id="search" placeholder="S&oslash;g efter opskrifter&hellip;" autocomplete="off">
      <div class="tag-filters">
        <span class="tag-chip" id="favorite-chip">&#9733; Favoritter</span>
        ${allTags.map(t => `<span class="tag-chip" data-tag="${t}">${t}</span>`).join('')}
      </div>
    </div>
    <div id="recipe-grid" class="recipe-grid"></div>
  `;

  const grid = app.querySelector('#recipe-grid');
  renderGrid();

  app.querySelector('#search').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderGrid();
  });

  app.querySelector('#favorite-chip').addEventListener('click', function() {
    showFavoritesOnly = !showFavoritesOnly;
    this.classList.toggle('active', showFavoritesOnly);
    renderGrid();
  });

  app.querySelectorAll('.tag-chip[data-tag]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeTag = activeTag === chip.dataset.tag ? null : chip.dataset.tag;
      app.querySelectorAll('.tag-chip[data-tag]').forEach(c =>
        c.classList.toggle('active', c.dataset.tag === activeTag)
      );
      renderGrid();
    });
  });
}

function renderIngredientGroups(ingredients) {
  const hasGroups = ingredients.some(i => /^\(.+?\) /.test(i));
  if (!hasGroups) {
    return `<ul>${ingredients.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }

  const groups = [];
  let current = null;
  for (const ing of ingredients) {
    const m = ing.match(/^\((.+?)\) (.+)$/);
    const [groupName, item] = m ? [m[1], m[2]] : ['', ing];
    if (!current || current.name !== groupName) {
      current = { name: groupName, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }

  return groups.map(g => `
    ${g.name ? `<h3 class="ing-group-name">${g.name}</h3>` : ''}
    <ul>${g.items.map(i => `<li>${i}</li>`).join('')}</ul>
  `).join('');
}

// Single recipe page

async function renderRecipePage(app, slug) {
  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.slug === slug);

  if (!recipe) {
    app.innerHTML = `
      <a href="#/recipes" class="back-link">&larr; Alle opskrifter</a>
      <div class="empty-state"><p>Opskrift ikke fundet.</p></div>
    `;
    return;
  }

  const instructionsHtml = marked.parse(recipe.content || '');

  app.innerHTML = `
    <div class="recipe-detail">
      <a href="#/recipes" class="back-link">&larr; Alle opskrifter</a>
      <h1>${recipe.title || slug}</h1>
      <div class="recipe-detail-meta">
        ${recipe.favorite === 'true' ? `<span class="recipe-detail-favorite">&#9733; Favorit</span>` : ''}
        ${recipe.time ? `<span>&#9201; ${recipe.time}</span>` : ''}
        ${recipe.servings ? `<span>&#128101; ${/^\d+$/.test(String(recipe.servings).trim()) ? recipe.servings + ' personer' : recipe.servings}</span>` : ''}
        ${(recipe.tags || []).map(t => `<span>${t}</span>`).join('')}
      </div>
      <div class="recipe-layout">
        <div class="ingredients-box">
          <h2>Ingredienser</h2>
          ${renderIngredientGroups(recipe.ingredients || [])}
        </div>
        <div class="instructions">${instructionsHtml}</div>
      </div>
    </div>
  `;
}

// Meal planner page

async function renderPlannerPage(app, weekKey) {
  const prev = addWeeks(weekKey, -1);
  const next = addWeeks(weekKey, 1);

  app.innerHTML = `
    <div class="page-header"><h1>Madplan</h1></div>
    <div class="week-nav">
      <button onclick="location.hash='#/planner/${prev}'">&larr;</button>
      <span>${weekLabel(weekKey)}</span>
      <button onclick="location.hash='#/planner/${next}'">&rarr;</button>
    </div>
    <div id="planner-body"></div>
  `;

  const body = app.querySelector('#planner-body');

  try {
    const res = await fetch(`planner/${weekKey}.md`);
    if (!res.ok) throw new Error('not found');
    const text = await res.text();
    const { content } = parseFrontmatter(text);
    body.innerHTML = plannerMarkdownToHtml(content);
  } catch {
    body.innerHTML = `
      <div class="empty-state">
        <p>Ingen madplan for ${weekLabel(weekKey)}.</p>
        <small>Bed Claude om at lave en madplan til denne uge.</small>
      </div>
    `;
  }
}

function plannerMarkdownToHtml(content) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = marked.parse(content);
  const rows = [];
  const children = Array.from(tempDiv.children);
  let i = 0;

  while (i < children.length) {
    const el = children[i];
    if (el.tagName === 'H2') {
      const mealEl = children[i + 1];
      rows.push(`
        <div class="planner-day">
          <div class="planner-day-name">${el.textContent}</div>
          <div class="planner-day-meal">${mealEl ? mealEl.innerHTML : ''}</div>
        </div>
      `);
      i += 2;
    } else {
      i++;
    }
  }

  return `<div class="planner-week">${rows.join('')}</div>`;
}

// Suggestions page

async function renderSuggestionsPage(app) {
  const res = await fetch('suggestions/index.json');
  const suggestions = await res.json();

  function getWanted() {
    try { return JSON.parse(localStorage.getItem('suggestions-wanted') || '[]'); }
    catch { return []; }
  }

  function toggleWanted(slug) {
    const wanted = getWanted();
    const idx = wanted.indexOf(slug);
    if (idx === -1) wanted.push(slug);
    else wanted.splice(idx, 1);
    localStorage.setItem('suggestions-wanted', JSON.stringify(wanted));
  }

  function renderCards() {
    const wanted = getWanted();
    grid.innerHTML = suggestions.map(s => {
      const isWanted = wanted.includes(s.slug);
      return `
        <div class="suggestion-card${isWanted ? ' wanted' : ''}">
          <a href="#/suggestion/${s.slug}" class="suggestion-card-body">
            <h2>${s.title}</h2>
            <p>${s.description}</p>
            <div class="recipe-card-tags">
              ${(s.tags || []).map(t => `<span>${t}</span>`).join('')}
            </div>
          </a>
          <button class="want-btn${isWanted ? ' active' : ''}" data-slug="${s.slug}">
            ${isWanted ? '&#10003; Vil have' : 'Vil have'}
          </button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.want-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleWanted(btn.dataset.slug);
        renderCards();
      });
    });
  }

  app.innerHTML = `
    <div class="page-header">
      <h1>Forslag</h1>
      <p class="page-subtitle">Opskrifter vi m&aring;ske vil pr&oslash;ve &mdash; marker dem du vil have, og bed Claude om at tilf&oslash;je dem.</p>
    </div>
    <div id="suggestions-grid" class="suggestions-grid"></div>
  `;

  const grid = app.querySelector('#suggestions-grid');
  renderCards();
}

async function renderSuggestionPage(app, slug) {
  const res = await fetch(`suggestions/${slug}.md`);
  if (!res.ok) {
    app.innerHTML = `
      <a href="#/suggestions" class="back-link">&larr; Forslag</a>
      <div class="empty-state"><p>Forslag ikke fundet.</p></div>
    `;
    return;
  }
  const text = await res.text();
  const { meta, content } = parseFrontmatter(text);
  const instructionsHtml = marked.parse(content || '');

  app.innerHTML = `
    <div class="recipe-detail">
      <a href="#/suggestions" class="back-link">&larr; Forslag</a>
      <h1>${meta.title || slug}</h1>
      <div class="recipe-detail-meta">
        ${meta.time ? `<span>&#9201; ${meta.time}</span>` : ''}
        ${meta.servings ? `<span>&#128101; ${/^\d+$/.test(String(meta.servings).trim()) ? meta.servings + ' personer' : meta.servings}</span>` : ''}
        ${(meta.tags || []).map(t => `<span>${t}</span>`).join('')}
      </div>
      <div class="recipe-layout">
        <div class="ingredients-box">
          <h2>Ingredienser</h2>
          ${renderIngredientGroups(meta.ingredients || [])}
        </div>
        <div class="instructions">${instructionsHtml}</div>
      </div>
    </div>
  `;
}

// Shopping list page

async function renderShoppingPage(app) {
  app.innerHTML = `
    <div class="page-header"><h1>Indkøbsliste</h1></div>
    <div id="shopping-body"></div>
  `;

  const body = app.querySelector('#shopping-body');

  try {
    const res = await fetch(`shopping/list.md`);
    if (!res.ok) throw new Error('not found');
    const text = await res.text();
    const { content } = parseFrontmatter(text);
    const html = marked.parse(content).replace(/<li>/g, '<li><input type="checkbox"> ');
    body.innerHTML = `<div class="shopping-content">${html}</div>`;
  } catch {
    body.innerHTML = `
      <div class="empty-state">
        <p>Ingen indkøbsliste.</p>
        <small>Bed Claude om at lave en madplan, s&aring; genereres indk&oslash;bslisten automatisk.</small>
      </div>
    `;
  }
}
