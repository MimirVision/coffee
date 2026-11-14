// Innstillinger: tema, sikkerhetskopi, lagring, installasjon
import { state, LS, clearAll, markChanged } from './store.js';
import { syncConfig, status as syncStatus, onSyncStatus, connect, disconnect, syncNow } from './sync.js';
import { db } from './db.js';
import { $, esc, icon, toast, confirmSheet, blobToDataURL, dataURLToBlob, haptic } from './ui.js';
import { methodName, ROAST_LEVELS, STATUSES, METHODS } from './data.js';
import { refresh, setCleanup } from './nav.js';
import { loadSamples } from './samples.js';

const view = () => $('#view');
export const VERSION = '1.3.0';

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });

export function applyTheme(t) {
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme'); else root.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#16110e' : '#f6efe6');
}

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;

async function download(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return true; } catch (e) { if (e.name === 'AbortError') return false; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

export async function exportJSON() {
  toast('Pakker sikkerhetskopi…');
  const beans = await Promise.all(state.beans.map(async (b) => ({
    ...b,
    photos: await Promise.all((b.photos || []).map(blobToDataURL)),
    thumb: b.thumb ? await blobToDataURL(b.thumb) : null,
  })));
  const data = { app: 'kaffeloggen', version: 1, exportedAt: new Date().toISOString(), beans, brews: state.brews };
  const stamp = new Date().toISOString().slice(0, 10);
  const ok = await download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `kaffeloggen-${stamp}.json`);
  if (ok) { LS.set('lastBackup', Date.now()); toast('Sikkerhetskopi lagret ✓'); }
  refresh();
}

function exportCSV() {
  const cols = [['Navn', 'name'], ['Brenneri', 'roaster'], ['Status', (b) => STATUSES[b.status]?.label], ['Karakter', 'rating'], ['Land', 'country'], ['Region', 'region'], ['Gård', 'farm'], ['Varietet', 'variety'], ['Prosess', 'process'], ['Høyde', 'altitude'], ['Brenning', (b) => ROAST_LEVELS[b.roastLevel] || ''], ['Brennedato', 'roastDate'], ['Pris', 'price'], ['Vekt', 'weight'], ['Kjøpt hos', 'shop'], ['Smaksnoter', (b) => (b.notes || []).join(', ')], ['Metoder', (b) => (b.methods || []).map(methodName).join(', ')], ['Favoritt', (b) => (b.favorite ? 'Ja' : '')], ['Kjøper igjen', (b) => (b.buyAgain ? 'Ja' : '')], ['Notater', 'description'], ['Lagt til', (b) => new Date(b.createdAt).toISOString().slice(0, 10)]];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [cols.map((c) => cell(c[0])).join(';'), ...state.beans.map((b) => cols.map(([, k]) => cell(typeof k === 'function' ? k(b) : b[k])).join(';'))];
  download(new Blob(['﻿' + rows.join('\n')], { type: 'text/csv' }), 'kaffeloggen.csv');
}

async function importJSON(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('Filen kunne ikke leses'); return; }
  if (data?.app !== 'kaffeloggen' || !Array.isArray(data.beans)) { toast('Dette ser ikke ut som en Kaffeloggen-backup'); return; }
  const ok = await confirmSheet({ title: 'Importere sikkerhetskopi?', text: `${data.beans.length} bønner og ${data.brews?.length || 0} brygg. Bønner som allerede finnes blir oppdatert, resten beholdes.`, ok: 'Importer' });
  if (!ok) return;
  const beans = await Promise.all(data.beans.map(async (b) => ({
    ...b,
    photos: await Promise.all((b.photos || []).map(dataURLToBlob)),
    thumb: b.thumb ? await dataURLToBlob(b.thumb) : null,
  })));
  await db.putMany('beans', beans);
  if (data.brews?.length) await db.putMany('brews', data.brews);
  state.beans = await db.all('beans'); state.brews = await db.all('brews');
  markChanged();
  haptic([10, 30, 10]);
  toast(`Importerte ${beans.length} bønner ☕`);
  refresh();
}

export function syncLine(s = syncStatus) {
  const time = s.at ? new Date(s.at).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return {
    off: ['off', 'Av'],
    idle: ['ok', time ? `Lagret i skyen ${time}` : 'Tilkoblet'],
    ok: ['ok', `Alt er lagret i skyen · ${time}`],
    pending: ['busy', 'Lagrer straks…'],
    syncing: ['busy', 'Synkroniserer…'],
    offline: ['warn', 'Ingen nett – lagres når du er på nett igjen'],
    error: ['warn', s.error || 'Noe gikk galt'],
  }[s.state] || ['ok', ''];
}

