import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { wflLms, wflZ, wflType, assessWfl, assess, estimateHeight, adjustHeight, lmsAt, zScore, isCorrected, GROWTH_SOURCES } from '../src/lib/growth.js';
import { DIARY_TEXT } from '../src/components/Diary.jsx';

describe('peso per lunghezza/altezza OMS', () => {
  it('z = 0 alla mediana, tabelle wfl/wfh', () => {
    const [, M] = wflLms('m', 9, 75);
    expect(Math.abs(wflZ('m', 9, 75, M))).toBeLessThan(1e-6);
    expect(M).toBeGreaterThan(8.5); expect(M).toBeLessThan(10);
    expect(wflType(23.9)).toBe('wfl'); expect(wflType(24.1)).toBe('wfh');
    expect(wflLms('f', 30, 64.9)).toBeNull(); // wfh parte da 65
    expect(wflLms('f', 30, 120.1)).toBeNull();
    expect(wflLms('m', 10, 44.9)).toBeNull();
    expect(wflLms('m', 61, 90)).toBeNull();
    expect(wflLms('m', -1, 70)).toBeNull();
  });
  it('interpolazione tra righe da 0,1 cm', () => {
    const a = wflLms('m', 9, 75.0)[1], b = wflLms('m', 9, 75.1)[1], c = wflLms('m', 9, 75.05)[1];
    expect(c).toBeCloseTo((a + b) / 2, 4);
  });
  it('soglie OMS', () => {
    const [L, M, S] = wflLms('m', 9, 75);
    const at = (z) => +(M * Math.pow(1 + L * S * z, 1 / L)).toFixed(3);
    const kind = (z) => assessWfl('m', 9, 75, at(z)).warnings[0]?.kind;
    expect(kind(0)).toBeUndefined();
    expect(kind(1.5)).toBe('wflRisk');
    expect(kind(2.5)).toBe('wflOverweight');
    expect(kind(3.5)).toBe('wflObese');
    expect(kind(-2.5)).toBe('wflWasting');
    expect(kind(-3.5)).toBe('wflSevereWasting');
    expect(assessWfl('m', 9, 75, 9.0 * 3).warnings[0].kind).toBe('implausible');
    expect(assessWfl('m', 9, 75, 9).warnings.find((w) => w.kind === 'wflRisk')).toBeUndefined();
  });
});

describe('peso per età alto = info', () => {
  it('weightHigh è info', () => {
    const M = lmsAt('weight', 'm', 12)[1];
    const w = assess('weight', 'm', 12, M * 1.4).warnings.find((x) => x.kind.startsWith('weight'));
    expect(w.level).toBe('info');
  });
});

describe('BMI stimato', () => {
  const sex = 'm';
  const h = (t, z) => { const lms = lmsAt('height', sex, t); return lms[1] * (1 + lms[2] * z); };
  const H = (t, z, date) => ({ t, m: t, v: h(t, z), date });
  it('interpolazione lineare in z', () => {
    const e = estimateHeight(sex, [H(30, 0, 'a'), H(34, 0.4, 'b')], { t: 32, m: 32 });
    const expected = lmsAt('height', sex, 32)[1] * (1 + lmsAt('height', sex, 32)[2] * 0.2);
    expect(e.h).toBeCloseTo(expected, 5);
    expect(e.dates).toEqual(['a', 'b']);
  });
  it('limiti: finestra, salto di z, implausibile', () => {
    expect(estimateHeight(sex, [H(30, 0, 'a'), H(37, 0.1, 'b')], { t: 33, m: 33 })).toBeNull(); // 7 mesi > 6
    expect(estimateHeight(sex, [H(30, 0, 'a'), H(34, 0.8, 'b')], { t: 32, m: 32 })).toBeNull(); // |dz| > 0.67
    expect(estimateHeight(sex, [H(30, -7, 'a'), H(32, -7, 'b')], { t: 31, m: 31 })).toBeNull();
    expect(estimateHeight(sex, [H(8, 0, 'a'), H(13, 0, 'b')], { t: 10, m: 10 })).toBeNull(); // 5 mesi > 4 sotto i 12
  });
  it('riporto in avanti con finestre per età, nessuna estrapolazione all\'indietro', () => {
    const days = (d) => d / 30.4375;
    expect(estimateHeight(sex, [H(30, 0.5, 'a')], { t: 30 + days(55), m: 30 + days(55) }).dates).toEqual(['a']);
    expect(estimateHeight(sex, [H(30, 0.5, 'a')], { t: 30 + days(65), m: 30 + days(65) })).toBeNull();
    expect(estimateHeight(sex, [H(8, 0, 'a')], { t: 8 + days(31), m: 8 + days(31) })).toBeNull();
    expect(estimateHeight(sex, [H(40, 0, 'a')], { t: 35, m: 35 })).toBeNull();
  });
});

