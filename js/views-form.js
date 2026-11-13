// Skjema for ny / redigert bønne
import { state, beanById, saveBean, uniq } from './store.js';
import { $, $$, esc, icon, starInput, radar, toast, confirmSheet, blobUrl, resizeImage, haptic, confetti, today } from './ui.js';
import { COUNTRIES, flag, PROCESSES, VARIETIES, ROAST_LEVELS, PROFILE_AXES, FLAVORS, tagColor, METHODS } from './data.js';
import { go, back, setCleanup } from './nav.js';

const view = () => $('#view');

const blank = () => ({
  name: '', roaster: '', status: 'tried', rating: 0, favorite: false, buyAgain: false,
  notes: [], profile: null, country: '', region: '', farm: '', variety: '', process: '', altitude: '',
  roastLevel: null, roastDate: '', price: '', weight: '', shop: '', methods: [], description: '', photos: [],
});

function datalist(id, items) {
  return `<datalist id="${id}">${items.map((x) => `<option value="${esc(x)}"></option>`).join('')}</datalist>`;
}

export function renderForm(id) {
  const existing = id ? beanById(id) : null;
  if (id && !existing) { go('#/', { replace: true }); return; }
  const f = existing ? structuredClone({ ...blank(), ...existing, photos: [] }) : blank();
  if (existing) f.photos = [...(existing.photos || [])];
  if (!existing) {
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    if (q.get('status')) f.status = q.get('status');
  }
  let dirty = false;
  let activeCat = null;
  const isNew = !existing;
  const detailsOpen = (...keys) => (keys.some((k) => f[k] !== '' && f[k] != null && !(Array.isArray(f[k]) && !f[k].length)) ? 'open' : '');

  view().innerHTML = `
  <form class="form" id="beanForm" novalidate autocomplete="off">
    <header class="form-head">
      <button type="button" class="link" id="cancelBtn">Avbryt</button>
      <h1>${isNew ? 'Ny bønne' : 'Rediger'}</h1>
      <button type="submit" class="link strong">Lagre</button>
    </header>

    <section class="photos" id="photos"></section>

    <div class="field-group">
      <label class="field big"><span>Navn på kaffen</span><input name="name" value="${esc(f.name)}" placeholder="F.eks. Guji Hambela" required enterkeyhint="next"></label>
      <label class="field"><span>Brenneri</span><input name="roaster" value="${esc(f.roaster)}" list="dl-roaster" placeholder="Hvem har brent den?"></label>
    </div>

    <div class="segmented" id="status" role="radiogroup">
      ${[['tried', 'Smakt'], ['stash', 'I lager'], ['wishlist', 'Ønskeliste']].map(([k, l]) => `<button type="button" data-v="${k}" class="${f.status === k ? 'on' : ''}">${l}</button>`).join('')}
    </div>

    <section class="form-card rate-card" id="rateCard">
      <div class="block-label">Karakter</div>
      <div id="stars"></div>
      <div class="toggles">
        <button type="button" class="toggle ${f.favorite ? 'on' : ''}" data-toggle="favorite">${icon('heart')} Favoritt</button>
        <button type="button" class="toggle ${f.buyAgain ? 'on' : ''}" data-toggle="buyAgain">${icon('repeat')} Kjøper igjen</button>
      </div>
    </section>

    <section class="form-card">
      <div class="block-label">Smaksnoter</div>
      <div class="tags selected-tags" id="selTags"></div>
      <div class="tag-input"><input id="tagInput" placeholder="Skriv en smak, f.eks. «blåbær»" enterkeyhint="done"><button type="button" class="btn btn-soft btn-sm" id="addTag">Legg til</button></div>
      <div class="tags suggestions" id="tagSugg"></div>
      <div class="chips-row cats" id="cats">${FLAVORS.map((g) => `<button type="button" class="chip cat" data-cat="${esc(g.cat)}" style="--c:${g.color}"><i></i>${esc(g.cat)}</button>`).join('')}</div>
      <div class="tags cat-tags" id="catTags"></div>
    </section>

    <section class="form-card">
      <div class="row-between"><div class="block-label">Smaksprofil</div><label class="switch"><input type="checkbox" id="profileOn" ${f.profile ? 'checked' : ''}><span></span></label></div>
      <div id="profile" class="${f.profile ? '' : 'hidden'}">
        <div class="radar-wrap small" id="radarPrev"></div>
        ${PROFILE_AXES.map(([k, l]) => `<label class="slider"><span>${l}</span><input type="range" min="1" max="5" step="1" data-axis="${k}" value="${f.profile?.[k] || 3}"><output>${f.profile?.[k] || 3}</output></label>`).join('')}
      </div>
    </section>

    <details class="form-card" ${detailsOpen('country', 'region', 'farm', 'variety', 'process', 'altitude')}>
      <summary>${icon('pin')} Opprinnelse</summary>
      <label class="field"><span>Land</span><div class="with-prefix"><b id="flagPrev">${flag(f.country) || '🌍'}</b><input name="country" value="${esc(f.country)}" list="dl-country" placeholder="Etiopia, Colombia…"></div></label>
      <div class="two">
        <label class="field"><span>Region</span><input name="region" value="${esc(f.region)}" list="dl-region" placeholder="Guji, Huila…"></label>
        <label class="field"><span>Høyde (moh)</span><input name="altitude" value="${esc(f.altitude)}" inputmode="numeric" placeholder="1900"></label>
      </div>
      <label class="field"><span>Gård / stasjon / produsent</span><input name="farm" value="${esc(f.farm)}" placeholder="Valgfritt"></label>
      <label class="field"><span>Varietet</span><input name="variety" value="${esc(f.variety)}" list="dl-variety" placeholder="Gesha, Bourbon, SL28…"></label>
      <div class="field"><span>Prosess</span><div class="chips-wrap" id="process">${PROCESSES.map((p) => `<button type="button" class="chip ${f.process === p ? 'on' : ''}" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div></div>
    </details>

    <details class="form-card" ${detailsOpen('roastLevel', 'roastDate')}>
      <summary>${icon('fire')} Brenning</summary>
      <div class="field"><span>Brenningsgrad</span>
        <div class="roast-pick" id="roast">${ROAST_LEVELS.map((l, i) => `<button type="button" class="r${i} ${f.roastLevel === i ? 'on' : ''}" data-v="${i}"><i></i><small>${l}</small></button>`).join('')}</div>
      </div>
      <label class="field"><span>Brennedato</span><div class="with-btn"><input type="date" name="roastDate" value="${esc(f.roastDate)}" max="${today()}"><button type="button" class="btn btn-soft btn-sm" id="roastToday">I dag</button></div></label>
    </details>

    <details class="form-card" ${detailsOpen('price', 'weight', 'shop')}>
      <summary>${icon('scale')} Kjøp</summary>
      <div class="two">
        <label class="field"><span>Pris (kr)</span><input name="price" value="${esc(f.price)}" inputmode="decimal" placeholder="229"></label>
        <label class="field"><span>Vekt (g)</span><input name="weight" value="${esc(f.weight)}" inputmode="numeric" placeholder="250"></label>
      </div>
      <div class="chips-wrap quick" id="weights">${[100, 200, 250, 340, 500, 1000].map((w) => `<button type="button" class="chip sm" data-w="${w}">${w >= 1000 ? w / 1000 + ' kg' : w + ' g'}</button>`).join('')}</div>
      <label class="field"><span>Kjøpt hos</span><input name="shop" value="${esc(f.shop)}" list="dl-shop" placeholder="Butikk, nettbutikk, kafé…"></label>
    </details>

    <details class="form-card" ${detailsOpen('methods')}>
      <summary>${icon('cup')} Passer til</summary>
      <div class="chips-wrap" id="methods">${METHODS.map((m) => `<button type="button" class="chip ${f.methods.includes(m.id) ? 'on' : ''}" data-v="${m.id}">${m.name}</button>`).join('')}</div>
    </details>

    <section class="form-card">
      <div class="block-label">Notater</div>
      <textarea name="description" rows="4" placeholder="Hva syntes du? Hvordan bryggte du den best?">${esc(f.description)}</textarea>
    </section>

    <div class="form-foot"><button type="submit" class="btn btn-primary btn-lg btn-block">${icon('check')} ${isNew ? 'Lagre bønne' : 'Lagre endringer'}</button></div>
    ${datalist('dl-roaster', uniq('roaster'))}
    ${datalist('dl-country', COUNTRIES.map((c) => c[0]))}
    ${datalist('dl-region', uniq('region'))}
    ${datalist('dl-variety', [...new Set([...VARIETIES, ...uniq('variety')])])}
    ${datalist('dl-shop', uniq('shop'))}
    <input type="file" id="fileIn" accept="image/*" multiple hidden>
  </form>`;

  const form = $('#beanForm');
  document.body.classList.add('form-open');
  setCleanup(() => document.body.classList.remove('form-open'));

  // --- Bilder
  const paintPhotos = () => {
    $('#photos').innerHTML = `<div class="photo-strip">
      ${f.photos.map((p, i) => `<div class="photo-tile ${i === 0 ? 'cover' : ''}"><img src="${blobUrl(p)}" alt="">
        ${i === 0 ? '<span class="cover-tag">Forside</span>' : `<button type="button" class="tile-btn star-btn" data-cover="${i}" aria-label="Bruk som forsidebilde">★</button>`}
        <button type="button" class="tile-btn rm-btn" data-rm="${i}" aria-label="Fjern bilde">${icon('close')}</button></div>`).join('')}
      <button type="button" class="photo-add ${f.photos.length ? '' : 'big'}" id="addPhoto">${icon('camera')}<span>${f.photos.length ? 'Legg til' : 'Ta bilde av posen'}</span>${f.photos.length ? '' : '<small>eller velg fra biblioteket</small>'}</button>
    </div>`;
  };
  paintPhotos();
  $('#photos').addEventListener('click', (e) => {
    if (e.target.closest('#addPhoto')) $('#fileIn').click();
    const rm = e.target.closest('[data-rm]');
    if (rm) { f.photos.splice(+rm.dataset.rm, 1); dirty = true; paintPhotos(); }
    const cv = e.target.closest('[data-cover]');
    if (cv) { const [p] = f.photos.splice(+cv.dataset.cover, 1); f.photos.unshift(p); dirty = true; haptic(6); paintPhotos(); }
  });
  $('#fileIn').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    $('#addPhoto').classList.add('loading');
    for (const file of files.slice(0, 6)) {
      try { f.photos.push(await resizeImage(file)); } catch { toast('Kunne ikke lese et av bildene'); }
    }
    dirty = true; haptic(8); paintPhotos();
  });

  // --- Status
  const applyStatus = () => {
    $$('#status button').forEach((b) => b.classList.toggle('on', b.dataset.v === f.status));
    $('#rateCard').classList.toggle('dim', f.status === 'wishlist');
  };
  applyStatus();
  $('#status').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    f.status = b.dataset.v; dirty = true; haptic(4); applyStatus();
  });

  // --- Karakter
  starInput($('#stars'), f.rating, (v) => { f.rating = v; dirty = true; });
  $$('[data-toggle]').forEach((t) => t.addEventListener('click', () => {
    const k = t.dataset.toggle; f[k] = !f[k]; dirty = true; t.classList.toggle('on', f[k]); haptic(6);
  }));

  // --- Smaksnoter
  const paintTags = () => {
    $('#selTags').innerHTML = f.notes.length
      ? f.notes.map((t, i) => `<button type="button" class="tag removable" style="--c:${tagColor(t)}" data-rmtag="${i}">${esc(t)} ${icon('close')}</button>`).join('')
      : '<span class="muted small">Velg fra smakshjulet under, eller skriv din egen.</span>';
    if (activeCat) {
      const g = FLAVORS.find((x) => x.cat === activeCat);
      $('#catTags').innerHTML = g.tags.map((t) => `<button type="button" class="tag pick ${f.notes.includes(t) ? 'on' : ''}" style="--c:${g.color}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
    } else $('#catTags').innerHTML = '';
    $$('#cats .chip').forEach((c) => c.classList.toggle('on', c.dataset.cat === activeCat));
  };
  const addTag = (t) => {
    t = t.trim(); if (!t) return;
    t = t[0].toUpperCase() + t.slice(1);
    const known = FLAVORS.flatMap((g) => g.tags).find((x) => x.toLowerCase() === t.toLowerCase());
    t = known || t;
    if (!f.notes.some((x) => x.toLowerCase() === t.toLowerCase())) { f.notes.push(t); dirty = true; haptic(5); }
    paintTags();
  };
  const suggest = () => {
    const q = $('#tagInput').value.trim().toLowerCase();
    if (!q) { $('#tagSugg').innerHTML = ''; return; }
    const all = [...new Set([...FLAVORS.flatMap((g) => g.tags), ...state.beans.flatMap((b) => b.notes || [])])];
    $('#tagSugg').innerHTML = all.filter((t) => t.toLowerCase().includes(q) && !f.notes.includes(t)).slice(0, 8)
      .map((t) => `<button type="button" class="tag pick" style="--c:${tagColor(t)}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
  };
  paintTags();
  $('#tagInput').addEventListener('input', suggest);
  $('#tagInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(e.target.value.replace(',', '')); e.target.value = ''; suggest(); }
  });
  $('#addTag').onclick = () => { addTag($('#tagInput').value); $('#tagInput').value = ''; suggest(); };
  form.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    if (c) { activeCat = activeCat === c.dataset.cat ? null : c.dataset.cat; haptic(3); paintTags(); }
    const t = e.target.closest('[data-tag]');
    if (t) {
      const tag = t.dataset.tag;
      const i = f.notes.indexOf(tag);
      if (i >= 0) { f.notes.splice(i, 1); dirty = true; haptic(3); paintTags(); }
      else addTag(tag);
      if (t.closest('#tagSugg')) { $('#tagInput').value = ''; suggest(); }
    }
    const r = e.target.closest('[data-rmtag]');
    if (r) { f.notes.splice(+r.dataset.rmtag, 1); dirty = true; paintTags(); }
  });

  // --- Profil
  const readProfile = () => Object.fromEntries($$('[data-axis]').map((s) => [s.dataset.axis, +s.value]));
  const paintRadar = () => { $('#radarPrev').innerHTML = radar(readProfile(), PROFILE_AXES, { size: 220 }); };
  paintRadar();
  $('#profileOn').addEventListener('change', (e) => { $('#profile').classList.toggle('hidden', !e.target.checked); dirty = true; haptic(5); });
  $$('[data-axis]').forEach((s) => s.addEventListener('input', () => {
    s.nextElementSibling.textContent = s.value; dirty = true; haptic(3); paintRadar();
  }));

  // --- Opprinnelse / prosess / brenning / metoder
  form.country.addEventListener('input', (e) => { $('#flagPrev').textContent = flag(e.target.value.trim()) || '🌍'; });
  $('#process').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    f.process = f.process === b.dataset.v ? '' : b.dataset.v; dirty = true; haptic(4);
    $$('#process .chip').forEach((c) => c.classList.toggle('on', c.dataset.v === f.process));
  });
  $('#roast').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const v = +b.dataset.v; f.roastLevel = f.roastLevel === v ? null : v; dirty = true; haptic(4);
    $$('#roast button').forEach((c) => c.classList.toggle('on', +c.dataset.v === f.roastLevel));
  });
  $('#roastToday').onclick = () => { form.roastDate.value = today(); dirty = true; };
  $('#weights').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    form.weight.value = b.dataset.w; dirty = true; haptic(4);
  });
  $('#methods').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const i = f.methods.indexOf(b.dataset.v);
    if (i >= 0) f.methods.splice(i, 1); else f.methods.push(b.dataset.v);
    b.classList.toggle('on', i < 0); dirty = true; haptic(4);
  });
  form.addEventListener('input', () => { dirty = true; });

  // --- Avbryt / lagre
  $('#cancelBtn').onclick = async () => {
    if (dirty && !(await confirmSheet({ title: 'Forkaste endringene?', text: 'Det du har fylt inn blir ikke lagret.', ok: 'Forkast', cancel: 'Fortsett å redigere', danger: true }))) return;
    back(existing ? `#/bean/${existing.id}` : '#/');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name) {
      form.name.closest('.field').classList.add('shake'); form.name.focus();
      setTimeout(() => form.name.closest('.field').classList.remove('shake'), 500);
      toast('Kaffen trenger et navn'); haptic([20, 40, 20]);
      return;
    }
    const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? '' : n; };
    const bean = {
      ...(existing || {}),
      ...f,
      name,
      roaster: form.roaster.value.trim(),
      country: form.country.value.trim(),
      region: form.region.value.trim(),
      farm: form.farm.value.trim(),
      variety: form.variety.value.trim(),
      altitude: form.altitude.value.trim(),
      roastDate: form.roastDate.value,
      price: num(form.price.value),
      weight: num(form.weight.value),
      shop: form.shop.value.trim(),
      description: form.description.value.trim(),
      profile: $('#profileOn').checked ? readProfile() : null,
    };
    if (bean.status === 'stash' && (!existing || existing.status !== 'stash')) bean.openedAt = Date.now();
    const btns = $$('[type=submit]', form); btns.forEach((b) => (b.disabled = true));
    try {
      const saved = await saveBean(bean);
      dirty = false;
      haptic([10, 30, 10]);
      if (saved.rating === 5 && (!existing || existing.rating !== 5)) confetti();
      toast(isNew ? 'Lagret i loggen ☕' : 'Endringer lagret');
      if (isNew) go(`#/bean/${saved.id}`, { replace: true });
      else back(`#/bean/${saved.id}`);
    } catch (err) {
      console.error(err);
      toast('Noe gikk galt ved lagring');
      btns.forEach((b) => (b.disabled = false));
    }
  });

  if (isNew) setTimeout(() => { if (!matchMedia('(pointer: coarse)').matches) form.name.focus(); }, 300);
}
