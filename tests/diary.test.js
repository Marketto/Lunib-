import { describe, it, expect } from 'vitest';
import { zScore, percentile, assess, lmsAt } from '../src/lib/growth.js';
import { checkDose, toMg, latestWeight } from '../src/lib/meds.js';

describe('crescita OMS', () => {
  it('mediane OMS → z≈0 (50° percentile)', () => {
    expect(zScore('weight', 'm', 12, 9.646)).toBeCloseTo(0, 3);
    expect(zScore('head', 'm', 6, 43.3393)).toBeCloseTo(0, 3);
    expect(Math.round(percentile(0))).toBe(50);
  });
  it('−2 DS OMS: maschio 12 mesi ≈ 7,7 kg; femmina 24 mesi altezza ≈ 79,3 cm', () => {
    expect(zScore('weight', 'm', 12, 7.7)).toBeCloseTo(-2, 1);
    expect(zScore('height', 'f', 24, 79.3)).toBeCloseTo(-2, 1);
  });
  it('interpolazione tra mesi', () => {
    const a = lmsAt('weight', 'f', 6), b = lmsAt('weight', 'f', 7), m = lmsAt('weight', 'f', 6.5);
    expect(m[1]).toBeCloseTo((a[1] + b[1]) / 2, 5);
  });
  it('avvisi: fuori ±2 DS, valori improbabili, incrocio di percentili', () => {
    expect(assess('weight', 'm', 12, 9.6).warnings).toEqual([]);
    expect(assess('weight', 'm', 12, 7.3).warnings[0].kind).toBe('low');
    expect(assess('height', 'm', 12, 86).warnings[0]?.kind).toBe('tall');
    expect(assess('weight', 'm', 12, 96).warnings[0].kind).toBe('implausible');
    const prev = { months: 6, value: 7.9 }; // ≈ 50° a 6 mesi
    const r = assess('weight', 'm', 12, 8.0, prev);
    expect(r.warnings.map((w) => w.kind)).toContain('crossDown');
  });
  it('prime 2 settimane: niente avviso di incrocio', () => {
    const r = assess('weight', 'm', 1.2, 3.6, { months: 0.1, value: 3.4 });
    expect(r.warnings.find((w) => w.kind.startsWith('cross'))).toBeUndefined();
  });
});

describe('controllo medicine', () => {
  const kid = 'k1';
  const base = { kidId: kid, active: 'paracetamolo', route: 'oral', unit: 'mg', flags: [] };
  const w = { kg: 10, days: 3 };
  it('mg da ml e concentrazione', () => {
    expect(toMg({ unit: 'ml', amount: 5, conc: 24 })).toBe(120);
  });
  it('dose entro i limiti → nessun warn', () => {
    const r = checkDose({ ...base, id: 'a', at: '2026-11-08T10:00:00Z', amount: 150 }, [], { months: 24, weight: w });
    expect(r.filter((x) => x.level !== 'info')).toEqual([]);
  });
  it('dose per kg troppo alta, intervallo troppo breve, troppe dosi', () => {
    const log = ['00', '04', '08', '12'].map((h, i) => ({ ...base, id: 'p' + i, at: `2026-11-08T${h}:00:00Z`, amount: 150 }));
    const r = checkDose({ ...base, id: 'n', at: '2026-11-08T14:00:00Z', amount: 200 }, log, { months: 24, weight: w });
    const k = r.map((x) => x.kind);
    expect(k).toEqual(expect.arrayContaining(['doseHigh', 'tooSoon', 'tooMany', 'dayHigh']));
  });
  it('sotto i 3 mesi → chiedere al pediatra', () => {
    const r = checkDose({ ...base, id: 'a', at: '2026-11-08T10:00:00Z', amount: 40 }, [], { months: 2, weight: { kg: 4.5, days: 1 } });
    expect(r[0]).toMatchObject({ kind: 'underAge', level: 'stop' });
  });
  it('ibuprofene: peso minimo e varicella', () => {
    const r = checkDose({ ...base, active: 'ibuprofene', id: 'a', at: '2026-11-08T10:00:00Z', amount: 50, flags: ['chickenpox'] }, [], { months: 4, weight: { kg: 5.2, days: 1 } });
    expect(r.map((x) => x.kind)).toEqual(expect.arrayContaining(['underWeight', 'contra']));
  });
  it('farmaco libero: registrato senza controlli', () => {
    expect(checkDose({ kidId: kid, active: null, name: 'Amoxicillina', at: '2026-11-08T10:00:00Z' }, [], {})[0].kind).toBe('noCheck');
  });
  it('ultimo peso noto', () => {
    const g = [{ kidId: kid, date: '2026-10-01', weight: 9 }, { kidId: kid, date: '2026-11-01', weight: 9.5 }];
    expect(latestWeight(g, kid, '2026-11-08T10:00:00Z')).toEqual({ kg: 9.5, days: 7 });
  });
});

