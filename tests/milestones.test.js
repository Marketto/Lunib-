import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { monthsAt } from '../src/lib/growth.js';
import { status, isRelevant, isPast, split, ageForMilestones, position, RULES, warnPoint, AREAS, TYPES } from '../src/lib/milestones.js';
import { mergeData, buildPayload, buildQuickPayload } from '../src/lib/sync.js';
import { initialFromImport } from '../src/lib/onboard.js';
import DATA from '../content/milestones.json';
import SOURCES from '../content/sources.json';

const who = { id: 'a', area: 'motor', from: 8, to: 18, type: 'who-1-99', warn: true, src: ['A23'] };   // watch a 15,5
const cdc = { id: 'c', area: 'language', from: 4, to: 6, type: 'cdc-75pct', warn: true, src: ['TP2', 'A24'] };
const gl = (id, from, to, at, level) => ({ id, area: 'feeding', from, to, type: 'guideline-range', warn: true, src: ['TP4'], note: { at, level, it: 'x', ru: 'y' } });
const info = { id: 'b', area: 'motor', from: 5, to: null, type: 'who-1-99', warn: false, src: ['A23'] };
const real = (id) => DATA.items.find((i) => i.id === id);

describe('status()', () => {
  it('who-1-99: from, watch al 75%, late solo dopo to, done', () => {
    expect(status(who, 7.99)).toBe('upcoming');
    expect(status(who, 8)).toBe('now');
    expect(status(who, 15.49)).toBe('now');
    expect(status(who, 15.5)).toBe('watch');
    expect(status(who, 18)).toBe('watch');
    expect(status(who, 18.01)).toBe('late');
    expect(status(who, 30, true)).toBe('done');
    expect(status(who, 2, true)).toBe('done');
  });
  it('cdc-75pct: nessun avviso prima di to, late da to', () => {
    expect(status(cdc, 4)).toBe('now');
    expect(status(cdc, 5.5)).toBe('now');
    expect(status(cdc, 5.99)).toBe('now');
    expect(status(cdc, 6)).toBe('late');
    expect(warnPoint(cdc)).toBe(null);
  });
  it('guideline-range: promemoria da note.at, tip o talk', () => {
    const t = gl('t', 4, 6, 6, 'talk');
    expect(status(t, 5.9)).toBe('now');
    expect(status(t, 6)).toBe('late');
    const tip = gl('u', 12, 18, 18, 'tip');
    expect(status(tip, 17.9)).toBe('now');
    expect(status(tip, 18)).toBe('tip');
  });
  it('voci reali: f-start a 6,5, d-visit a 12, t-day/t-night a 60', () => {
    expect(status(real('f-start'), 6.4)).toBe('now');
    expect(status(real('f-start'), 6.5)).toBe('late');
    expect(status(real('d-visit'), 11.9)).toBe('now');
    expect(status(real('d-visit'), 12)).toBe('late');
    expect(status(real('f-bottle'), 19)).toBe('tip');
    expect(status(real('t-day'), 59.9)).toBe('now');
    expect(status(real('t-day'), 60)).toBe('late');
    expect(status(real('t-night'), 59.9)).toBe('now');
    expect(status(real('t-night'), 60)).toBe('tip');
  });
  it('voci senza avviso: info dopo from, mai late', () => {
    expect(status(info, 4)).toBe('upcoming');
    expect(status(info, 5)).toBe('info');
    expect(status(info, 99)).toBe('info');
    expect(status({ ...who, warn: false }, 40)).toBe('info');
  });
  it('il punto di avviso segue RULES', () => {
    const saved = RULES['who-1-99'].warnAt;
    RULES['who-1-99'].warnAt = 0.5;
    expect(warnPoint(who)).toBe(13);
    expect(status(who, 13)).toBe('watch');
    RULES['who-1-99'].warnAt = saved;
    expect(status(who, 13)).toBe('now');
  });
  it('età corretta negativa: in arrivo', () => expect(status(who, -1)).toBe('upcoming'));
});

describe('rilevanza e tappe passate', () => {
  it('attive da from-3 fino a 3 mesi dopo to', () => {
    expect(isRelevant(who, 4.9)).toBe(false);
    expect(isRelevant(who, 5)).toBe(true);
    expect(isRelevant(who, 21)).toBe(true);
    expect(isRelevant(who, 21.1)).toBe(false);
    expect(isPast(who, 21)).toBe(false);
    expect(isPast(who, 21.1)).toBe(true);
  });
  it('senza to: visibile fino a 12 mesi dopo from', () => {
    expect(isRelevant(info, 17)).toBe(true);
    expect(isRelevant(info, 17.01)).toBe(false);
    expect(isPast(info, 99)).toBe(false);
  });
  it('split: passate non fatte separate; fatte nelle conquiste', () => {
    const r = split([who, info, cdc], 40, new Set(['a']));
    expect(r.done.map((x) => x.id)).toEqual(['a']);
    expect(r.active).toEqual([]);
    expect(r.past.map((x) => x.id)).toEqual(['c']);
    expect(split([who, cdc], 40, new Set(['a', 'c'])).past).toEqual([]);
  });
  it('installazione nuova a 4 anni: nessuna voce con to passato da >3 mesi è attiva', () => {
    const r = split(DATA.items, 48, new Set());
    for (const i of r.active) expect(i.to == null || i.to + 3 >= 48).toBe(true);
    expect(r.past.length).toBeGreaterThan(5);
  });
  it('posizione limitata a 0..1', () => {
    expect(position(who, 0)).toBe(0);
    expect(position(who, 13)).toBe(0.5);
    expect(position(who, 99)).toBe(1);
    expect(position(info, 9)).toBe(null);
  });
});

