import { describe, it, expect } from 'vitest';
import { checkDose, capBand, vitDLimit, ACTIVE } from '../src/lib/meds.js';
import { assess, lmsAt, GROWTH_RULES } from '../src/lib/growth.js';
import { status, isRelevant, isPast, split, earlyBefore, windowOf } from '../src/lib/milestones.js';
import MS from '../content/milestones.json';
import SOURCES from '../content/sources.json';
import MEDS from '../src/data/meds.json';

const kinds = (r) => r.map((x) => x.kind);
const para = (o) => ({ id: Math.random().toString(36), kidId: 'k', active: 'paracetamolo', route: 'oral', unit: 'mg', amount: 100, flags: [], at: '2026-11-08T10:00:00Z', ...o });
const ibu = (o) => para({ active: 'ibuprofene', ...o });
const W = (kg, days = 1) => ({ kg, days });

describe('fonti X*', () => {
  it('presenti', () => { for (const id of ['X1', 'X4', 'X5', 'X7', 'X8', 'X9', 'X10']) expect(SOURCES[id]?.url).toMatch(/^https:/); });
  it('le fasce citano fonti esistenti', () => {
    for (const a of Object.values(MEDS.active)) for (const c of a.caps || []) for (const s of c.src) expect(SOURCES[s]).toBeTruthy();
  });
});

