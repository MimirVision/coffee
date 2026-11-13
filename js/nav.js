// Enkel hash-ruter med tilbake-stack og View Transitions
const stack = [];
let current = null;
let cleanup = null;
const routes = [];
const scrolls = {};

export const onRoute = (re, fn, tab) => routes.push({ re, fn, tab });
export const setCleanup = (fn) => { cleanup = fn; };

export function go(hash, { replace = false } = {}) {
  if (replace) { history.replaceState(null, '', hash); stack[stack.length - 1] = hash; render('forward'); }
  else location.hash = hash;
}

export function back(fallback = '#/') {
  if (stack.length > 1) history.back();
  else go(fallback, { replace: true });
}

export function refresh() { render('none', true); }

function render(dir = 'forward', keepScroll = false) {
  const hash = location.hash || '#/';
  if (current) scrolls[current] = scrollY;
  const prev = current;
  current = hash;
  const r = routes.find((x) => x.re.test(hash)) || routes[0];
  const args = hash.match(r.re)?.slice(1) || [];
  const run = () => {
    try { cleanup?.(); } catch {}
    cleanup = null;
    // Ny #view-node for hver visning, så gamle lyttere forsvinner
    const old = document.getElementById('view');
    const fresh = old.cloneNode(false);
    fresh.removeAttribute('style');
    old.replaceWith(fresh);
    r.fn(...args);
    setupNavbar(hash);
    document.querySelectorAll('.tabbar [data-tab]').forEach((a) => a.classList.toggle('active', a.dataset.tab === r.tab));
    moveIndicator(r.tab);
    document.body.dataset.tab = r.tab || '';
    const y = keepScroll ? scrolls[hash] ?? 0 : dir === 'back' ? scrolls[hash] ?? 0 : 0;
    window.scrollTo(0, y);
  };
  document.documentElement.dataset.nav = dir;
  const skip = skipTransition; skipTransition = false;
  if (!skip && document.startViewTransition && prev !== null && dir !== 'none' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(run);
  } else run();
}

// ---------- iOS-aktig navbar som viser tittelen når den store tittelen scrolles bort ----------
let titleEl = null;
function setupNavbar(hash) {
  const bar = document.getElementById('navbar');
  titleEl = document.querySelector('.page-head .title, .detail-title h1');
  document.getElementById('navTitle').textContent = titleEl?.textContent || '';
  bar.classList.toggle('has-back', hash.startsWith('#/bean/'));
  bar.classList.toggle('over-hero', hash.startsWith('#/bean/'));
  onScroll();
}
let ticking = false;
function onScroll() {
  ticking = false;
  const bar = document.getElementById('navbar');
  const show = titleEl ? titleEl.getBoundingClientRect().bottom < bar.offsetHeight : false;
  bar.classList.toggle('show', show);
}

// ---------- Skjul bunnmenyen når tastaturet er oppe ----------
const isTyping = (el) => el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'button', 'submit', 'file'].includes(el.type)));
document.addEventListener('focusin', (e) => { if (isTyping(e.target)) document.body.classList.add('kb'); });
document.addEventListener('focusout', () => setTimeout(() => { if (!isTyping(document.activeElement)) document.body.classList.remove('kb'); }, 60));

// ---------- Sveip fra venstre kant for å gå tilbake (som i iOS-apper) ----------
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function setupSwipeBack() {
  let sx = null, sy = 0, dx = 0, active = false, el = null;
  const canSwipe = () => stack.length > 1 && (current || '').startsWith('#/bean/') && !document.querySelector('.sheet-wrap');
  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (t.clientX > 28 || !canSwipe()) return;
    sx = t.clientX; sy = t.clientY; dx = 0; active = false;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (sx == null) return;
    const t = e.touches[0];
    dx = Math.max(0, t.clientX - sx);
    if (!active) {
      if (Math.abs(t.clientY - sy) > Math.abs(t.clientX - sx)) { sx = null; return; }
      if (dx < 10) return;
      active = true; el = document.getElementById('view');
      el.style.transition = 'none'; document.body.classList.add('swiping');
    }
    el.style.transform = `translateX(${dx}px)`;
    el.style.boxShadow = '-12px 0 30px rgba(0,0,0,.18)';
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (sx == null) return;
    sx = null;
    if (!active) return;
    const done = dx > innerWidth * 0.33;
    el.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)';
    el.style.transform = done ? 'translateX(100%)' : '';
    document.body.classList.remove('swiping');
    setTimeout(() => {
      if (done) { skipTransition = true; history.back(); }
      else { el.style.transition = ''; el.style.boxShadow = ''; }
    }, 250);
  });
}
let skipTransition = false;

function moveIndicator(tab) {
  const ind = document.querySelector('.tab-ind');
  const a = document.querySelector(`.tabbar [data-tab="${tab}"]`);
  if (!ind) return;
  if (!a || a.classList.contains('fab')) { ind.style.opacity = '0'; return; }
  ind.style.transform = `translateX(${a.offsetLeft}px)`;
  ind.style.opacity = '1';
}

export function start() {
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  document.getElementById('navBack').addEventListener('click', () => back('#/'));
  if (standalone()) setupSwipeBack();
  stack.push(location.hash || '#/');
  window.addEventListener('hashchange', () => {
    const h = location.hash || '#/';
    let dir = 'forward';
    if (stack.length > 1 && stack[stack.length - 2] === h) { stack.pop(); dir = 'back'; }
    else stack.push(h);
    render(dir);
  });
  render('none');
}
