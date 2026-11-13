// Felles UI-hjelpere: ikoner, stjerner, radar, ark, toasts, bilder, konfetti
import { ratingLabel } from './data.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export function haptic(pattern = 8) {
  try { navigator.vibrate?.(pattern); } catch {}
}

// ---------- Ikoner (inline SVG, stroke-basert) ----------
const P = {
  beans: '<ellipse cx="9" cy="12" rx="5" ry="7.5" transform="rotate(-30 9 12)"/><path d="M6.2 6.8c2.5 2 1.2 8.4 5.6 10.4"/><ellipse cx="17" cy="9" rx="3.4" ry="5" transform="rotate(25 17 9)"/><path d="M15.4 5.2c1.6 1.6.4 5.6 3.2 7.6"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  more: '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  sort: '<path d="M3 6h18M6 12h12M10 18h4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
  pause: '<path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  drop: '<path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z"/>',
  cup: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
  repeat: '<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  scale: '<path d="M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zM19 7l-3 7a4 4 0 0 0 6 0z"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.4 1.4 1.4 2.7 2.5 2.7z"/>',
};
export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

// ---------- Stjerner ----------
const STAR = 'M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z';
export function stars(value = 0, size = 'sm') {
  let out = `<span class="stars stars-${size}" role="img" aria-label="${value} av 5 stjerner">`;
  for (let i = 1; i <= 5; i++) {
    const fill = Math.max(0, Math.min(1, value - (i - 1))) * 100;
    out += `<span class="star"><svg viewBox="0 0 24 24"><path d="${STAR}" class="star-bg"/></svg><span class="star-fill" style="width:${fill}%"><svg viewBox="0 0 24 24"><path d="${STAR}"/></svg></span></span>`;
  }
  return out + '</span>';
}

// Interaktiv stjernevelger med halve stjerner + dra-støtte
export function starInput(container, value, onChange) {
  let v = value || 0;
  const render = () => {
    container.innerHTML = `<div class="star-input" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${v}" aria-label="Karakter">${stars(v, 'lg')}</div><div class="rating-caption"><strong>${v ? v.toFixed(1).replace('.', ',') : '–'}</strong><span>${ratingLabel(v)}</span></div>`;
  };
  render();
  const calc = (e) => {
    const el = container.querySelector('.stars');
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, e.clientX - r.left));
    return Math.max(0.5, Math.ceil((x / r.width) * 10) / 2);
  };
  let dragging = false, startV = 0;
  const set = (nv, pop) => {
    if (nv === v) return;
    v = nv;
    render();
    haptic(nv === 5 ? [10, 40, 20] : 6);
    if (pop) {
      const idx = Math.ceil(v) - 1;
      container.querySelectorAll('.star')[idx]?.classList.add('pop');
    }
    onChange?.(v);
  };
  container.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.stars')) return;
    dragging = true; startV = v;
    container.setPointerCapture?.(e.pointerId);
    const nv = calc(e);
    set(nv === startV && nv === 0.5 ? 0 : nv, true);
  });
  container.addEventListener('pointermove', (e) => { if (dragging) set(calc(e), true); });
  const end = () => { dragging = false; };
  container.addEventListener('pointerup', end);
  container.addEventListener('pointercancel', end);
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(Math.min(5, v + 0.5), true); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(Math.max(0, v - 0.5), true); e.preventDefault(); }
  });
  return { get: () => v, set: (nv) => { v = nv; render(); } };
}

