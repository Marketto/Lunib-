import { describe, it, expect } from 'vitest';
import { INDICATORS, INPUTS, lmsAt, zScore, assess, bmiOf, GROWTH_RULES } from '../src/lib/growth.js';
import { validBirth, ageInMonths } from '../src/lib/age.js';
import { vitDLimit, checkDose } from '../src/lib/meds.js';

describe('crescita fino a 12 anni', () => {
  it('altezza a 100 e 130 mesi ok, peso solo fino a 120', () => {
    expect(INDICATORS.height.maxMonths).toBe(144);
    expect(INDICATORS.weight.maxMonths).toBe(120);
    expect(lmsAt('height', 'm', 100)).toHaveLength(3);
    expect(lmsAt('height', 'f', 130)).toHaveLength(3);
    expect(lmsAt('height', 'm', 144)).toHaveLength(3);
    expect(lmsAt('weight', 'm', 100)).toHaveLength(3);
    expect(lmsAt('weight', 'm', 120)).toHaveLength(3);
    expect(lmsAt('weight', 'm', 130)).toBeNull();
    expect(zScore('weight', 'm', 130, 35)).toBeNull();
    const z = zScore('height', 'm', 130, lmsAt('height', 'm', 130)[1]);
    expect(Math.abs(z)).toBeLessThan(1e-6);
    expect(assess('height', 'f', 100, 120).z).not.toBeNull();
  });
  it('BMI per età da 24 a 144 mesi', () => {
    expect(INPUTS).not.toContain('bmi');
    expect(lmsAt('bmi', 'm', 23)).toBeNull();
    expect(lmsAt('bmi', 'm', 24)).toHaveLength(3);
    expect(lmsAt('bmi', 'f', 144)).toHaveLength(3);
    expect(lmsAt('bmi', 'm', 145)).toBeNull();
    const median = lmsAt('bmi', 'm', 100)[1];
    expect(Math.abs(zScore('bmi', 'm', 100, median))).toBeLessThan(1e-6);
    const z = zScore('bmi', 'm', 100, bmiOf(20, 120)); // BMI 13,9
    expect(z).toBeLessThan(0);
    expect(z).toBeGreaterThan(-3);
    expect(bmiOf(0, 120)).toBeNull();
    expect(GROWTH_RULES.implausible.bmi).toEqual([-5, 5]);
  });
  it('BMI: valore improbabile segnalato', () => {
    expect(assess('bmi', 'm', 100, 40).warnings[0].kind).toBe('implausible');
  });
});

describe('età 0-12 anni', () => {
  const today = new Date('2026-11-09T12:00:00');
  it('onboarding accetta un bambino di 11 anni', () => {
    expect(validBirth('2015-05-01', today)).toBe(true);
    expect(ageInMonths('2015-05-01', today)).toBe(138);
    expect(validBirth('2026-11-01', today)).toBe(true);
  });
  it('rifiuta date future o bambini oltre i 12 anni', () => {
    expect(validBirth('2026-12-01', today)).toBe(false);
    expect(validBirth('2010-01-01', today)).toBe(false);
    expect(validBirth('', today)).toBe(false);
  });
  it('limiti medicine robusti fino a 144 mesi', () => {
    for (const m of [72, 100, 131, 132, 144, 300]) expect(() => vitDLimit(m)).not.toThrow();
    expect(vitDLimit(131)).toBeTruthy();
    expect(vitDLimit(132).iu).toBe(4000);
    expect(vitDLimit(216)).toBeNull();
    const e = { id: 'x', kidId: 'k', active: 'vitaminaD', at: '2026-11-09T08:00:00', amount: 1000, unit: 'UI' };
    expect(() => checkDose(e, [e], { months: 140, weight: null })).not.toThrow();
  });
});
