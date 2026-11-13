// Forside (liste) og detaljvisning for bønner
import { state, LS, beanById, brewsFor, remaining, patchBean, deleteBean, saveBean, deleteBrew } from './store.js';
import { $, $$, esc, icon, stars, starInput, radar, toast, actionSheet, confirmSheet, blobUrl, placeholderStyle, fmtNum, fmtDate, fmtTime, relDate, haptic, confetti } from './ui.js';
import { flag, freshness, STATUSES, ROAST_LEVELS, PROFILE_AXES, tagColor, methodName, ratingLabel } from './data.js';
import { go, back, refresh, setCleanup } from './nav.js';
import { openBrewSheet } from './views-brew.js';
import { loadSamples } from './samples.js';

const view = () => $('#view');
const ui = { filter: LS.get('filter', 'all'), sort: LS.get('sort', 'newest'), q: '' };

const SORTS = {
  newest: ['Sist lagt til', (a, b) => b.createdAt - a.createdAt],
  rating: ['Best rangert', (a, b) => (b.rating || 0) - (a.rating || 0) || b.createdAt - a.createdAt],
  name: ['Navn A–Å', (a, b) => a.name.localeCompare(b.name, 'nb')],
  roast: ['Ferskest brent', (a, b) => (b.roastDate || '').localeCompare(a.roastDate || '')],
  country: ['Land', (a, b) => (a.country || 'zzz').localeCompare(b.country || 'zzz', 'nb')],
  brews: ['Mest brygget', (a, b) => brewsFor(b.id).length - brewsFor(a.id).length],
};
const FILTERS = [
  ['all', 'Alle'], ['fav', '♥ Favoritter'], ['stash', 'I lager'], ['tried', 'Smakt'], ['wishlist', 'Ønskeliste'], ['again', 'Kjøper igjen'],
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Sen kveld? ☕';
  if (h < 10) return 'God morgen ☀️';
  if (h < 12) return 'God formiddag';
  if (h < 18) return 'God ettermiddag';
  return 'God kveld 🌙';
}