// ---------- Radar (smaksprofil) ----------
export function radar(profile, axes, { size = 260, compare = null } = {}) {
  const n = axes.length, c = size / 2, R = size / 2 - 38;
  const pt = (i, val) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (val / 5) * R;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  let grid = '';
  for (let lvl = 1; lvl <= 5; lvl++) {
    grid += `<polygon class="radar-grid" points="${axes.map((_, i) => pt(i, lvl).join(',')).join(' ')}"/>`;
  }
  const spokes = axes.map((_, i) => { const [x, y] = pt(i, 5); return `<line class="radar-grid" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`; }).join('');
  const labels = axes.map(([key, label], i) => {
    const [x, y] = pt(i, 6.15);
    const anchor = Math.abs(x - c) < 4 ? 'middle' : x > c ? 'start' : 'end';
    const v = profile?.[key];
    return `<text class="radar-label" x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${esc(label)}${v ? ` <tspan class="radar-val">${v}</tspan>` : ''}</text>`;
  }).join('');
  const shape = (p, cls) => {
    const pts = axes.map(([k], i) => pt(i, p?.[k] || 0));
    return `<polygon class="${cls}" points="${pts.map((q) => q.join(',')).join(' ')}"/>` +
      (cls === 'radar-shape' ? pts.map(([x, y]) => `<circle class="radar-dot" cx="${x}" cy="${y}" r="4"/>`).join('') : '');
  };
  return `<svg class="radar" viewBox="-56 0 ${size + 112} ${size}" role="img" aria-label="Smaksprofil">${grid}${spokes}${compare ? shape(compare, 'radar-compare') : ''}${shape(profile, 'radar-shape')}${labels}</svg>`;
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg, { action, onAction, duration = 3200 } = {}) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  if (action) el.querySelector('button').onclick = () => { el.classList.remove('show'); onAction?.(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

// ---------- Bunnark (bottom sheet) ----------
export function sheet(html, { onMount, className = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet ${className}" role="dialog" aria-modal="true"><div class="sheet-handle"></div>${html}</div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('no-scroll');
  const sheetEl = wrap.querySelector('.sheet');
  requestAnimationFrame(() => wrap.classList.add('open'));
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    wrap.classList.remove('open');
    document.body.classList.remove('no-scroll');
    window.removeEventListener('popstate', onPop);
    setTimeout(() => wrap.remove(), 320);
    api.onClose?.();
  };
  const onPop = () => close();
  window.addEventListener('popstate', onPop, { once: true });
  wrap.querySelector('.sheet-backdrop').addEventListener('click', close);
  // Dra ned for å lukke
  let startY = null, dy = 0;
  const handle = wrap.querySelector('.sheet-handle');
  sheetEl.addEventListener('touchstart', (e) => {
    if (sheetEl.scrollTop > 0 && e.target !== handle) return;
    startY = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  sheetEl.addEventListener('touchmove', (e) => {
    if (startY == null) return;
    dy = e.touches[0].clientY - startY;
    if (dy > 0) { sheetEl.style.transform = `translateY(${dy}px)`; sheetEl.style.transition = 'none'; }
  }, { passive: true });
  sheetEl.addEventListener('touchend', () => {
    if (startY == null) return;
    sheetEl.style.transition = ''; sheetEl.style.transform = '';
    if (dy > 110) close();
    startY = null;
  });
  const api = { el: sheetEl, close, onClose: null };
  onMount?.(sheetEl, api);
  return api;
}

export function confirmSheet({ title, text = '', ok = 'OK', cancel = 'Avbryt', danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    const s = sheet(`<div class="sheet-body confirm"><h3>${esc(title)}</h3>${text ? `<p class="muted">${esc(text)}</p>` : ''}
      <div class="btn-row"><button class="btn btn-ghost" data-act="no">${esc(cancel)}</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="yes">${esc(ok)}</button></div></div>`, {
      onMount: (el, api) => {
        el.addEventListener('click', (e) => {
          const a = e.target.closest('[data-act]')?.dataset.act;
          if (!a) return;
          result = a === 'yes';
          api.close();
        });
      },
    });
    s.onClose = () => resolve(result);
  });
}

export function actionSheet(items) {
  return new Promise((resolve) => {
    let picked = null;
    const s = sheet(`<div class="sheet-body"><div class="action-list">${items.map((it, i) => `<button class="action-item ${it.danger ? 'danger' : ''}" data-i="${i}">${icon(it.icon)}<span>${esc(it.label)}</span></button>`).join('')}</div></div>`, {
      onMount: (el, api) => el.addEventListener('click', (e) => {
        const i = e.target.closest('[data-i]')?.dataset.i;
        if (i == null) return;
        picked = items[+i].value; api.close();
      }),
    });
    s.onClose = () => resolve(picked);
  });
}

// ---------- Bilder ----------
const urlCache = new WeakMap();
export function blobUrl(blob) {
  if (!blob) return '';
  if (typeof blob === 'string') return blob;
  let u = urlCache.get(blob);
  if (!u) { u = URL.createObjectURL(blob); urlCache.set(blob, u); }
  return u;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Kunne ikke lese bildet')); };
    img.src = url;
  });
}

export async function resizeImage(file, max = 1400, quality = 0.84) {
  const img = await loadImage(file);
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', quality));
}

export async function makeThumb(blob, max = 520) { return resizeImage(blob, max, 0.8); }

export const blobToDataURL = (blob) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob);
});
export const dataURLToBlob = async (url) => (await fetch(url)).blob();

// Plassholder når bønnen mangler bilde: varm gradient basert på navnet
export function placeholderStyle(seed = '') {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = 18 + (h % 14), hue2 = hue + (h % 8);
  const l = 30 + (h % 12);
  return `background: linear-gradient(135deg, hsl(${hue} 42% ${l}%), hsl(${hue2} 48% 16%));`;
}

// ---------- Konfetti (kaffebønner!) ----------
export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = ['#c8773a', '#e7b169', '#6b4226', '#f3d9b1', '#9b3d68', '#d39a12'];
  const parts = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 15 - 5,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    s: 5 + Math.random() * 6, color: colors[(Math.random() * colors.length) | 0], bean: Math.random() < 0.45,
  }));
  let t = 0;
  const tick = () => {
    t++;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.42; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - t / 110);
      if (p.bean) {
        ctx.fillStyle = '#5a3720'; ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.7, p.s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#c99a6b'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -p.s * 0.8); ctx.quadraticCurveTo(p.s * 0.35, 0, 0, p.s * 0.8); ctx.stroke();
      } else { ctx.fillStyle = p.color; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
      ctx.restore();
    }
    if (t < 115) requestAnimationFrame(tick); else c.remove();
  };
  requestAnimationFrame(tick);
}

// ---------- Formatering ----------
export const fmtNum = (n, d = 1) => (n == null || isNaN(n) ? '–' : Number(n).toFixed(d).replace('.', ','));
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
export const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const parseTime = (str) => {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d+)(?::(\d{1,2}))?$/);
  if (!m) return null;
  return m[2] != null ? +m[1] * 60 + +m[2] : +m[1];
};
export function relDate(d) {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
  if (days <= 0) return 'i dag';
  if (days === 1) return 'i går';
  if (days < 7) return `${days} dager siden`;
  if (days < 30) return `${Math.floor(days / 7)} uke${days >= 14 ? 'r' : ''} siden`;
  return fmtDate(d);
}
export const today = () => new Date().toISOString().slice(0, 10);
