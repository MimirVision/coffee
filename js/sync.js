// Skylagring: speiler alt til et privat GitHub-repo.
//  data.json        – bønner, brygg og slettinger (uten bilder)
//  photos/<hash>.jpg – hvert bilde én gang, navngitt etter innholdet
// Endringer lastes opp fortløpende; ved oppstart hentes og flettes det som ligger i skyen.
import { db } from './db.js';
import { state, LS, onLocalChange } from './store.js';
import { makeThumb } from './ui.js';

const api = () => LS.get('syncApi', 'https://api.github.com');
export const syncConfig = () => LS.get('sync', null); // { repo: 'eier/navn', token }

export const status = { state: syncConfig() ? 'idle' : 'off', at: LS.get('syncAt', 0), error: '' };
const listeners = new Set();
export const onSyncStatus = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
function setStatus(s, extra = {}) {
  status.state = s; status.error = extra.error || '';
  if (s === 'ok') { status.at = Date.now(); LS.set('syncAt', status.at); }
  listeners.forEach((f) => { try { f(status, extra); } catch {} });
}

class SyncError extends Error { constructor(msg, code) { super(msg); this.code = code; } }
function httpError(res) {
  const m = {
    401: 'Nøkkelen er ugyldig eller utløpt – lag en ny og koble til på nytt',
    403: 'Nøkkelen mangler skrivetilgang (Contents: Read and write)',
    404: 'Fant ikke repoet – sjekk navnet og at nøkkelen har tilgang til det',
  };
  return new SyncError(m[res.status] || `GitHub svarte ${res.status}`, res.status);
}

async function gh(path, opts = {}, cfg = syncConfig()) {
  return fetch(`${api()}/repos/${cfg.repo}${path}`, {
    ...opts,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.headers || {}),
    },
  });
}