describe('testi e correzioni', () => {
  it('soglie basse RU/IT con "sotto"', () => {
    for (const k of ['low', 'veryLow', 'headLow', 'headVeryLow']) {
      expect(DIARY_TEXT.ru.w[k]).toMatch(/ниже −[23] SD/);
      expect(DIARY_TEXT.ru.w[k]).not.toMatch(/более/);
      expect(DIARY_TEXT.it.w[k]).toMatch(/sotto −[23] DS/);
      expect(DIARY_TEXT.it.w[k]).not.toMatch(/oltre/);
    }
  });
  it('implausible invita a parlarne', () => {
    expect(DIARY_TEXT.it.w.implausible).toContain('Se il valore è giusto, parlane presto con il pediatra.');
    expect(DIARY_TEXT.ru.w.implausible).toContain('Если значение верное, скорее обсудите его с педиатром.');
  });
  it('fonti nuove', () => {
    const src = JSON.parse(readFileSync(new URL('../content/sources.json', import.meta.url), 'utf8'));
    expect(GROWTH_SOURCES).toEqual(expect.arrayContaining(['W15', 'W16']));
    expect(src.W15.url).toContain('who.int'); expect(src.W16.url).toContain('journal.pone.0066192');
  });
  it('nessuna correzione di altezza oltre 60 mesi', () => {
    expect(adjustHeight(61, 110, 'lying')).toBe(110);
    expect(adjustHeight(48, 100, 'lying')).toBeCloseTo(99.3);
  });
  it('testa crossUp: info se isolato', () => {
    const z = (m, zz) => { const [L, M, S] = lmsAt('head', 'm', m); return M * (1 + L * S * zz); };
    const r = assess('head', 'm', 4, z(4, 1.5), [{ months: 2, value: z(2, -0.1) }]);
    expect(r.warnings.find((w) => w.kind === 'crossUp').level).toBe('info');
  });
  it('confronti saltati tra età corretta e cronologica', () => {
    const [, M] = lmsAt('weight', 'm', 6);
    const lowPrev = { months: 3, value: lmsAt('weight', 'm', 3)[1] * 1.35 };
    const cur = M * 0.8;
    const same = assess('weight', 'm', 6, cur, [{ ...lowPrev, corr: false }], { corr: false });
    const diff = assess('weight', 'm', 6, cur, [{ ...lowPrev, corr: true }], { corr: false });
    expect(same.warnings.some((w) => w.kind === 'crossDown')).toBe(true);
    expect(diff.warnings.some((w) => w.kind === 'crossDown')).toBe(false);
    expect(isCorrected({ birth: new Date(Date.now() - 86400000 * 60).toISOString().slice(0, 10), gaWeeks: 30 }, new Date().toISOString().slice(0, 10))).toBe(true);
  });
  it('crossDown con conferma in 2-3 settimane', () => {
    expect(DIARY_TEXT.it.w.crossDown({ spaces: 2, ind: 'weight' })).toContain('dopo 2–3 settimane');
    expect(DIARY_TEXT.ru.w.crossDown({ spaces: 2, ind: 'weight' })).toContain('через 2–3 недели');
  });
});

import { dropWeightHigh, wflZ as wz } from '../src/lib/growth.js';
describe('fix verificatore', () => {
  it('testa crossUp: salita continua dopo 6 mesi = warn', () => {
    const z = (m, zz) => { const [L, M, S] = lmsAt('head', 'm', m); return M * (1 + L * S * zz); };
    const r = assess('head', 'm', 12, z(12, 1.6), [{ months: 6, value: z(6, -0.3) }, { months: 9, value: z(9, 0.6) }]);
    expect(r.warnings.find((w) => w.kind === 'crossUp').level).toBe('warn');
  });
  it('riporto 90 giorni oltre 60 mesi', () => {
    const lms = lmsAt('height', 'm', 70);
    const q = { t: 70, m: 70, v: lms[1], date: 'a' };
    const d = 90 / 30.4375, d2 = 95 / 30.4375;
    expect(estimateHeight('m', [q], { t: 70 + d, m: 70 + d })).not.toBeNull();
    expect(estimateHeight('m', [q], { t: 70 + d2, m: 70 + d2 })).toBeNull();
  });
  it('wfl restricted: maschio 75 cm 12,5 kg', () => {
    expect(wz('m', 9, 75, 12.5)).toBeCloseTo(3.16, 1);
  });
  it('altezza dello stesso giorno in record separato è usata', () => {
    const lms = lmsAt('height', 'm', 30);
    const q = { t: 30, m: 30, v: lms[1], date: 'a' };
    expect(estimateHeight('m', [q], { t: 30, m: 30 }).h).toBeCloseTo(lms[1], 5);
  });
  it('dropWeightHigh', () => {
    const w = [{ kind: 'weightHigh', level: 'info' }, { kind: 'crossDown', level: 'warn' }];
    expect(dropWeightHigh(w, { wfl: {} }, 20)).toHaveLength(1);
    expect(dropWeightHigh(w, { bmi: { estimated: false } }, 70)).toHaveLength(1);
    expect(dropWeightHigh(w, { bmi: { estimated: true } }, 70)).toHaveLength(2);
    expect(dropWeightHigh(w, { bmi: { estimated: false } }, 40)).toHaveLength(2);
  });
  it('crossDown: frase malattia solo per il peso', () => {
    expect(DIARY_TEXT.it.w.crossDown({ spaces: 2, ind: 'height' })).not.toContain('malattia');
    expect(DIARY_TEXT.it.w.crossDown({ spaces: 2, ind: 'weight' })).toContain('malattia');
  });
});