describe('incrocio graduale', () => {
  it('discesa lenta su più misure → avviso rispetto alla misura più lontana', () => {
    const prev = [{ months: 4, value: 7.0 }, { months: 7, value: 7.5 }];
    const r = assess('weight', 'm', 12, 7.9, prev);
    expect(r.warnings.map((w) => w.kind)).toContain('crossDown');
  });
});

import { newbornCheck, adjustHeight } from '../src/lib/growth.js';
describe('regole verificate', () => {
  it('avvicinarsi alla mediana non è un avviso', () => {
    expect(assess('weight', 'm', 12, 9.6, [{ months: 4, value: 9.0 }]).warnings).toEqual([]);
  });
  it('soglia NICE: nato sotto il 9° centile → basta 1 spazio', () => {
    const prev = [{ months: 4, value: 6.4 }];
    const z = assess('weight', 'm', 8, 7.2, prev, { birthZ: -1.6 });
    expect(z.warnings.map((w) => w.kind)).toContain('crossDown');
  });
  it('neonato: calo > 10% e peso non recuperato a 3 settimane', () => {
    expect(newbornCheck(3.5, 5, 3.1).kind).toBe('newbornLoss');
    expect(newbornCheck(3.5, 22, 3.4).kind).toBe('notRegained');
    expect(newbornCheck(3.5, 22, 3.7)).toBeNull();
  });
  it('posizione: in piedi sotto i 24 mesi +0,7 cm', () => {
    expect(adjustHeight(20, 80, 'standing')).toBeCloseTo(80.7);
    expect(adjustHeight(30, 90, 'lying')).toBeCloseTo(89.3);
  });
  it('23,9 mesi: mediana di lunghezza (sdraiato) vicina a 86,4 cm per le bimbe', () => {
    expect(zScore('height', 'f', 23.99, 86.4)).toBeCloseTo(0, 1);
  });
});

describe('correzioni verifica finale', () => {
  const base = { kidId: 'k', active: 'ibuprofene', route: 'oral', unit: 'mg', flags: [] };
  it('durata: dose serale + mattina dopo non è "più di 24 ore"', () => {
    const log = [{ ...base, id: 'a', at: '2026-11-07T22:30:00Z', amount: 50 }];
    const r = checkDose({ ...base, id: 'b', at: '2026-11-08T04:40:00Z', amount: 50 }, log, { months: 5, weight: { kg: 7, days: 1 } });
    expect(r.map((x) => x.kind)).not.toContain('tooLong');
  });
  it('durata: oltre 24 h di episodio sotto i 6 mesi → avviso', () => {
    const log = ['2026-11-07T06:00:00Z', '2026-11-07T14:00:00Z', '2026-11-07T22:00:00Z'].map((at, i) => ({ ...base, id: 'x' + i, at, amount: 50 }));
    const r = checkDose({ ...base, id: 'b', at: '2026-11-08T07:00:00Z', amount: 50 }, log, { months: 5, weight: { kg: 7, days: 1 } });
    expect(r.map((x) => x.kind)).toContain('tooLong');
  });
  it('supposte: niente limite di numero, nota sulla fascia di peso', () => {
    const p = { kidId: 'k', active: 'paracetamolo', route: 'rectal', unit: 'mg', flags: [] };
    const log = ['00', '04', '08', '12'].map((h, i) => ({ ...p, id: 'r' + i, at: `2026-11-08T${h}:00:00Z`, amount: 125 }));
    const r = checkDose({ ...p, id: 'n', at: '2026-11-08T16:00:00Z', amount: 125 }, log, { months: 10, weight: { kg: 8, days: 1 } });
    const k = r.map((x) => x.kind);
    expect(k).not.toContain('tooMany');
    expect(k).toContain('rectalBand');
  });
});
