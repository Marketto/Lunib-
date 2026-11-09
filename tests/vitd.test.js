import { describe, it, expect } from 'vitest';
import { checkDose, toIU, vitDLimit } from '../src/lib/meds.js';
import { suggestActive } from '../src/lib/csv.js';
import sources from '../content/sources.json';

const base = { kidId: 'k', active: 'vitaminaD', flags: [], route: null };
const at = '2026-03-10T09:00:00';
const E = (o) => ({ ...base, id: Math.random().toString(36), at, unit: 'UI', amount: 400, ...o });
const kinds = (r) => r.map((x) => x.kind);

describe('vitamina D', () => {
  it('limite per età (confini)', () => {
    expect(vitDLimit(5.9).iu).toBe(1000);
    expect(vitDLimit(6).iu).toBe(1400);
    expect(vitDLimit(11.9).iu).toBe(1400);
    expect(vitDLimit(12).iu).toBe(2000);
    expect(vitDLimit(72).iu).toBe(2000);
  });
  it('conversioni', () => {
    expect(toIU({ unit: 'µg', amount: 10 })).toBe(400);
    expect(toIU({ unit: 'gocce', amount: 3, concIU: 100 })).toBe(300);
    expect(toIU({ unit: 'ml', amount: 0.5, concIU: 800 })).toBe(400);
    expect(toIU({ unit: 'gocce', amount: 3 })).toBeNull();
  });
  it('avviso solo se il totale supera strettamente il limite; sotto non avvisa', () => {
    expect(kinds(checkDose(E({ amount: 1000 }), [], { months: 5 }))).not.toContain('vitDHigh');
    const r = checkDose(E({ amount: 1001 }), [], { months: 5 });
    expect(kinds(r)).toContain('vitDHigh');
    expect(kinds(checkDose(E({ amount: 1400 }), [], { months: 6 }))).not.toContain('vitDHigh');
  });
  it('totale su due prodotti nello stesso giorno, non su giorni diversi', () => {
    const o = E({ unit: 'gocce', amount: 4, concIU: 100, at: '2026-03-10T08:00:00' });
    const cur = E({ amount: 700, at: '2026-03-10T20:00:00' });
    expect(kinds(checkDose(cur, [o], { months: 5 }))).toContain('vitDHigh');
    const ieri = { ...o, at: '2026-03-09T20:00:00' };
    expect(kinds(checkDose(cur, [ieri], { months: 5 }))).not.toContain('vitDHigh');
  });
  it('forte oltre 2x il limite: stop, etichetta di convenzione, fonte del limite EFSA', () => {
    const r = checkDose(E({ amount: 2001 }), [], { months: 3 });
    const v = r.find((x) => x.kind === 'vitDVeryHigh');
    expect(v.level).toBe('stop'); expect(v.refs.length).toBeGreaterThan(0);
    expect(kinds(r)).not.toContain('vitDHigh');
    expect(kinds(checkDose(E({ amount: 2000 }), [], { months: 3 }))).toContain('vitDHigh');
  });
  it('senza UI per goccia/ml: vitDNoIU; sempre info e raccomandazione; niente controlli di intervallo', () => {
    const r = checkDose(E({ unit: 'gocce', amount: 3 }), [E({ at: '2026-03-10T08:30:00' })], { months: 8 });
    expect(kinds(r)).toEqual(expect.arrayContaining(['vitDNoIU', 'vitDInfo', 'vitDAllSources', 'vitDRec']));
    expect(kinds(r)).not.toContain('tooSoon');
    expect(r.find((x) => x.kind === 'vitDRec').period).toBe('infant');
    expect(checkDose(E(), [], { months: 20 }).find((x) => x.kind === 'vitDRec').period).toBe('child');
  });
  it('analoghi (calcifediolo...) solo per nomi corrispondenti; fonti esistono', () => {
    expect(kinds(checkDose({ kidId: 'k', at, name: 'Calcifediolo gocce', unit: 'gocce' }, [], { months: 8 }))).toContain('vitDAnalog');
    expect(kinds(checkDose({ kidId: 'k', at, name: 'Altro', unit: 'gocce' }, [], { months: 8 }))).not.toContain('vitDAnalog');
    for (const id of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']) expect(sources[id].url).toMatch(/^https:/);
  });
  it('suggerimento in import', () => {
    expect(suggestActive('Vitamina D3 gocce')).toBe('vitaminaD');
    expect(suggestActive('Витамин D')).toBe('vitaminaD');
    expect(suggestActive('Colecalciferolo')).toBe('vitaminaD');
    expect(suggestActive('Tachipirina')).toBe('');
  });
});

import { parseMedDetails as pmd2 } from '../src/lib/csv.js';
import { it as it4, expect as ex4 } from 'vitest';
it4('import: unità UI', () => {
  ex4(pmd2('Vitamina D 400 UI')).toMatchObject({ amount: 400, unit: 'UI', name: 'Vitamina D' });
  ex4(pmd2('400 IU vitamin D')).toMatchObject({ amount: 400, unit: 'UI' });
});