function cloudSection() {
  const cfg = syncConfig();
  if (cfg) {
    const [cls, txt] = syncLine();
    return `<section class="section"><h2>Skylagring</h2>
      <div class="list">
        <div class="list-item static">${icon('cloud')}<div><strong>${esc(cfg.repo)}</strong><span class="sync-line ${cls}" id="syncLine">${esc(txt)}</span></div></div>
        <button class="list-item" id="syncNow">${icon('repeat')}<div><strong>Synkroniser nå</strong><span>Skjer ellers automatisk ved hver endring</span></div></button>
        <button class="list-item danger" id="syncOff">${icon('close')}<div><strong>Koble fra</strong><span>Dataene blir liggende både her og i repoet</span></div></button>
      </div></section>`;
  }
  return `<section class="section"><h2>Skylagring</h2>
    <div class="form-card cloud-setup">
      <p class="small">Slå på, så lagres alt – bønner, bilder og brygg – fortløpende i et <b>privat GitHub-repo</b>. Sletter du appen eller bytter telefon, kobler du bare til igjen og får alt tilbake.</p>
      <ol class="small setup-steps">
        <li><a class="link" href="https://github.com/new?name=coffee-data&visibility=private" target="_blank" rel="noopener">Lag et privat repo</a> som heter f.eks. <b>coffee-data</b>.</li>
        <li><a class="link" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Lag en nøkkel</a> (fine-grained token): velg <i>Only select repositories</i> → coffee-data, og gi <b>Contents: Read and write</b>. Velg lengst mulig utløpstid.</li>
        <li>Lim inn under. Ta vare på nøkkelen i passordbehandleren din – den trengs hvis du installerer appen på nytt.</li>
      </ol>
      <label class="field"><span>Repo</span><input id="syncRepo" placeholder="MimirVision/coffee-data" autocapitalize="off" autocorrect="off" spellcheck="false" value="${esc(LS.get('syncRepoDraft', ''))}"></label>
      <label class="field"><span>Nøkkel</span><input id="syncToken" type="password" placeholder="github_pat_…" autocapitalize="off" autocorrect="off" spellcheck="false"></label>
      <button class="btn btn-primary btn-block" id="syncConnect">${icon('cloud')} Koble til og synkroniser</button>
    </div></section>`;
}

