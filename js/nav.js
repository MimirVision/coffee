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
    old.replaceWith(fresh);
    r.fn(...args);
    document.querySelectorAll('.tabbar [data-tab]').forEach((a) => a.classList.toggle('active', a.dataset.tab === r.tab));
    document.body.dataset.tab = r.tab || '';
    const y = keepScroll ? scrolls[hash] ?? 0 : dir === 'back' ? scrolls[hash] ?? 0 : 0;
    window.scrollTo(0, y);
  };
  document.documentElement.dataset.nav = dir;
  if (document.startViewTransition && prev !== null && dir !== 'none' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(run);
  } else run();
}

export function start() {
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