function matches(b, q) {
  if (!q) return true;
  const hay = [b.name, b.roaster, b.country, b.region, b.farm, b.variety, b.process, b.shop, b.description, ...(b.notes || [])].join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

function filtered() {
  const f = ui.filter;
  return state.beans.filter((b) => {
    if (f === 'fav' && !b.favorite) return false;
    if (f === 'again' && !b.buyAgain) return false;
    if (['stash', 'tried', 'wishlist'].includes(f) && b.status !== f) return false;
    return matches(b, ui.q);
  }).sort(SORTS[ui.sort]?.[1] || SORTS.newest[1]);
}

export function cover(b, cls = '') {
  return b.thumb
    ? `<img class="${cls}" src="${blobUrl(b.thumb)}" alt="" loading="lazy" decoding="async">`
    : `<div class="ph ${cls}" style="${placeholderStyle(b.name)}">${icon('beans')}</div>`;
}

function card(b, i) {
  const f = b.status === 'stash' ? freshness(b.roastDate) : null;
  const rest = b.status === 'stash' ? remaining(b) : null;
  return `<a class="card" href="#/bean/${b.id}" style="--i:${Math.min(i, 12)}">
    <div class="card-img">${cover(b)}
      ${b.favorite ? `<span class="card-fav">${icon('heart')}</span>` : ''}
      ${b.status !== 'tried' ? `<span class="card-badge ${b.status}">${STATUSES[b.status].short}</span>` : ''}
      ${f ? `<span class="fresh-dot fresh-${f.key}" title="${f.label}"></span>` : ''}
    </div>
    <div class="card-body">
      <h3>${esc(b.name)}</h3>
      <p class="card-sub">${esc(b.roaster || '—')}</p>
      <div class="card-meta">
        <span class="card-origin">${b.country ? `${flag(b.country)} ${esc(b.country)}` : ''}</span>
        ${b.status === 'wishlist' ? '' : b.rating ? `<span class="card-rating">★ ${fmtNum(b.rating)}</span>` : '<span class="card-rating muted">–</span>'}
      </div>
      ${rest != null ? `<div class="mini-bar"><span style="width:${Math.round((rest / b.weight) * 100)}%"></span></div>` : ''}
    </div>
  </a>`;
}

function emptyState() {
  return `<div class="empty">
    <div class="empty-art">${cupArt()}</div>
    <h2>Din kaffereise starter her</h2>
    <p>Logg hver bønne du smaker – med bilde, smaksnoter, karakter og bryggeoppskrifter. Alt lagres trygt på enheten din.</p>
    <a class="btn btn-primary btn-lg" href="#/new">${icon('plus')} Legg til første bønne</a>
    <button class="btn btn-ghost" id="loadSamples">Se med eksempeldata</button>
  </div>`;
}

export function cupArt() {
  return `<svg viewBox="0 0 160 140" class="cup-art" aria-hidden="true">
    <path class="steam s1" d="M62 38c-6-8 6-12 0-22"/><path class="steam s2" d="M80 34c-6-8 6-12 0-22"/><path class="steam s3" d="M98 38c-6-8 6-12 0-22"/>
    <ellipse cx="80" cy="122" rx="62" ry="10" class="saucer"/>
    <path d="M30 52h100v30a42 42 0 0 1-42 42h-16a42 42 0 0 1-42-42z" class="cup"/>
    <path d="M130 62h6a14 14 0 0 1 0 28h-9" class="handle"/>
    <ellipse cx="80" cy="52" rx="50" ry="8" class="coffee"/>
  </svg>`;
}

function stashStrip() {
  const stash = state.beans.filter((b) => b.status === 'stash').sort((a, b) => (b.roastDate || '').localeCompare(a.roastDate || ''));
  if (!stash.length) return '';
  return `<section class="stash">
    <div class="section-head"><h2>I lageret</h2><button class="link" data-filter="stash">Se alle</button></div>
    <div class="h-scroll">${stash.map((b) => {
      const f = freshness(b.roastDate); const rest = remaining(b);
      return `<a class="stash-item" href="#/bean/${b.id}">
        <div class="stash-img">${cover(b)}</div>
        <div class="stash-info"><strong>${esc(b.name)}</strong>
          <span class="muted">${f ? `<i class="fresh-dot inline fresh-${f.key}"></i>${f.label} · ${f.days} d` : esc(b.roaster || '')}</span>
          ${rest != null ? `<span class="muted">${Math.round(rest)} g igjen</span>` : ''}
        </div></a>`;
    }).join('')}</div>
  </section>`;
}

export function renderHome() {
  const all = state.beans;
  if (!all.length) {
    view().innerHTML = `<header class="page-head"><div><p class="eyebrow">${greeting()}</p><h1 class="title">Kaffeloggen</h1></div></header>${emptyState()}`;
    $('#loadSamples').onclick = async () => { await loadSamples(); toast('Eksempeldata lastet inn ☕'); refresh(); };
    return;
  }
  const tasted = all.filter((b) => b.status !== 'wishlist');
  const rated = tasted.filter((b) => b.rating);
  const avg = rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : 0;
  const countries = new Set(tasted.map((b) => b.country).filter(Boolean)).size;

  view().innerHTML = `
    <header class="page-head">
      <div><p class="eyebrow">${greeting()}</p><h1 class="title">Kaffeloggen</h1></div>
    </header>
    <div class="summary">
      <div><strong>${tasted.length}</strong><span>smakt</span></div>
      <div><strong>${countries}</strong><span>${countries === 1 ? 'land' : 'land'}</span></div>
      <div><strong>${avg ? fmtNum(avg) : '–'}</strong><span>snitt ★</span></div>
      <div><strong>${state.brews.length}</strong><span>brygg</span></div>
    </div>
    <div class="searchbar">${icon('search')}<input id="q" type="search" placeholder="Søk bønne, brenneri, land, smak…" value="${esc(ui.q)}" autocomplete="off" enterkeyhint="search"></div>
    <div class="chips-row" id="filters">${FILTERS.map(([k, l]) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}</div>
    <div id="stashWrap"></div>
    <div class="list-head"><span id="count" class="muted"></span><button class="sort-btn" id="sortBtn">${icon('sort')}<span>${SORTS[ui.sort][0]}</span></button></div>
    <div id="grid" class="grid"></div>`;

  const paint = () => {
    const list = filtered();
    $('#stashWrap').innerHTML = ui.filter === 'all' && !ui.q ? stashStrip() : '';
    $('#count').textContent = `${list.length} ${list.length === 1 ? 'bønne' : 'bønner'}`;
    $('#grid').innerHTML = list.length ? list.map(card).join('')
      : `<div class="no-results">${icon('search')}<p>Ingen treff${ui.q ? ` på «${esc(ui.q)}»` : ''}</p></div>`;
  };
  paint();

  $('#q').addEventListener('input', (e) => { ui.q = e.target.value.trim(); paint(); });
  view().addEventListener('click', async (e) => {
    const fb = e.target.closest('[data-filter]');
    if (fb) {
      ui.filter = fb.dataset.filter; LS.set('filter', ui.filter); haptic(4);
      $$('#filters .chip').forEach((c) => c.classList.toggle('on', c.dataset.filter === ui.filter));
      $(`#filters [data-filter="${ui.filter}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      paint();
    }
    if (e.target.closest('#sortBtn')) {
      const v = await actionSheet(Object.entries(SORTS).map(([k, [l]]) => ({ label: l + (k === ui.sort ? '  ✓' : ''), value: k, icon: 'sort' })));
      if (v) { ui.sort = v; LS.set('sort', v); $('#sortBtn span').textContent = SORTS[v][0]; paint(); }
    }
  });
}

// ---------------- Detaljvisning ----------------
function fact(label, value, ic) {
  if (value == null || value === '') return '';
  return `<div class="fact">${ic ? icon(ic) : ''}<div><span>${label}</span><strong>${value}</strong></div></div>`;
}

function roastBar(level) {
  if (level == null || level === '') return '';
  return `<div class="roast-bar">${ROAST_LEVELS.map((_, i) => `<i class="r${i} ${i <= level ? 'on' : ''}"></i>`).join('')}</div>`;
}

function brewItem(r, best) {
  const ratio = r.dose && r.water ? `1:${fmtNum(r.water / r.dose)}` : '';
  return `<div class="brew-item ${best ? 'best' : ''}" data-brew="${r.id}">
    <div class="brew-top"><strong>${esc(methodName(r.method) || 'Brygg')}</strong>${best ? '<span class="pill pill-gold">Beste oppskrift</span>' : ''}<span class="muted brew-date">${relDate(r.date)}</span></div>
    <div class="brew-specs">
      ${r.dose ? `<span>${fmtNum(r.dose, r.dose % 1 ? 1 : 0)} g</span>` : ''}
      ${r.water ? `<span>${fmtNum(r.water, 0)} ${r.method === 'espresso' ? 'g ut' : 'g vann'}</span>` : ''}
      ${ratio ? `<span>${ratio}</span>` : ''}
      ${r.temp ? `<span>${r.temp}°C</span>` : ''}
      ${r.time ? `<span>${fmtTime(r.time)}</span>` : ''}
      ${r.grind ? `<span>Kvern: ${esc(r.grind)}</span>` : ''}
    </div>
    ${r.rating ? `<div class="brew-rating">${stars(r.rating)}</div>` : ''}
    ${r.notes ? `<p class="brew-notes">${esc(r.notes)}</p>` : ''}
  </div>`;
}

export function renderBean(id) {
  const b = beanById(id);
  if (!b) { view().innerHTML = `<div class="empty"><h2>Fant ikke bønnen</h2><a class="btn btn-primary" href="#/">Til oversikten</a></div>`; return; }
  const brews = brewsFor(id);
  const best = brews.filter((r) => r.rating).sort((x, y) => y.rating - x.rating)[0];
  const f = freshness(b.roastDate);
  const rest = remaining(b);
  const photos = b.photos?.length ? b.photos : [];
  const pricePer100 = b.price && b.weight && b.weight !== 100 ? `${fmtNum((b.price / b.weight) * 100, 0)} kr/100 g` : '';
  const avgDose = brews.filter((r) => r.dose).reduce((s, r, _, a) => s + r.dose / a.length, 0) || 15;
  const hasProfile = b.profile && Object.values(b.profile).some(Boolean);

  view().innerHTML = `
  <article class="detail">
    <div class="hero">
      ${photos.length ? `<div class="hero-scroll">${photos.map((p) => `<img src="${blobUrl(p)}" alt="">`).join('')}</div>
        ${photos.length > 1 ? `<div class="hero-dots">${photos.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}`
        : `<div class="ph hero-ph" style="${placeholderStyle(b.name)}">${icon('beans')}</div>`}
      <div class="hero-bar">
        <button class="round-btn" id="backBtn" aria-label="Tilbake">${icon('back')}</button>
        <div class="hero-actions">
          <button class="round-btn fav-btn ${b.favorite ? 'on' : ''}" id="favBtn" aria-label="Favoritt">${icon('heart')}</button>
          <button class="round-btn" id="moreBtn" aria-label="Flere valg">${icon('more')}</button>
        </div>
      </div>
    </div>
    <div class="detail-body">
      <div class="detail-title">
        ${b.roaster ? `<p class="eyebrow">${esc(b.roaster)}</p>` : ''}
        <h1>${esc(b.name)}</h1>
        ${b.country || b.region ? `<p class="origin">${flag(b.country)} ${esc([b.country, b.region].filter(Boolean).join(' · '))}</p>` : ''}
        <div class="pills">
          <span class="pill status-${b.status}">${STATUSES[b.status].label}</span>
          ${b.process ? `<span class="pill">${esc(b.process)}</span>` : ''}
          ${b.roastLevel != null && b.roastLevel !== '' ? `<span class="pill">${ROAST_LEVELS[b.roastLevel]}</span>` : ''}
          ${b.buyAgain ? `<span class="pill pill-green">${icon('repeat')} Kjøper igjen</span>` : ''}
        </div>
      </div>

      ${b.status === 'wishlist'
        ? `<div class="card-block wish-block"><p>Står på ønskelisten. Fått tak i den?</p><div class="btn-row"><button class="btn btn-primary" data-status="stash">Kjøpt – i lager</button><button class="btn btn-ghost" data-status="tried">Har smakt</button></div></div>`
        : `<div class="card-block rating-block"><div class="block-label">Din karakter</div><div id="rateHere"></div></div>`}

      ${b.status === 'stash' && (rest != null || f) ? `<div class="card-block stash-block">
        ${f ? `<div class="fresh-row"><span class="fresh-badge fresh-${f.key}">${f.label}</span><div><strong>${f.days} dager siden brenning</strong><span class="muted">${f.hint}</span></div></div>` : ''}
        ${rest != null ? `<div class="bag"><div class="bag-head"><strong>${Math.round(rest)} g igjen</strong><span class="muted">av ${b.weight} g · ≈ ${Math.floor(rest / avgDose)} ${Math.floor(rest / avgDose) === 1 ? 'kopp' : 'kopper'}</span></div>
          <div class="bar"><span style="width:${(rest / b.weight) * 100}%"></span></div></div>` : ''}
        <div class="btn-row"><button class="btn btn-ghost btn-sm" id="newBag">${icon('repeat')} Ny pose</button><button class="btn btn-ghost btn-sm" id="emptyBag">Posen er tom</button></div>
      </div>` : ''}

      ${b.notes?.length ? `<section class="section"><h2>Smaksnoter</h2><div class="tags">${b.notes.map((t) => `<span class="tag" style="--c:${tagColor(t)}">${esc(t)}</span>`).join('')}</div></section>` : ''}

      ${hasProfile ? `<section class="section"><h2>Smaksprofil</h2><div class="radar-wrap">${radar(b.profile, PROFILE_AXES)}</div></section>` : ''}

      ${b.description ? `<section class="section"><h2>Notater</h2><p class="desc">${esc(b.description).replace(/\n/g, '<br>')}</p></section>` : ''}

      <section class="section">
        <h2>Detaljer</h2>
        <div class="facts">
          ${fact('Land', b.country ? `${flag(b.country)} ${esc(b.country)}` : '', 'pin')}
          ${fact('Region', esc(b.region || ''))}
          ${fact('Gård / produsent', esc(b.farm || ''))}
          ${fact('Varietet', esc(b.variety || ''))}
          ${fact('Prosess', esc(b.process || ''), 'drop')}
          ${fact('Høyde', b.altitude ? `${esc(b.altitude)} moh` : '')}
          ${fact('Brenning', b.roastLevel != null && b.roastLevel !== '' ? `${ROAST_LEVELS[b.roastLevel]}${roastBar(b.roastLevel)}` : '', 'fire')}
          ${fact('Brennedato', b.roastDate ? fmtDate(b.roastDate) : '')}
          ${fact('Pris', b.price ? `${esc(b.price)} kr${b.weight ? ` / ${b.weight} g` : ''}${pricePer100 ? `<small>${pricePer100}</small>` : ''}` : '')}
          ${fact('Kjøpt hos', esc(b.shop || ''))}
          ${fact('Passer til', (b.methods || []).map(methodName).join(', '), 'cup')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Bryggelogg <span class="count">${brews.length || ''}</span></h2><button class="btn btn-soft btn-sm" id="addBrew">${icon('plus')} Logg brygg</button></div>
        ${brews.length ? `<div class="brews">${brews.map((r) => brewItem(r, best && r.id === best.id && brews.length > 1)).join('')}</div>`
          : `<p class="muted small">Ingen brygg logget ennå. Logg oppskriften når du treffer blink – så finner du den igjen neste gang.</p>`}
        <a class="btn btn-ghost btn-block" href="#/brew?bean=${b.id}">${icon('timer')} Brygg med timer</a>
      </section>

      <p class="meta muted small">Lagt til ${fmtDate(b.createdAt)}${b.updatedAt && b.updatedAt - b.createdAt > 60000 ? ` · endret ${relDate(b.updatedAt)}` : ''}</p>
      <div class="detail-actions">
        <a class="btn btn-ghost" href="#/edit/${b.id}">${icon('edit')} Rediger</a>
        <button class="btn btn-ghost" id="shareBtn">${icon('share')} Del</button>
      </div>
    </div>
  </article>`;

  if (b.status !== 'wishlist') {
    starInput($('#rateHere'), b.rating || 0, async (v) => {
      await patchBean(id, { rating: v });
      if (v === 5) confetti();
    });
  }

  const scroller = $('.hero-scroll');
  if (scroller && photos.length > 1) {
    scroller.addEventListener('scroll', () => {
      const i = Math.round(scroller.scrollLeft / scroller.clientWidth);
      $$('.hero-dots i').forEach((d, j) => d.classList.toggle('on', i === j));
    }, { passive: true });
  }

  // Parallax på heltebildet
  const hero = $('.hero');
  const onScroll = () => { const y = scrollY; if (y < 500) hero.style.setProperty('--py', `${y * 0.35}px`); };
  window.addEventListener('scroll', onScroll, { passive: true });
  setCleanup(() => window.removeEventListener('scroll', onScroll));

  $('#backBtn').onclick = () => back('#/');
  $('#favBtn').onclick = async (e) => {
    const on = !b.favorite;
    await patchBean(id, { favorite: on });
    e.currentTarget.classList.toggle('on', on);
    e.currentTarget.classList.remove('burst'); void e.currentTarget.offsetWidth; if (on) e.currentTarget.classList.add('burst');
    haptic(on ? [8, 30, 8] : 5);
    toast(on ? 'Lagt til i favoritter ♥' : 'Fjernet fra favoritter');
  };
  $('#moreBtn').onclick = async () => {
    const a = await actionSheet([
      { label: 'Rediger', value: 'edit', icon: 'edit' },
      { label: 'Del', value: 'share', icon: 'share' },
      { label: 'Dupliser (ny pose / nytt parti)', value: 'dup', icon: 'copy' },
      { label: 'Slett bønne', value: 'del', icon: 'trash', danger: true },
    ]);
    if (a === 'edit') go(`#/edit/${id}`);
    if (a === 'share') share(b);
    if (a === 'dup') {
      const copy = { ...b, id: undefined, createdAt: undefined, rating: 0, status: 'stash', roastDate: '', openedAt: null, photos: [...(b.photos || [])], thumb: b.thumb };
      const n = await saveBean(copy);
      toast('Duplisert'); go(`#/edit/${n.id}`, { replace: true });
    }
    if (a === 'del') {
      const ok = await confirmSheet({ title: `Slette «${b.name}»?`, text: brews.length ? `Også ${brews.length} brygg slettes.` : '', ok: 'Slett', danger: true });
      if (!ok) return;
      const undo = await deleteBean(id);
      back('#/');
      toast('Bønnen er slettet', { action: 'Angre', onAction: async () => { await undo(); refresh(); toast('Gjenopprettet'); } });
    }
  };
  $('#shareBtn').onclick = () => share(b);
  $('#addBrew').onclick = () => openBrewSheet({ beanId: id, onSaved: refresh });

  view().addEventListener('click', async (e) => {
    const st = e.target.closest('[data-status]');
    if (st) {
      await patchBean(id, { status: st.dataset.status, openedAt: st.dataset.status === 'stash' ? Date.now() : b.openedAt });
      toast(st.dataset.status === 'stash' ? 'Flyttet til lageret' : 'Markert som smakt'); haptic(8); refresh();
    }
    const br = e.target.closest('[data-brew]');
    if (br) {
      const r = state.brews.find((x) => x.id === br.dataset.brew);
      const a = await actionSheet([
        { label: 'Rediger brygg', value: 'edit', icon: 'edit' },
        { label: 'Brygg igjen med timer', value: 'again', icon: 'timer' },
        { label: 'Slett brygg', value: 'del', icon: 'trash', danger: true },
      ]);
      if (a === 'edit') openBrewSheet({ brew: r, onSaved: refresh });
      if (a === 'again') go(`#/brew?bean=${id}&brew=${r.id}`);
      if (a === 'del') {
        const undo = await deleteBrew(r.id); refresh();
        toast('Brygg slettet', { action: 'Angre', onAction: async () => { await undo(); refresh(); } });
      }
    }
  });
  $('#newBag')?.addEventListener('click', async () => {
    await patchBean(id, { openedAt: Date.now() });
    toast('Ny pose registrert – full beholdning'); haptic(8); refresh();
  });
  $('#emptyBag')?.addEventListener('click', async () => {
    await patchBean(id, { status: 'tried' });
    toast('Flyttet til «Smakt». RIP posen 🫗'); refresh();
  });
}

async function share(b) {
  const lines = [
    `☕ ${b.name}${b.roaster ? ` – ${b.roaster}` : ''}`,
    b.country ? `${flag(b.country)} ${[b.country, b.region].filter(Boolean).join(', ')}` : '',
    [b.process, b.variety].filter(Boolean).join(' · '),
    b.rating ? `${'★'.repeat(Math.floor(b.rating))}${b.rating % 1 ? '½' : ''} ${fmtNum(b.rating)}/5 – ${ratingLabel(b.rating)}` : '',
    b.notes?.length ? `Smaker: ${b.notes.join(', ')}` : '',
    b.description || '',
  ].filter(Boolean);
  const text = lines.join('\n');
  const data = { title: b.name, text };
  try {
    if (b.photos?.[0] && navigator.canShare) {
      const file = new File([b.photos[0]], 'kaffe.jpg', { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) data.files = [file];
    }
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(text); toast('Kopiert til utklippstavlen'); }
  } catch (err) {
    if (err?.name !== 'AbortError') { try { await navigator.clipboard.writeText(text); toast('Kopiert til utklippstavlen'); } catch {} }
  }
}