export async function renderSettings() {
  const theme = LS.get('theme', 'auto');
  const last = LS.get('lastBackup', null);
  view().innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Kaffeloggen</p><h1 class="title">Innstillinger</h1></div></header>

    ${!standalone() ? `<section class="form-card install">
      <div class="install-icon"><img src="icons/icon-192.png" alt=""></div>
      <div><strong>Installer appen</strong><p class="muted small">${installPrompt ? 'Legg Kaffeloggen på hjemskjermen for rask tilgang – fungerer helt offline.' : isIOS() ? 'Trykk på Del-knappen <b>⎋</b> i Safari og velg <b>«Legg til på Hjem-skjerm»</b>.' : 'Bruk nettleserens meny og velg «Installer app» eller «Legg til på startskjermen».'}</p>
      ${installPrompt ? '<button class="btn btn-primary btn-sm" id="installBtn">Installer</button>' : ''}</div>
    </section>` : ''}

    ${cloudSection()}

    <section class="section"><h2>Utseende</h2>
      <div class="segmented" id="theme">${[['auto', 'Auto'], ['light', 'Lys'], ['dark', 'Mørk']].map(([k, l]) => `<button data-v="${k}" class="${theme === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    </section>

    <section class="section"><h2>Brygging</h2>
      <div class="list"><label class="list-item select-item">${icon('cup')}<div><strong>Standard bryggemetode</strong><span>Brukes i Brygg-fanen og når du logger brygg</span></div>
        <select id="defMethod">${METHODS.map((m) => `<option value="${m.id}" ${m.id === LS.get('defaultMethod', 'espresso') ? 'selected' : ''}>${m.name}</option>`).join('')}</select></label></div>
    </section>

    <section class="section"><h2>Sikkerhetskopi</h2>
      <p class="muted small">${syncConfig() ? 'Skylagring er på, så dette trengs egentlig ikke – men en ekstra kopi skader aldri.' : 'Uten skylagring ligger alt bare på denne enheten. Ta en sikkerhetskopi innimellom – særlig før du bytter telefon.'}${isIOS() && !syncConfig() ? ' På iPhone har Safari og appen på hjemskjermen <b>hver sin lagring</b>, og fjerner du ikonet fra hjemskjermen, slettes dataene.' : ''}${last ? ` Sist: <b>${new Date(last).toLocaleDateString('nb-NO')}</b>.` : ' <b>Du har ikke tatt noen ennå.</b>'}</p>
      <div class="list">
        <button class="list-item" id="exp">${icon('download')}<div><strong>Eksporter backup</strong><span>JSON med alle bilder og brygg</span></div></button>
        <button class="list-item" id="imp">${icon('upload')}<div><strong>Importer backup</strong><span>Gjenopprett fra en JSON-fil</span></div></button>
        <button class="list-item" id="csv">${icon('chart')}<div><strong>Eksporter til regneark</strong><span>CSV for Excel / Numbers</span></div></button>
      </div>
      <input type="file" id="impFile" accept="application/json,.json" hidden>
    </section>

    <section class="section"><h2>Lagring</h2>
      <div class="list"><div class="list-item static">${icon('info')}<div><strong id="usage">Beregner…</strong><span id="persist"></span></div></div></div>
    </section>

    <section class="section"><h2>Data</h2>
      <div class="list">
        <button class="list-item" id="samples">${icon('sparkle')}<div><strong>Legg til eksempeldata</strong><span>Fem bønner å leke med</span></div></button>
        <button class="list-item danger" id="wipe">${icon('trash')}<div><strong>Slett alt</strong><span>Fjerner alle bønner, bilder og brygg</span></div></button>
      </div>
    </section>

    <p class="muted small center about">${icon('beans')}<br>Kaffeloggen ${VERSION}<br>Laget for kaffenerder. Fungerer offline.</p>`;

  $('#theme').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    LS.set('theme', b.dataset.v); applyTheme(b.dataset.v); haptic(4);
    [...$('#theme').children].forEach((c) => c.classList.toggle('on', c === b));
  });
  $('#syncConnect')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget; const repo = $('#syncRepo').value;
    LS.set('syncRepoDraft', repo.trim());
    btn.disabled = true; btn.textContent = 'Kobler til…';
    try {
      const res = await connect(repo, $('#syncToken').value);
      haptic([10, 30, 10]);
      if (syncStatus.state === 'error') toast(syncStatus.error);
      else toast(res?.pulled ? 'Tilkoblet – hentet bønnene dine fra skyen ☁️' : 'Tilkoblet – alt lagres nå i skyen ☁️');
      refresh();
    } catch (err) {
      toast(err.message || 'Kunne ikke koble til'); haptic([20, 40, 20]);
      btn.disabled = false; btn.innerHTML = `${icon('cloud')} Koble til og synkroniser`;
    }
  });
  $('#syncNow')?.addEventListener('click', async () => { haptic(6); await syncNow(); if (syncStatus.state === 'error') toast(syncStatus.error); });
  $('#syncOff')?.addEventListener('click', async () => {
    if (!(await confirmSheet({ title: 'Koble fra skylagring?', text: 'Nye endringer lagres da bare på denne telefonen. Det som allerede ligger i repoet, blir liggende.', ok: 'Koble fra', danger: true }))) return;
    disconnect(); refresh();
  });
  setCleanup(onSyncStatus((s) => {
    const el = $('#syncLine'); if (!el) return;
    const [cls, txt] = syncLine(s); el.className = `sync-line ${cls}`; el.textContent = txt;
  }));

  $('#defMethod').addEventListener('change', (e) => { LS.set('defaultMethod', e.target.value); haptic(4); toast(`${methodName(e.target.value)} er nå standard`); });
  $('#installBtn')?.addEventListener('click', async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; refresh(); });
  $('#exp').onclick = () => (state.beans.length ? exportJSON() : toast('Ingenting å eksportere ennå'));
  $('#csv').onclick = () => (state.beans.length ? exportCSV() : toast('Ingenting å eksportere ennå'));
  $('#imp').onclick = () => $('#impFile').click();
  $('#impFile').onchange = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importJSON(f); };
  $('#samples').onclick = async () => { await loadSamples(); toast('Eksempeldata lagt til'); location.hash = '#/'; };
  $('#wipe').onclick = async () => {
    if (!(await confirmSheet({ title: 'Slette alt?', text: `${state.beans.length} bønner og ${state.brews.length} brygg slettes permanent${syncConfig() ? ', også i skylagringen' : ''}. Dette kan ikke angres.`, ok: 'Slett alt', danger: true }))) return;
    await clearAll(); toast('Alt er slettet'); refresh();
  };

  try {
    const est = await navigator.storage?.estimate?.();
    const persisted = await navigator.storage?.persisted?.();
    const mb = (n) => `${(n / 1048576).toFixed(1).replace('.', ',')} MB`;
    $('#usage').textContent = est ? `${mb(est.usage || 0)} brukt · ${state.beans.length} bønner` : `${state.beans.length} bønner`;
    $('#persist').innerHTML = persisted ? 'Varig lagring er aktivert ✓' : 'Nettleseren kan rydde data ved lite plass. <button class="link" id="persistBtn">Be om varig lagring</button>';
    $('#persistBtn')?.addEventListener('click', async () => {
      const ok = await navigator.storage.persist();
      toast(ok ? 'Varig lagring aktivert ✓' : 'Nettleseren sa nei – installer appen og prøv igjen');
      refresh();
    });
  } catch { $('#usage').textContent = `${state.beans.length} bønner`; }
}
