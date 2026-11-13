// Bryggetimer, oppskriftskalkulator og brygg-logg-ark
import { state, beanById, brewsFor, saveBrew, remaining, patchBean, defaultMethod } from './store.js';
import { $, $$, esc, icon, sheet, starInput, toast, haptic, fmtNum, fmtTime, parseTime, today } from './ui.js';
import { METHODS, methodById, isEspresso } from './data.js';
import { setCleanup, go, refresh } from './nav.js';

const view = () => $('#view');

// Timer-tilstand lever utenfor visningen, så den fortsetter å gå om du bytter fane
const T = { running: false, startedAt: 0, acc: 0, lastStep: -1 };
const elapsed = () => (T.running ? T.acc + (performance.now() - T.startedAt) / 1000 : T.acc);
let wakeLock = null;
async function lock(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else { await wakeLock?.release(); wakeLock = null; }
  } catch {}
}

const R = {
  method: null,
  dose: null, ratio: null, beanId: '',
};

function stashFirst() {
  return [...state.beans].filter((b) => b.status !== 'wishlist')
    .sort((a, b) => (a.status === 'stash' ? -1 : 0) - (b.status === 'stash' ? -1 : 0) || b.updatedAt - a.updatedAt);
}

function beanOptions(sel) {
  const list = stashFirst();
  const stash = list.filter((b) => b.status === 'stash'), rest = list.filter((b) => b.status !== 'stash');
  const opt = (b) => `<option value="${b.id}" ${b.id === sel ? 'selected' : ''}>${esc(b.name)}${b.roaster ? ` – ${esc(b.roaster)}` : ''}</option>`;
  return `<option value="">Velg bønne…</option>${stash.length ? `<optgroup label="I lager">${stash.map(opt).join('')}</optgroup>` : ''}${rest.length ? `<optgroup label="Smakt">${rest.map(opt).join('')}</optgroup>` : ''}`;
}