describe('tetti di dose 6–12 anni', () => {
  const caps = ACTIVE.paracetamolo.caps;
  it('fasce per età (paracetamolo)', () => {
    expect(capBand(caps, 71, null)).toBeNull();
    expect(capBand(caps, 72, null).perDoseMg).toBe(250);
    expect(capBand(caps, 95, null).perDoseMg).toBe(250);
    expect(capBand(caps, 96, null).perDoseMg).toBe(375);
    expect(capBand(caps, 143, null).perDayMg).toBe(2000);
    expect(capBand(caps, 150, null).perDoseMg).toBe(500); // ≥12 anni senza peso: ricade su 8–11
  });
  it('fasce per peso (paracetamolo) hanno la precedenza se il peso è recente', () => {
    expect(capBand(caps, 100, W(22)).perDoseMg).toBe(250);
    expect(capBand(caps, 100, W(25.9)).perDoseMg).toBe(250);
    expect(capBand(caps, 100, W(26)).perDoseMg).toBe(500);
    expect(capBand(caps, 100, W(40)).perDoseMg).toBe(500);
    expect(capBand(caps, 100, W(30, 31)).perDoseMg).toBe(500);
    expect(capBand(caps, 100, W(22, 32)).perDoseMg).toBe(375); // peso vecchio: età 8–11
    expect(capBand(caps, 80, W(30)).perDoseMg).toBe(500);     // peso 26–40 kg a 6 anni: fascia di peso
    expect(capBand(caps, 100, W(18)).perDoseMg).toBe(375);    // sotto 21 kg: nessuna fascia di peso, età
  });
  it('≥12 anni E >40 kg richiede entrambi', () => {
    expect(capBand(caps, 144, W(41)).perDoseMg).toBe(750);
    expect(capBand(caps, 144, W(41)).perDayMg).toBe(3000);
    expect(capBand(caps, 144, W(40)).perDoseMg).toBe(500);
    expect(capBand(caps, 143, W(45)).perDoseMg).toBe(500);
    expect(capBand(caps, 144, null).perDoseMg).toBe(500);
  });
  it('fasce per età (ibuprofene)', () => {
    const c = ACTIVE.ibuprofene.caps;
    expect([71, 72, 83, 84, 119, 120, 143, 144].map((m) => capBand(c, m, null)?.perDoseMg)).toEqual([undefined, 150, 150, 200, 200, 300, 300, 400].map((v) => v));
    expect(capBand(c, 100, W(50)).perDoseMg).toBe(200);
  });
  it('capDose: nessun falso allarme esattamente al tetto, avviso sopra', () => {
    expect(kinds(checkDose(para({ amount: 500 }), [], { months: 100, weight: W(30) }))).not.toContain('capDose');
    const r = checkDose(para({ amount: 501 }), [], { months: 100, weight: W(30) });
    const c = r.find((x) => x.kind === 'capDose');
    expect(c.level).toBe('warn'); expect(c.max).toBe(500); expect(c.refs).toEqual(['X1']);
    expect(kinds(checkDose(para({ amount: 300 }), [], { months: 80, weight: null }))).toContain('capDose'); // 6 anni: 250
    expect(kinds(checkDose(para({ amount: 250 }), [], { months: 80, weight: null }))).not.toContain('capDose');
    expect(kinds(checkDose(para({ amount: 10, unit: 'ml', conc: 25 }), [], { months: 80, weight: null }))).not.toContain('capDose'); // 250 mg da ml
  });
  it('capDay: totale 24 h su tutte le vie', () => {
    const at = '2026-11-08T20:00:00Z';
    const log = [para({ amount: 500, at: '2026-11-08T08:00:00Z' }), para({ amount: 500, route: 'rectal', at: '2026-11-08T12:00:00Z' }), para({ amount: 500, at: '2026-11-08T16:00:00Z' })];
    const ok = checkDose(para({ amount: 500, at }), log, { months: 125, weight: null }); // 2000 = tetto
    expect(kinds(ok)).not.toContain('capDay');
    const over = checkDose(para({ amount: 501, at }), log, { months: 125, weight: null });
    const d = over.find((x) => x.kind === 'capDay');
    expect(d.level).toBe('warn'); expect(d.mg).toBe(2001); expect(d.max).toBe(2000);
    // fuori dalle 24 h non conta
    expect(kinds(checkDose(para({ amount: 500, at: '2026-11-09T09:00:00Z' }), log, { months: 125, weight: null }))).not.toContain('capDay');
  });
  it('ibuprofene: dose e giorno', () => {
    expect(kinds(checkDose(ibu({ amount: 300 }), [], { months: 130, weight: null }))).not.toContain('capDose');
    expect(kinds(checkDose(ibu({ amount: 301 }), [], { months: 130, weight: null }))).toContain('capDose');
    const log = [ibu({ amount: 300, at: '2026-11-08T00:00:00Z' }), ibu({ amount: 300, at: '2026-11-08T07:00:00Z' })];
    expect(kinds(checkDose(ibu({ amount: 300, at: '2026-11-08T14:00:00Z' }), log, { months: 130, weight: null }))).not.toContain('capDay'); // 900
    expect(kinds(checkDose(ibu({ amount: 301, at: '2026-11-08T14:00:00Z' }), log, { months: 130, weight: null }))).toContain('capDay');
  });
  it('nota RCP permanente a 6–12 anni, niente olderChild; nessun tetto sotto i 6 anni', () => {
    const r = checkDose(para({ amount: 100 }), [], { months: 100, weight: null });
    expect(kinds(r)).toContain('rcpNote'); expect(kinds(r)).not.toContain('olderChild');
    expect(kinds(checkDose(para({ amount: 100 }), [], { months: 60, weight: null }))).not.toContain('rcpNote');
    expect(kinds(checkDose(para({ amount: 900 }), [], { months: 60, weight: W(18) }))).not.toContain('capDose');
  });
  it('i controlli mg/kg restano', () => {
    expect(kinds(checkDose(para({ amount: 450 }), [], { months: 100, weight: W(26) }))).toContain('doseHigh'); // 17,3 mg/kg
  });
});

describe('vitamina D fino a 17 anni', () => {
  it('confini 131/132/215/216', () => {
    expect(vitDLimit(131).iu).toBe(2000);
    expect(vitDLimit(132).iu).toBe(4000);
    expect(vitDLimit(132).src).toEqual(['V2']);
    expect(vitDLimit(215).iu).toBe(4000);
    expect(vitDLimit(216)).toBeNull();
  });
  it('avviso a 11 anni solo sopra 4000 UI', () => {
    const e = (a) => ({ id: 'x', kidId: 'k', active: 'vitaminaD', at: '2026-11-09T08:00:00', amount: a, unit: 'UI' });
    expect(kinds(checkDose(e(4000), [], { months: 140 }))).not.toContain('vitDHigh');
    expect(kinds(checkDose(e(4001), [], { months: 140 }))).toContain('vitDHigh');
  });
});