// ---------- Hjelpere ----------
const hashes = new WeakMap();
async function blobId(blob) {
  let h = hashes.get(blob);
  if (!h) {
    const buf = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    h = [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
    hashes.set(blob, h);
  }
  return h;
}
function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const b64ToBytes = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
// Stabil JSON (sorterte nøkler) for å se om noe faktisk er endret
const stable = (v) => JSON.stringify(v, (k, val) => (val && typeof val === 'object' && !Array.isArray(val)
  ? Object.keys(val).sort().reduce((o, key) => ((o[key] = val[key]), o), {}) : val));
const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const stamp = (x) => x.updatedAt || x.createdAt || 0;

// ---------- GitHub-operasjoner ----------
async function getDoc() {
  const r = await gh('/contents/data.json');
  if (r.status === 404) return { doc: null, sha: null };
  if (!r.ok) throw httpError(r);
  const j = await r.json();
  let text;
  if (j.content) text = new TextDecoder().decode(b64ToBytes(j.content));
  else {
    const raw = await gh('/contents/data.json', { headers: { Accept: 'application/vnd.github.raw+json' } });
    if (!raw.ok) throw httpError(raw);
    text = await raw.text();
  }
  return { doc: JSON.parse(text), sha: j.sha };
}

async function remotePhotoIds() {
  const r = await gh('/contents/photos');
  if (r.status === 404) return new Set();
  if (!r.ok) throw httpError(r);
  const list = await r.json();
  return new Set((Array.isArray(list) ? list : []).map((f) => f.name.replace(/\.jpg$/, '')));
}

async function uploadPhoto(id, blob) {
  const content = bytesToB64(new Uint8Array(await blob.arrayBuffer()));
  const r = await gh(`/contents/photos/${id}.jpg`, { method: 'PUT', body: JSON.stringify({ message: `Bilde ${id}`, content }) });
  if (!r.ok && r.status !== 422) throw httpError(r); // 422 = finnes allerede
}

async function downloadPhoto(id) {
  const r = await gh(`/contents/photos/${id}.jpg`, { headers: { Accept: 'application/vnd.github.raw+json' } });
  if (!r.ok) throw httpError(r);
  const blob = new Blob([await r.arrayBuffer()], { type: 'image/jpeg' });
  hashes.set(blob, id);
  return blob;
}

// ---------- Fletting og opplasting ----------
async function doSync() {
  const { doc, sha } = await getDoc();
  const tombs = { ...((await db.getMeta('tombs')) || {}) };
  let pulled = 0;

  if (doc) {
    for (const [id, t] of Object.entries(doc.tombs || {})) tombs[id] = Math.max(tombs[id] || 0, t);

    for (const rb of doc.beans || []) {
      if ((tombs[rb.id] || 0) >= stamp(rb)) continue;
      const li = state.beans.findIndex((b) => b.id === rb.id);
      const lb = state.beans[li];
      if (lb && stamp(lb) >= stamp(rb)) continue;
      const { photoIds = [], ...rest } = rb;
      const localById = new Map();
      for (const p of lb?.photos || []) localById.set(await blobId(p), p);
      const photos = [];
      for (const pid of photoIds) photos.push(localById.get(pid) || (await downloadPhoto(pid)));
      const sameCover = lb?.photos?.[0] && photos[0] === lb.photos[0];
      const bean = { ...rest, photos, thumb: photos[0] ? (sameCover ? lb.thumb : await makeThumb(photos[0])) : null };
      await db.put('beans', bean);
      if (li >= 0) state.beans[li] = bean; else state.beans.push(bean);
      pulled++;
    }
    for (const rr of doc.brews || []) {
      if ((tombs[rr.id] || 0) >= stamp(rr)) continue;
      const li = state.brews.findIndex((x) => x.id === rr.id);
      if (li >= 0 && stamp(state.brews[li]) >= stamp(rr)) continue;
      await db.put('brews', rr);
      if (li >= 0) state.brews[li] = rr; else state.brews.push(rr);
      pulled++;
    }
  }

  // Bruk slettinger lokalt
  const goneBeans = state.beans.filter((b) => (tombs[b.id] || 0) >= stamp(b)).map((b) => b.id);
  const goneBrews = state.brews.filter((r) => (tombs[r.id] || 0) >= stamp(r)).map((r) => r.id);
  if (goneBeans.length) { state.beans = state.beans.filter((b) => !goneBeans.includes(b.id)); await db.delMany('beans', goneBeans); pulled++; }
  if (goneBrews.length) { state.brews = state.brews.filter((r) => !goneBrews.includes(r.id)); await db.delMany('brews', goneBrews); pulled++; }

  // Lagre gravsteiner (flett med eventuelle nye som kom til underveis)
  const latest = (await db.getMeta('tombs')) || {};
  for (const [id, t] of Object.entries(latest)) tombs[id] = Math.max(tombs[id] || 0, t);
  await db.setMeta('tombs', tombs);

  // Bygg dokumentet som skal ligge i skyen
  const beans = [];
  for (const b of state.beans) {
    const { photos, thumb, ...rest } = b;
    const photoIds = [];
    for (const p of photos || []) photoIds.push(await blobId(p));
    beans.push({ ...rest, photoIds });
  }
  const payload = { beans: beans.sort(byId), brews: [...state.brews].sort(byId), tombs };
  const remote = doc ? { beans: [...(doc.beans || [])].sort(byId), brews: [...(doc.brews || [])].sort(byId), tombs: doc.tombs || {} } : null;
  if (remote && stable(remote) === stable(payload)) return { pulled, pushed: false };

  // Last opp bilder som mangler, deretter dokumentet
  const have = await remotePhotoIds();
  for (const b of beans) {
    const bean = state.beans.find((x) => x.id === b.id);
    for (let i = 0; i < b.photoIds.length; i++) {
      if (!have.has(b.photoIds[i])) { await uploadPhoto(b.photoIds[i], bean.photos[i]); have.add(b.photoIds[i]); }
    }
  }
  const body = { app: 'kaffeloggen', version: 1, savedAt: new Date().toISOString(), ...payload };
  const res = await gh('/contents/data.json', {
    method: 'PUT',
    body: JSON.stringify({
      message: `Synk: ${state.beans.length} bønner, ${state.brews.length} brygg`,
      content: bytesToB64(new TextEncoder().encode(JSON.stringify(body, null, 1))),
      ...(sha ? { sha } : {}),
    }),
  });
  if (res.status === 409 || (res.status === 422 && sha)) return { pulled, pushed: false, conflict: true };
  if (!res.ok) throw httpError(res);
  return { pulled, pushed: true };
}

// ---------- Planlegging ----------
let running = null, again = false, timer = null;

export function requestSync(delay = 2000) {
  if (!syncConfig()) return;
  clearTimeout(timer);
  setStatus('pending');
  timer = setTimeout(() => syncNow(), delay);
}

export async function syncNow() {
  if (!syncConfig()) return null;
  clearTimeout(timer); timer = null;
  if (running) { again = true; return running; }
  if (!navigator.onLine) { setStatus('offline'); return null; }
  running = (async () => {
    setStatus('syncing');
    try {
      let result = await doSync();
      if (result.conflict) result = await doSync(); // noen andre lagret samtidig – prøv på nytt
      setStatus('ok', result);
      return result;
    } catch (e) {
      console.error('Synk feilet', e);
      setStatus('error', { error: e instanceof SyncError ? e.message : 'Fikk ikke kontakt med GitHub – prøver igjen senere' });
      return null;
    } finally {
      running = null;
      if (again) { again = false; requestSync(300); }
    }
  })();
  return running;
}

// Sjekk at repo og nøkkel fungerer før vi lagrer dem
export async function connect(repo, token) {
  repo = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
  token = token.trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new SyncError('Skriv repoet som eier/navn, f.eks. MimirVision/coffee-data');
  if (!token) throw new SyncError('Lim inn nøkkelen');
  const cfg = { repo, token };
  let r;
  try { r = await gh('', {}, cfg); } catch { throw new SyncError('Fikk ikke kontakt med GitHub'); }
  if (!r.ok) throw httpError(r);
  const info = await r.json();
  if (!info.private) throw new SyncError('Repoet er offentlig – bildene og notatene dine ville blitt synlige for alle. Gjør det privat først.');
  LS.set('sync', cfg);
  status.state = 'idle';
  return syncNow();
}

export function disconnect() {
  LS.set('sync', null);
  clearTimeout(timer);
  setStatus('off');
}

// Koble til livssyklusen
onLocalChange(() => requestSync());
window.addEventListener('online', () => requestSync(500));
document.addEventListener('visibilitychange', () => {
  if (!syncConfig()) return;
  if (document.visibilityState === 'hidden' && timer) syncNow(); // tøm køen før appen legges bort
  if (document.visibilityState === 'visible') requestSync(300); // hent endringer fra andre enheter
});