export function renderBrew() {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  if (!R.method || (!T.running && T.acc === 0 && !q.get('brew'))) {
    if (R.method !== defaultMethod()) R.dose = null;
    R.method = defaultMethod();
  }
  const m0 = methodById(R.method) || METHODS[0];
  if (R.dose == null) { R.dose = m0.dose; R.ratio = m0.ratio; }
  if (q.get('bean')) R.beanId = q.get('bean');
  if (q.get('brew')) {
    const r = state.brews.find((x) => x.id === q.get('brew'));
    if (r) { R.method = r.method || R.method; if (r.dose) R.dose = r.dose; if (r.dose && r.water) R.ratio = Math.round((r.water / r.dose) * 10) / 10; }
  }

  view().innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Bryggestasjon</p><h1 class="title">Brygg</h1></div></header>
    <div class="chips-row" id="methodRow">${METHODS.map((m) => `<button class="chip ${m.id === R.method ? 'on' : ''}" data-m="${m.id}">${m.name}</button>`).join('')}</div>

    <section class="form-card recipe">
      <label class="field"><span>Bønne</span><select id="beanSel">${beanOptions(R.beanId)}</select></label>
      <div id="lastHint"></div>
      <div class="recipe-grid">
        <div class="stepper"><span id="doseLabel">Kaffe</span><div><button data-step="dose:-1" aria-label="Mindre kaffe">−</button><output id="dose"></output><button data-step="dose:1" aria-label="Mer kaffe">+</button></div></div>
        <div class="stepper"><span>Ratio</span><div><button data-step="ratio:-0.5" aria-label="Lavere ratio">−</button><output id="ratio"></output><button data-step="ratio:0.5" aria-label="Høyere ratio">+</button></div></div>
      </div>
      <div class="water"><span id="waterLabel">Vann</span><strong id="water"></strong></div>
      <div class="recipe-hints" id="hints"></div>
    </section>

    <section class="timer-card">
      <div class="timer-ring">
        <svg viewBox="0 0 200 200"><circle class="ring-bg" cx="100" cy="100" r="88"/><circle class="ring-fg" id="ring" cx="100" cy="100" r="88"/><g id="ticks"></g></svg>
        <div class="timer-center"><div class="timer-time" id="tTime">0:00</div><div class="timer-step" id="tStep"></div></div>
      </div>
      <div class="step-now" id="stepNow"></div>
      <div class="timer-controls">
        <button class="round-btn lg ghost" id="tReset" aria-label="Nullstill">${icon('reset')}</button>
        <button class="play-btn" id="tPlay" aria-label="Start">${icon('play')}</button>
        <button class="round-btn lg ghost" id="tSave" aria-label="Lagre brygg">${icon('check')}</button>
      </div>
      <ol class="steps" id="steps"></ol>
    </section>`;

  const method = () => methodById(R.method) || METHODS[0];
  const water = () => Math.round(R.dose * R.ratio);

  const paintRecipe = () => {
    const m = method();
    $('#dose').textContent = `${fmtNum(R.dose, R.dose % 1 ? 1 : 0)} g`;
    $('#ratio').textContent = `1:${fmtNum(R.ratio, isEspresso(m.id) || R.ratio % 1 ? 1 : 0)}`;
    $('#doseLabel').textContent = isEspresso(m.id) ? 'Inn' : 'Kaffe';
    $('#water').textContent = `${water()} g`;
    $('#waterLabel').textContent = isEspresso(m.id) ? 'Ut i koppen' : 'Vann';
    $('#hints').innerHTML = `<span>${icon('drop')} ${m.temp}°C</span><span>${icon('settings')} ${m.grind}</span>${m.target ? `<span>${icon('timer')} ${m.target}</span>` : m.steps.length > 1 ? `<span>${icon('timer')} ~${fmtTime(m.steps[m.steps.length - 1][0])}</span>` : ''}`;
    const b = beanById($('#beanSel').value);
    const last = b ? brewsFor(b.id).find((r) => r.method === R.method) : null;
    const best = b ? brewsFor(b.id).filter((r) => r.method === R.method && r.rating).sort((x, y) => y.rating - x.rating)[0] : null;
    const ref = best || last;
    $('#lastHint').innerHTML = ref ? `<button class="hint-btn" id="useLast">${icon('sparkle')}<span>Bruk ${best ? 'beste' : 'forrige'} oppskrift: ${ref.dose || '?'} g · 1:${ref.dose && ref.water ? fmtNum(ref.water / ref.dose) : '?'}${ref.grind ? ` · kvern ${esc(ref.grind)}` : ''}</span></button>` : '';
    $('#useLast')?.addEventListener('click', () => {
      if (ref.dose) R.dose = ref.dose;
      if (ref.dose && ref.water) R.ratio = Math.round((ref.water / ref.dose) * 10) / 10;
      haptic(6); paintRecipe();
    });
    const rest = b ? remaining(b) : null;
    if (b && rest != null && rest < R.dose) $('#lastHint').insertAdjacentHTML('beforeend', `<p class="warn small">Bare ${Math.round(rest)} g igjen i posen</p>`);
  };

  const C = 2 * Math.PI * 88;
  const total = () => { const s = method().steps; return Math.max(s[s.length - 1][0], 1); };
  const stepIndex = (t) => { const s = method().steps; let i = 0; s.forEach(([at], j) => { if (t >= at) i = j; }); return i; };
  const paintSteps = () => {
    const s = method().steps;
    $('#steps').innerHTML = s.map(([at, title, hint], i) => `<li data-i="${i}"><span class="st-time">${fmtTime(at)}</span><div><strong>${title}</strong><span>${hint}</span></div></li>`).join('');
    $('#ticks').innerHTML = s.slice(1, -1).map(([at]) => {
      const a = (at / total()) * Math.PI * 2; // SVG-en er allerede rotert -90°
      return `<circle class="tick" cx="${100 + Math.cos(a) * 88}" cy="${100 + Math.sin(a) * 88}" r="3.5"/>`;
    }).join('');
  };

  let raf;
  const tick = () => {
    const t = elapsed();
    const s = method().steps;
    const i = stepIndex(t);
    $('#tTime').textContent = fmtTime(t);
    const p = Math.min(1, t / total());
    $('#ring').style.strokeDasharray = `${C}`;
    $('#ring').style.strokeDashoffset = `${C * (1 - p)}`;
    const next = s[i + 1];
    $('#tStep').textContent = next ? `Neste om ${fmtTime(next[0] - t)}` : t > 0 ? 'Ferdig!' : '';
    const [, title, hint] = s[i];
    $('#stepNow').innerHTML = t > 0 || T.running ? `<strong>${title}</strong><span>${hint}</span>` : `<strong>Klar?</strong><span>${isEspresso(method().id) ? `${fmtNum(R.dose, R.dose % 1 ? 1 : 0)} g inn → ${water()} g ut · ${method().target}` : `${R.dose} g kaffe · ${water()} g vann · ${method().temp}°C`}</span>`;
    $$('#steps li').forEach((li, j) => { li.classList.toggle('done', (t > 0 || T.running) && j < i); li.classList.toggle('now', (t > 0 || T.running) && j === i); });
    if (T.running && i !== T.lastStep) {
      if (T.lastStep !== -1) { haptic([30, 60, 30]); $('#stepNow').classList.remove('flash'); void $('#stepNow').offsetWidth; $('#stepNow').classList.add('flash'); }
      T.lastStep = i;
    }
    $('#tPlay').innerHTML = icon(T.running ? 'pause' : 'play');
    $('#tPlay').classList.toggle('running', T.running);
    $('#tSave').classList.toggle('ready', !T.running && t > 0);
    if (T.running) raf = requestAnimationFrame(tick);
  };

  paintRecipe(); paintSteps(); tick();
  setCleanup(() => cancelAnimationFrame(raf));

  $('#methodRow').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    if (T.running) { toast('Stopp timeren før du bytter metode'); return; }
    R.method = b.dataset.m;
    const m = method(); R.dose = m.dose; R.ratio = m.ratio;
    T.acc = 0; T.lastStep = -1;
    $$('#methodRow .chip').forEach((c) => c.classList.toggle('on', c === b));
    haptic(4); paintRecipe(); paintSteps(); tick();
  });
  $('#beanSel').addEventListener('change', (e) => { R.beanId = e.target.value; paintRecipe(); });
  view().addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]'); if (!s) return;
    const [k, d] = s.dataset.step.split(':');
    const esp = isEspresso(R.method);
    if (k === 'dose') R.dose = Math.max(1, Math.round((R.dose + +d * (esp ? 0.5 : R.dose >= 40 ? 5 : 1)) * 10) / 10);
    else R.ratio = Math.max(1, Math.round((R.ratio + +d * (R.ratio < 4 ? 0.2 : 1)) * 10) / 10);
    haptic(3); paintRecipe(); if (!T.running) tick();
  });
  $('#tPlay').onclick = () => {
    if (T.running) { T.acc = elapsed(); T.running = false; lock(false); haptic(10); }
    else { T.startedAt = performance.now(); T.running = true; if (T.acc === 0) T.lastStep = -1; lock(true); haptic([15, 30, 15]); }
    tick();
  };
  $('#tReset').onclick = () => { T.running = false; T.acc = 0; T.lastStep = -1; lock(false); haptic(6); tick(); };
  $('#tSave').onclick = () => {
    const t = Math.round(elapsed());
    if (T.running) { T.acc = elapsed(); T.running = false; lock(false); tick(); }
    openBrewSheet({
      beanId: $('#beanSel').value || null,
      preset: { method: R.method, dose: R.dose, water: water(), temp: method().temp, time: t || null },
      onSaved: (brew) => { T.acc = 0; T.lastStep = -1; tick(); go(`#/bean/${brew.beanId}`); },
    });
  };
}

