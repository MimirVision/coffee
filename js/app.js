// Inngangspunkt
import { load, LS } from './store.js';
import { onRoute, start } from './nav.js';
import { renderHome, renderBean } from './views-beans.js';
import { renderForm } from './views-form.js';
import { renderBrew } from './views-brew.js';
import { renderStats } from './views-stats.js';
import { renderSettings, applyTheme } from './views-settings.js';
import { toast } from './ui.js';

applyTheme(LS.get('theme', 'auto'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(LS.get('theme', 'auto')));

onRoute(/^#?\/?$/, renderHome, 'home');
onRoute(/^#\/bean\/([\w-]+)$/, renderBean, 'home');
onRoute(/^#\/new(?:\?.*)?$/, () => renderForm(), 'new');
onRoute(/^#\/edit\/([\w-]+)$/, (id) => renderForm(id), 'new');
onRoute(/^#\/stats$/, renderStats, 'stats');
onRoute(/^#\/brew(?:\?.*)?$/, renderBrew, 'brew');
onRoute(/^#\/settings$/, renderSettings, 'settings');

(async () => {
  try { await load(); } catch (e) { console.error(e); toast('Kunne ikke åpne lagringen på denne enheten'); }
  start();
  document.body.classList.add('ready');
})();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw?.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Ny versjon klar', { action: 'Oppdater', duration: 10000, onAction: () => location.reload() });
          }
        });
      });
    }).catch(() => {});
  });
}
