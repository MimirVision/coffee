// Statistikk og innsikt
import { state, brewsFor } from './store.js';
import { $, esc, icon, stars, radar, fmtNum, blobUrl } from './ui.js';
import { flag, tagColor, tagCategory, PROFILE_AXES, ROAST_LEVELS, methodName } from './data.js';
import { cover, cupArt } from './views-beans.js';

const view = () => $('#view');

function countBy(list, fn) {
  const m = new Map();
  list.forEach((x) => { const keys = [].concat(fn(x)).filter((k) => k !== '' && k != null); keys.forEach((k) => m.set(k, [...(m.get(k) || []), x])); });
  return [...m.entries()].map(([k, items]) => {
    const rated = items.filter((i) => i.rating);
    return { key: k, n: items.length, avg: rated.length ? rated.reduce((s, i) => s + i.rating, 0) / rated.length : 0 };
  }).sort((a, b) => b.n - a.n || b.avg - a.avg);
}

function bars(rows, { label = (r) => esc(r.key), max = 6 } = {}) {
  const top = rows.slice(0, max);
  const peak = Math.max(...top.map((r) => r.n), 1);
  return `<div class="bars">${top.map((r) => `<div class="bar-row" title="${esc(r.key)}: ${r.n} ${r.n === 1 ? 'bønne' : 'bønner'}${r.avg ? `, snitt ${fmtNum(r.avg)}` : ''}">
    <span class="bar-label">${label(r)}</span>
    <span class="bar-track"><span class="bar-fill" style="width:${(r.n / peak) * 100}%"></span></span>
    <span class="bar-val">${r.n}${r.avg ? `<small>★ ${fmtNum(r.avg)}</small>` : ''}</span>
  </div>`).join('')}</div>`;
}

function insight(beans) {
  const loved = beans.filter((b) => b.rating >= 4);
  if (loved.length < 2) return '';
  const c = countBy(loved, (b) => b.country)[0];
  const p = countBy(loved, (b) => b.process)[0];
  const cats = countBy(loved, (b) => [...new Set((b.notes || []).map(tagCategory))]).filter((x) => x.key !== 'Annet').slice(0, 2);
  const parts = [];
  if (p && p.n >= 2) parts.push(`<b>${esc(p.key.toLowerCase())}</b>-prosesserte bønner`); else parts.push('bønner');
  if (c && c.n >= 2) parts.push(`fra <b>${flag(c.key)} ${esc(c.key)}</b>`);
  if (cats.length) parts.push(`med <b>${cats.map((x) => esc(x.key.toLowerCase())).join('</b> og <b>')}</b>-noter`);
  if (parts.length < 2) return '';
  return `<div class="insight">${icon('sparkle')}<p>Du ser ut til å elske ${parts.join(' ')}.</p></div>`;
}