// --------- Ark for å logge / redigere et brygg ---------
export function openBrewSheet({ beanId = null, brew = null, preset = {}, onSaved } = {}) {
  const lastForBean = beanId ? brewsFor(beanId)[0] : null;
  const r = brew ? { ...brew } : {
    beanId, date: today(), method: preset.method || defaultMethod(),
    dose: '', water: '', grind: '', temp: '', time: preset.time ?? null, rating: 0, notes: '',
  };
  if (!brew) {
    // Forhåndsutfyll fra siste brygg med samme metode, ellers metodens standard
    const m = methodById(r.method);
    const last = beanId ? brewsFor(beanId).find((x) => x.method === r.method) : null;
    r.dose = preset.dose ?? last?.dose ?? m?.dose ?? '';
    r.water = preset.water ?? last?.water ?? (m ? Math.round(m.dose * m.ratio) : '');
    r.grind = last?.grind || '';
    r.temp = preset.temp ?? last?.temp ?? m?.temp ?? '';
  }
  const esp = () => isEspresso(r.method);
  const fixedBean = !!(beanId || brew);
  sheet(`<form class="sheet-body brew-form" id="brewForm" novalidate>
    <h3>${brew ? 'Rediger brygg' : 'Logg brygg'}</h3>
    ${fixedBean ? `<p class="muted small">${esc(beanById(r.beanId)?.name || '')}</p>` : `<label class="field"><span>Bønne</span><select name="beanId" required>${beanOptions(r.beanId)}</select></label>`}
    <div class="chips-row tight" id="bMethods">${METHODS.map((m) => `<button type="button" class="chip ${m.id === r.method ? 'on' : ''}" data-m="${m.id}">${m.name}</button>`).join('')}</div>
    <div class="three">
      <label class="field"><span id="doseLbl">${esp() ? 'Inn (g)' : 'Kaffe (g)'}</span><input name="dose" inputmode="decimal" value="${r.dose ?? ''}" placeholder="${esp() ? '18' : '15'}"></label>
      <label class="field"><span id="waterLbl">${esp() ? 'Ut (g)' : 'Vann (g)'}</span><input name="water" inputmode="decimal" value="${r.water ?? ''}" placeholder="${esp() ? '36' : '250'}"></label>
      <div class="field ratio-box"><span>Ratio</span><strong id="ratioOut">–</strong></div>
    </div>
    <div class="three">
      <label class="field"><span>Kvern</span><input name="grind" value="${esc(r.grind || '')}" placeholder="${esp() ? 'F.eks. 2,5' : 'F.eks. 22 klikk'}"></label>
      <label class="field"><span>Temp (°C)</span><input name="temp" inputmode="numeric" value="${r.temp ?? ''}" placeholder="94"></label>
      <label class="field"><span id="timeLbl">${esp() ? 'Tid (sek)' : 'Tid (m:ss)'}</span><input name="time" inputmode="${esp() ? 'numeric' : 'text'}" value="${r.time ? (esp() && r.time < 60 ? r.time : fmtTime(r.time)) : ''}" placeholder="${esp() ? '28' : '3:00'}"></label>
    </div>
    <label class="field"><span>Dato</span><input type="date" name="date" value="${r.date || today()}" max="${today()}"></label>
    <div class="field"><span>Hvordan ble koppen?</span><div id="bStars"></div></div>
    <label class="field"><span>Notater</span><textarea name="notes" rows="2" placeholder="Litt for syrlig – mal finere neste gang">${esc(r.notes || '')}</textarea></label>
    <button type="submit" class="btn btn-primary btn-lg btn-block">${icon('check')} Lagre brygg</button>
  </form>`, {
    className: 'tall',
    onMount: (el, api) => {
      const form = el.querySelector('#brewForm');
      const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? '' : n; };
      const paintRatio = () => {
        const d = num(form.dose.value), w = num(form.water.value);
        el.querySelector('#ratioOut').textContent = d && w ? `1:${fmtNum(w / d)}` : '–';
      };
      paintRatio();
      form.dose.addEventListener('input', paintRatio);
      form.water.addEventListener('input', paintRatio);
      const st = starInput(el.querySelector('#bStars'), r.rating || 0);
      el.querySelector('#bMethods').addEventListener('click', (e) => {
        const b = e.target.closest('[data-m]'); if (!b) return;
        r.method = b.dataset.m; haptic(4);
        el.querySelectorAll('#bMethods .chip').forEach((c) => c.classList.toggle('on', c === b));
        el.querySelector('#waterLbl').textContent = esp() ? 'Ut (g)' : 'Vann (g)';
        el.querySelector('#doseLbl').textContent = esp() ? 'Inn (g)' : 'Kaffe (g)';
        el.querySelector('#timeLbl').textContent = esp() ? 'Tid (sek)' : 'Tid (m:ss)';
      });
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bid = fixedBean ? r.beanId : form.beanId.value;
        if (!bid) { toast('Velg hvilken bønne du bryggte'); haptic([20, 40, 20]); return; }
        const out = {
          ...r, beanId: bid, dose: num(form.dose.value), water: num(form.water.value),
          grind: form.grind.value.trim(), temp: num(form.temp.value), time: parseTime(form.time.value),
          date: form.date.value || today(), rating: st.get(), notes: form.notes.value.trim(),
        };
        const saved = await saveBrew(out);
        haptic([10, 30, 10]);
        api.close();
        const b = beanById(bid);
        const rest = b ? remaining(b) : null;
        if (b && b.status === 'stash' && rest === 0) {
          toast('Posen er tom 😢', { action: 'Flytt til Smakt', duration: 6000, onAction: async () => { await patchBean(bid, { status: 'tried' }); refresh(); } });
        } else toast(brew ? 'Brygg oppdatert' : 'Brygg logget ☕');
        onSaved?.(saved);
      });
    },
  });
}