describe('soglie BMI OMS (61–228 mesi)', () => {
  const at = (months, z) => { const [L, M, S] = lmsAt('bmi', 'm', months); return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L); };
  const k = (m, z) => assess('bmi', 'm', m, at(m, z)).warnings.map((w) => w.kind);
  it('classi', () => {
    expect(k(100, 2.3)).toEqual(['bmiObese']);
    expect(k(100, 1.5)).toEqual(['bmiOverweight']);
    expect(k(100, 0.5)).toEqual([]);
    expect(k(100, -2.3)).toEqual(['bmiThin']);
    expect(k(100, -2.9)).toEqual(['bmiThin']);
    expect(assess('bmi', 'm', 100, at(100, -3.3)).warnings[0]).toMatchObject({ kind: 'bmiVeryThin', level: 'strong' });
  });
  it('confini z', () => {
    expect(k(100, 2)).toEqual(['bmiOverweight']);   // z = +2 esatto: sovrappeso (non oltre +2)
    expect(k(100, 1)).toEqual([]);                  // z = +1 esatto: nessun avviso
    expect(k(100, -2)).toEqual([]);                 // z = −2 esatto: nessun avviso
  });
  it('nessuna soglia sotto 61 mesi', () => {
    expect(k(60, 2.5)).toEqual([]);
    expect(k(48, -2.5)).toEqual([]);
    expect(k(61, 2.5)).toEqual(['bmiObese']);
    expect(GROWTH_RULES.bmiFromMonths).toBe(61);
  });
});

describe('tappa pubertà', () => {
  const P = MS.items.find((i) => i.id === 'p-puberty');
  it('dati', () => {
    expect(P.bySex).toEqual({ f: { from: 96, to: 156 }, m: { from: 108, to: 168 } });
    expect(P.it.title).toBe('Primi segni di pubertà');
    expect(P.early.src).toEqual(['X7', 'X10']);
    expect(P.it.info).toMatch(/precoce prima degli 8 anni.*il 95% inizia tra 9 e 14 anni/);
  });
  it('visibile da 72 mesi, mai tra le passate', () => {
    expect(isRelevant(P, 71)).toBe(false);
    expect(isRelevant(P, 72)).toBe(true);
    expect(isRelevant(P, 200)).toBe(true);
    expect(isPast(P, 200)).toBe(false);
    expect(split([P], 140, new Set()).past).toEqual([]);
  });
  it('nessun avviso "late" nell\'età dell\'app', () => {
    for (const m of [72, 95, 96, 120, 144, 168, 200]) for (const sex of ['f', 'm', undefined]) expect(['upcoming', 'info']).toContain(status(P, m, false, { sex }));
    expect(status(P, 100, false, { sex: 'f' })).toBe('info');
    expect(status(P, 100, false, { sex: 'm' })).toBe('upcoming');
  });
  it('early se segnata prima di 96 (F) o 108 (M) mesi', () => {
    expect(earlyBefore(P, 'f')).toBe(96); expect(earlyBefore(P, 'm')).toBe(108); expect(earlyBefore(P, undefined)).toBe(96);
    expect(status(P, 120, true, { sex: 'f', doneMonths: 95.9 })).toBe('early');
    expect(status(P, 120, true, { sex: 'f', doneMonths: 96 })).toBe('done');
    expect(status(P, 120, true, { sex: 'm', doneMonths: 107.9 })).toBe('early');
    expect(status(P, 120, true, { sex: 'm', doneMonths: 108 })).toBe('done');
    expect(status(P, 90, true, { sex: 'f', doneMonths: 90 })).toBe('early'); // segnata ora, sotto soglia
    expect(status(P, 100, true, { sex: undefined, doneMonths: 100 })).toBe('done');
    expect(status(P, 100, true, { sex: 'f' })).toBe('done');
  });
  it('finestra generica per sesso ignoto', () => {
    expect(windowOf(P, 'f')).toEqual({ from: 96, to: 156 });
    expect(windowOf(P, undefined)).toEqual({ from: 96, to: 168 });
  });
});
