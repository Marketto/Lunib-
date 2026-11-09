import { describe, it, expect } from 'vitest';
import { parseDate, detectPreset, parseMedDetails, buildFromBabyTracker, summarizeMeds } from '../src/lib/csv.js';

const H = ['Activity', 'Type', 'Start', 'Finish', 'Details'];
const row = (a, start, d = '') => [a, a, start, start, d];
const kid = { id: 'k1', birth: '2025-01-01' };
const now = '2026-11-09T00:00:00Z';
const rows = [
  H,
  row('Peso', '2026-10-30, 07:15', '8.65kg'),
  row('Altezza', '2026-10-30, 07:20', '75.5cm'),
  row('Testa', '2026-10-30, 07:25', '44cm'),
  row('Peso', '2026-06-01, 08:00', '9000g'),
  row('Altezza', '2025-03-01, 08:00', '60cm'),
  row('Temperatura', '2026-10-30, 09:00', '37.8°C'),
  row('Temperatura', '2026-10-31, 09:00', '38.1°C'),
  row('Seno destro', '2026-10-30, 10:00'),
  row('Sporco', '2026-10-30, 11:00'),
  row('Tempo a pancia in giù', '2026-10-30, 12:00'),
  row('Vaccinazione', '2026-10-30, 12:00', 'xyz'),
  ['', '', '', '', ''],
  row('Farmaci', '2026-10-30, 13:00', 'Brandx 2,50ml'),
  row('Farmaci', '2026-10-30, 21:00', 'Brandx 2.5 ml dopo cena'),
  row('Farmaci', '2026-10-31, 13:00', 'Brandy'),
  row('Farmaci', '2026-10-31, 14:00', 'Brandz 5 giorni'),
  row('Peso', '2026-10-29, 07:00', 'abc')
];
const build = (extra = {}) => buildFromBabyTracker(rows, { kid, existing: {}, now, ...extra });

describe('baby tracker', () => {
  it('detects the header in any case, ignores others', () => {
    expect(detectPreset(rows)).toBeTruthy();
    expect(detectPreset([['ACTIVITY', 'type', 'START', 'Finish', 'details']])).toBeTruthy();
    expect(detectPreset([['Date', 'Weight']])).toBeFalsy();
    expect(detectPreset([])).toBeFalsy();
  });
  it('parseDate accepts comma', () => {
    expect(parseDate('2026-10-30, 07:15')).toMatchObject({ date: '2026-10-30', time: '07:15' });
  });
  it('groups by date, converts units, heightPos by age', () => {
    const { growth } = build();
    const d = growth.find((g) => g.date === '2026-10-30');
    expect(d).toMatchObject({ weight: 8.65, height: 75.5, head: 44, heightPos: 'lying', source: 'import' });
    const old = buildFromBabyTracker(rows, { kid: { id: 'k2', birth: '2024-01-01' }, now });
    expect(old.growth.find((g) => g.date === '2026-10-30').heightPos).toBe('standing');
    expect(growth.find((g) => g.date === '2026-06-01').weight).toBe(9);
    expect(growth.find((g) => g.date === '2025-03-01')).toMatchObject({ height: 60, heightPos: 'lying' });
    expect(growth).toHaveLength(3);
  });
  it('localized names (EN/RU) and lb/in', () => {
    const r = [H, row('Weight', '2026-10-30, 07:00', '20lb'), row('Рост', '2026-10-30, 07:00', '30in'), row('Окружность головы', '2026-10-30, 07:00', '45cm'), row('Лекарство', '2026-10-30, 08:00', 'X 5 капли'), row('Температура', '2026-10-30, 08:00', '37')];
    const o = buildFromBabyTracker(r, { kid, now });
    expect(o.growth[0]).toMatchObject({ weight: 9.072, height: 76.2, head: 45 });
    expect(o.meds[0]).toMatchObject({ name: 'X', amount: 5, unit: 'gocce' });
    expect(o.ignored.temperature).toBe(1);
  });
  it('parses medicine details', () => {
    expect(parseMedDetails('Brandx 2,50ml')).toEqual({ name: 'Brandx', amount: 2.5, unit: 'ml', note: '' });
    expect(parseMedDetails('Brandx 2.5 mg dopo cena')).toMatchObject({ amount: 2.5, unit: 'mg', note: 'dopo cena' });
    expect(parseMedDetails('Brand 3 giorni')).toEqual({ name: 'Brand 3 giorni', amount: null, unit: 'other', note: '' });
    expect(parseMedDetails('Vitamina D 400 UI 5 gocce')).toMatchObject({ name: 'Vitamina D 400 UI', amount: 5, unit: 'gocce' });
    expect(parseMedDetails('Nome: 3mg (mattina)')).toMatchObject({ name: 'Nome', amount: 3, unit: 'mg', note: '(mattina)' });
    expect(parseMedDetails('Solonome')).toMatchObject({ name: 'Solonome', amount: null, unit: 'other' });
  });
  it('builds meds and summarizes names', () => {
    const { meds } = build();
    expect(meds).toHaveLength(4);
    expect(meds[1]).toMatchObject({ name: 'Brandx', amount: 2.5, unit: 'ml', note: 'dopo cena', active: null });
    expect(meds[2]).toMatchObject({ name: 'Brandy', amount: null, unit: 'other' });
    expect(summarizeMeds(meds)[0]).toEqual({ key: 'brandx', name: 'Brandx', count: 2, ml: true });
  });
  it('applies the user medicine mapping', () => {
    const { meds } = build({ medMap: { brandx: { active: 'paracetamolo', conc: 24 }, brandy: { active: 'ibuprofene', conc: 20 }, brandz: { active: 'nope' } } });
    expect(meds[0]).toMatchObject({ active: 'paracetamolo', route: 'oral', conc: 24, name: 'Brandx' });
    expect(meds[2]).toMatchObject({ active: 'ibuprofene', route: 'oral', conc: null }); // unità non in ml
    expect(meds[3]).toMatchObject({ active: null, route: null });
  });
  it('counts ignored reasons', () => {
    const { ignored } = build();
    expect(ignored).toMatchObject({ temperature: 2, otherActivities: 4, empty: 1, badValue: 1 });
  });
  it('dedupes on re-import, even if the mapping changed', () => {
    const first = build();
    const again = build({ existing: { growth: first.growth, meds: first.meds }, medMap: { brandx: { active: 'paracetamolo', conc: 24 } } });
    expect(again.growth).toHaveLength(0);
    expect(again.meds).toHaveLength(0);
    expect(again.ignored.duplicate).toBe(7);
  });
});

import { parseMedDetails as pmd } from '../src/lib/csv.js';
import { it as it3, expect as ex3 } from 'vitest';
it3('farmaci: quantità prima del nome, gocce, supposte, concentrazione nel testo', () => {
  ex3(pmd('5ml Integratore D3 gocce')).toMatchObject({ amount: 5, unit: 'ml', name: 'Integratore D3 gocce' });
  ex3(pmd('4 gocce Vitamina')).toMatchObject({ amount: 4, unit: 'gocce', name: 'Vitamina' });
  ex3(pmd('Antipiretico - supposta 125mg')).toMatchObject({ amount: 125, unit: 'mg', route: 'rectal', name: 'Antipiretico' });
  ex3(pmd('Sciroppo X - 5ml da 120mg/5ml')).toMatchObject({ amount: 5, unit: 'ml', conc: 24, name: 'Sciroppo X' });
});