describe('età corretta', () => {
  it('pretermine: corretta fino a 24 mesi (anche 32-36 settimane); a termine: cronologica', () => {
    const kid = { birth: '2026-01-01', gaWeeks: 30 };
    const d = '2026-07-01';
    const plain = ageForMilestones({ birth: '2026-01-01' }, d);
    expect(plain).toBeGreaterThan(5.9);
    expect(ageForMilestones(kid, d)).toBeCloseTo(plain - (10 * 7) / 30.4375, 5);
    expect(ageForMilestones({ ...kid, gaWeeks: 38 }, '2026-12-01')).toBeGreaterThan(10);
    const k34 = { birth: '2024-01-01', gaWeeks: 34 };
    expect(ageForMilestones(k34, '2025-06-01')).toBeCloseTo(monthsAt('2024-01-01', '2025-06-01') - (6 * 7) / 30.4375, 5);  // 17 mesi, oltre i 12 della crescita
    expect(ageForMilestones(k34, '2026-02-01')).toBe(monthsAt('2024-01-01', '2026-02-01'));                                   // >24 mesi
  });
  it('gaWeeks assente: età cronologica, mai NaN', () => {
    expect(Number.isNaN(ageForMilestones({ birth: '2025-01-01' }, '2026-01-01'))).toBe(false);
  });
});

describe('sync con tappe', () => {
  const rec = { id: 'k:a', kidId: 'k', item: 'a', date: '2026-10-01', updatedAt: '2026-11-01T00:00:00Z' };
  const L = { kids: [{ id: 'k', birth: '2025-01-01' }], growth: [], meds: [], medPlans: [], milestones: [rec], deleted: {} };
  it('unisce, aggiorna col più recente, applica lapidi', () => {
    const newer = { ...rec, date: '2026-10-05', updatedAt: '2026-11-02T00:00:00Z' };
    const other = { id: 'k:b', kidId: 'k', item: 'b', date: '2026-10-02', updatedAt: '2026-11-02T00:00:00Z' };
    const m = mergeData(L, { kids: L.kids, milestones: [newer, other], deleted: {} });
    expect(m.milestones).toHaveLength(2);
    expect(m.milestones.find((x) => x.id === 'k:a').date).toBe('2026-10-05');
    expect(mergeData(L, { kids: L.kids, milestones: [{ ...rec, date: 'x', updatedAt: '2026-10-01T00:00:00Z' }], deleted: {} }).milestones[0].date).toBe('2026-10-01');
    expect(mergeData(L, { kids: L.kids, deleted: { 'k:a': '2026-11-05T00:00:00Z' } }).milestones).toHaveLength(0);
  });
  it('bimbo con id diverso ma stessa nascita: l\'id della tappa segue il bimbo', () => {
    const m = mergeData(L, { kids: [{ id: 'z', birth: '2025-01-01' }], milestones: [{ id: 'z:b', kidId: 'z', item: 'b', date: '2026-10-02', updatedAt: '2026-11-02T00:00:00Z' }], deleted: {} });
    expect(m.milestones.map((x) => x.id).sort()).toEqual(['k:a', 'k:b']);
  });
  it('payload completo, rapido e onboarding', () => {
    expect(buildPayload(L).milestones).toHaveLength(1);
    const q = buildQuickPayload({ ...L, milestones: [{ ...rec, updatedAt: new Date().toISOString() }] });
    expect(q.milestones).toHaveLength(1);
    expect(q.kids.map((k) => k.id)).toEqual(['k']);
    expect(initialFromImport(L).milestones).toHaveLength(1);
    expect(initialFromImport({ kids: L.kids }).milestones).toEqual([]);
  });
});

describe('content/milestones.json', () => {
  const ids = DATA.items.map((i) => i.id);
  it('coerente: id unici, fonti, finestre, aree, it/ru', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of DATA.items) {
      expect(AREAS).toContain(i.area);
      expect(TYPES).toContain(i.type);
      expect(i.verified).toBe(true);
      expect(JSON.stringify(i)).not.toMatch(/da verificare|нужно сверить/);
      if (i.note) { expect(['tip', 'talk']).toContain(i.note.level); expect(i.note.at).toBeGreaterThanOrEqual(i.from); expect(i.note.it && i.note.ru).toBeTruthy(); }
      if (i.to != null) expect(i.from).toBeLessThan(i.to);
      expect(i.src.length).toBeGreaterThan(0);
      for (const s of i.src) expect(SOURCES[s]).toBeTruthy();
      expect(i.it.title && i.ru.title).toBeTruthy();
      expect(!!i.it.info).toBe(!!i.ru.info);
    }
  });
  it('la validazione di build-content rifiuta dati errati', () => {
    const root = path.resolve(__dirname, '..');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ms-'));
    fs.cpSync(path.join(root, 'content'), path.join(tmp, 'content'), { recursive: true });
    fs.cpSync(path.join(root, 'scripts'), path.join(tmp, 'scripts'), { recursive: true });
    fs.symlinkSync(path.join(root, 'src'), path.join(tmp, 'src'));
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(tmp, 'node_modules'));
    const f = path.join(tmp, 'content/milestones.json');
    const bad = JSON.parse(fs.readFileSync(f, 'utf8'));
    bad.items.push({ ...bad.items[0], area: 'zzz', from: 10, to: 5, src: ['NOPE'], ru: {} });
    bad.items.push({ ...bad.items[1] });
    fs.writeFileSync(f, JSON.stringify(bad));
    let out = '';
    try { execFileSync('node', [path.join(tmp, 'scripts/build-content.mjs')], { stdio: 'pipe' }); } catch (e) { out = String(e.stderr); }
    for (const m of ['area non valida', 'to deve essere', 'fonte mancante NOPE', 'ru.title mancante', 'duplicato']) expect(out).toContain(m);
  });
});