export function renderStats() {
  const beans = state.beans.filter((b) => b.status !== 'wishlist');
  if (!beans.length) {
    view().innerHTML = `<header class="page-head"><div><p class="eyebrow">Innsikt</p><h1 class="title">Statistikk</h1></div></header>
      <div class="empty"><div class="empty-art">${cupArt()}</div><h2>Ingen data ennå</h2><p>Logg noen bønner, så dukker smaksmønstrene dine opp her.</p><a class="btn btn-primary" href="#/new">${icon('plus')} Legg til bønne</a></div>`;
    return;
  }
  const rated = beans.filter((b) => b.rating);
  const avg = rated.length ? rated.reduce((s, b) => s + b.rating, 0) / rated.length : 0;
  const countries = countBy(beans, (b) => b.country);
  const processes = countBy(beans, (b) => b.process);
  const roasters = countBy(beans, (b) => b.roaster);
  const varieties = countBy(beans, (b) => b.variety);
  const notes = countBy(beans, (b) => b.notes || []);
  const methods = countBy(state.brews, (r) => r.method);
  const top = [...rated].sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt).slice(0, 5);
  const spent = beans.reduce((s, b) => s + (+b.price || 0), 0);
  const grams = state.brews.reduce((s, r) => s + (+r.dose || 0), 0);

  // Karakterfordeling 0.5–5
  const dist = [1, 2, 3, 4, 5].map((s) => ({ s, n: rated.filter((b) => Math.ceil(b.rating) === s).length }));
  const dmax = Math.max(...dist.map((d) => d.n), 1);

  // Gjennomsnittsprofil for favoritter (≥ 4) vs alle
  const withProf = beans.filter((b) => b.profile);
  const avgProfile = (list) => list.length ? Object.fromEntries(PROFILE_AXES.map(([k]) => [k, list.reduce((s, b) => s + (b.profile[k] || 0), 0) / list.length])) : null;
  const lovedProf = avgProfile(withProf.filter((b) => b.rating >= 4));
  const allProf = avgProfile(withProf);

  const roastRows = ROAST_LEVELS.map((l, i) => ({ key: l, ...(countBy(beans.filter((b) => b.roastLevel === i), () => l)[0] || { n: 0, avg: 0 }) })).filter((r) => r.n);

  view().innerHTML = `
    <header class="page-head"><div><p class="eyebrow">Innsikt</p><h1 class="title">Statistikk</h1></div></header>
    <div class="tiles">
      <div class="tile accent"><strong>${beans.length}</strong><span>bønner smakt</span></div>
      <div class="tile"><strong>${countries.length}</strong><span>land</span></div>
      <div class="tile"><strong>${avg ? fmtNum(avg) : '–'}</strong><span>snittkarakter</span></div>
      <div class="tile"><strong>${state.brews.length}</strong><span>brygg logget</span></div>
      <div class="tile"><strong>${roasters.length}</strong><span>brennerier</span></div>
      <div class="tile"><strong>${grams >= 1000 ? fmtNum(grams / 1000) + ' kg' : Math.round(grams) + ' g'}</strong><span>kaffe brygget</span></div>
    </div>
    ${insight(beans)}

    ${top.length ? `<section class="section"><h2>Toppliste</h2><div class="podium">${top.map((b, i) => `
      <a class="rank" href="#/bean/${b.id}"><span class="rank-n">${i + 1}</span><div class="rank-img">${cover(b)}</div>
      <div class="rank-info"><strong>${esc(b.name)}</strong><span class="muted">${esc([b.roaster, b.country].filter(Boolean).join(' · '))}</span></div>
      <span class="rank-score">${fmtNum(b.rating)}</span></a>`).join('')}</div></section>` : ''}

    ${lovedProf || allProf ? `<section class="section"><h2>Din smaksprofil</h2>
      <p class="muted small">${lovedProf ? 'Snittprofilen til bønnene du ga 4+ (fylt) mot alle bønner (stiplet).' : 'Snittprofilen til alle bønnene dine.'}</p>
      <div class="radar-wrap">${radar(lovedProf || allProf, PROFILE_AXES, { compare: lovedProf ? allProf : null })}</div></section>` : ''}

    ${rated.length ? `<section class="section"><h2>Karakterfordeling</h2><div class="dist">${dist.map((d) => `<div class="dist-col" title="${d.n} bønner"><span class="dist-n">${d.n || ''}</span><span class="dist-bar" style="height:${(d.n / dmax) * 100}%"></span><span class="dist-l">${d.s}★</span></div>`).join('')}</div></section>` : ''}

    ${notes.length ? `<section class="section"><h2>Vanligste smaksnoter</h2><div class="tags cloud">${notes.slice(0, 24).map((t) => `<span class="tag" style="--c:${tagColor(t.key)};font-size:${0.82 + Math.min(t.n, 6) * 0.07}rem">${esc(t.key)} <small>${t.n}</small></span>`).join('')}</div></section>` : ''}
    ${countries.length ? `<section class="section"><h2>Land</h2>${bars(countries, { label: (r) => `${flag(r.key)} ${esc(r.key)}`, max: 8 })}</section>` : ''}
    ${processes.length ? `<section class="section"><h2>Prosess</h2>${bars(processes)}</section>` : ''}
    ${roastRows.length ? `<section class="section"><h2>Brenningsgrad</h2>${bars(roastRows)}</section>` : ''}
    ${roasters.length ? `<section class="section"><h2>Brennerier</h2>${bars(roasters)}</section>` : ''}
    ${varieties.length ? `<section class="section"><h2>Varieteter</h2>${bars(varieties)}</section>` : ''}
    ${methods.length ? `<section class="section"><h2>Bryggemetoder</h2>${bars(methods.map((m) => ({ ...m, key: methodName(m.key) })))}</section>` : ''}
    ${spent ? `<p class="muted small center">Totalt brukt på bønner: <b>${Math.round(spent).toLocaleString('nb-NO')} kr</b></p>` : ''}
  `;
}
