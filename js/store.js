// Applikasjonstilstand i minnet, speilet til IndexedDB
import { db } from './db.js';
import { uid, makeThumb } from './ui.js';

export const state = { beans: [], brews: [] };

export const LS = {
  get(k, d) { try { const v = localStorage.getItem('kl:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kl:' + k, JSON.stringify(v)); } catch {} },
};

export async function load() {
  const [beans, brews] = await Promise.all([db.all('beans'), db.all('brews')]);
  state.beans = beans; state.brews = brews;
}

export const beanById = (id) => state.beans.find((b) => b.id === id);
export const brewsFor = (id) => state.brews.filter((r) => r.beanId === id).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.createdAt - a.createdAt);

export function remaining(bean) {
  if (!bean.weight) return null;
  const used = brewsFor(bean.id).filter((r) => !bean.openedAt || r.createdAt >= bean.openedAt).reduce((s, r) => s + (+r.dose || 0), 0);
  return Math.max(0, bean.weight - used);
}

export async function saveBean(bean) {
  const now = Date.now();
  if (!bean.id) { bean.id = uid(); bean.createdAt = now; }
  bean.updatedAt = now;
  const prev = beanById(bean.id);
  if (bean.photos?.length) {
    if (!bean.thumb || !prev || prev.photos?.[0] !== bean.photos[0]) bean.thumb = await makeThumb(bean.photos[0]);
  } else bean.thumb = null;
  await db.put('beans', bean);
  if (prev) Object.assign(prev, bean); else state.beans.push(bean);
  if (state.beans.length === 1) navigator.storage?.persist?.();
  return bean;
}

export async function patchBean(id, patch) {
  const b = beanById(id);
  Object.assign(b, patch, { updatedAt: Date.now() });
  await db.put('beans', b);
  return b;
}

export async function deleteBean(id) {
  const bean = beanById(id);
  const brews = brewsFor(id);
  state.beans = state.beans.filter((b) => b.id !== id);
  state.brews = state.brews.filter((r) => r.beanId !== id);
  await db.del('beans', id);
  await db.delMany('brews', brews.map((r) => r.id));
  return async () => { // angre
    state.beans.push(bean); state.brews.push(...brews);
    await db.put('beans', bean); await db.putMany('brews', brews);
  };
}

export async function saveBrew(brew) {
  if (!brew.id) { brew.id = uid(); brew.createdAt = Date.now(); }
  const i = state.brews.findIndex((r) => r.id === brew.id);
  if (i >= 0) state.brews[i] = brew; else state.brews.push(brew);
  await db.put('brews', brew);
  return brew;
}

export async function deleteBrew(id) {
  const brew = state.brews.find((r) => r.id === id);
  state.brews = state.brews.filter((r) => r.id !== id);
  await db.del('brews', id);
  return async () => { state.brews.push(brew); await db.put('brews', brew); };
}

export async function clearAll() {
  await db.clear('beans'); await db.clear('brews');
  state.beans = []; state.brews = [];
}

export const uniq = (key) => [...new Set(state.beans.map((b) => b[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nb'));
