import { describe, it, expect } from 'vitest';
import { checkPlan, findPlan, medKey, filterLog } from '../src/lib/meds.js';
import { mergeData, buildQuickPayload, encodeQr, decodeQr } from '../src/lib/sync.js';

const at = (h) => new Date(Date.parse('2026-11-09T12:00:00Z') - h * 3600000).toISOString();
const e = (id, h, extra = {}) => ({ id, kidId: 'k', name: 'Vitamina D', at: at(h), amount: 5, unit: 'gocce', ...extra });
const plan = { id: 'p1', kidId: 'k', name: 'Vitamina D', intervalH: 24, maxPerDay: 1, dose: { amount: 5, unit: 'gocce' }, until: '2026-11-09', updatedAt: '2026-11-01T00:00:00Z' };

describe('checkPlan', () => {
  it('no plan, no results', () => expect(checkPlan(e('n', 0), [], null)).toEqual([]));
  it('too soon and too many', () => {
    const r = checkPlan(e('n', 0), [e('a', 6)], plan).map((x) => x.kind);
    expect(r).toContain('planTooSoon');
    expect(r).toContain('planTooMany');
    expect(checkPlan(e('n', 0), [e('a', 30)], { ...plan, until: undefined })).toEqual([]);
  });
  it('ignores other medicines and other kids', () => {
    expect(checkPlan(e('n', 0), [e('a', 1, { name: 'Altro' }), e('b', 1, { kidId: 'z' })], plan).map((x) => x.kind)).toEqual([]);
  });
  it('ended after until date', () => {
    const r = checkPlan({ ...e('n', 0), at: '2026-11-20T12:00:00Z' }, [], plan);
    expect(r.map((x) => x.kind)).toContain('planEnded');
  });
  it('dose differs is info only', () => {
    const r = checkPlan(e('n', 0, { amount: 10 }), [], plan);
    expect(r).toEqual([expect.objectContaining({ kind: 'planDoseDiff', level: 'info' })]);
    expect(checkPlan(e('n', 0, { unit: 'ml' }), [], plan)[0].kind).toBe('planDoseDiff');
  });
});

describe('matching', () => {
  it('by name, case and spaces insensitive, same kid', () => {
    expect(findPlan([plan], e('x', 0, { name: '  vitamina   d ' }))).toBe(plan);
    expect(findPlan([plan], e('x', 0, { kidId: 'z' }))).toBeNull();
    expect(medKey({ name: 'VITAMINA D' })).toBe(medKey({ name: 'vitamina d ' }));
    expect(filterLog([e('a', 1), e('b', 2, { name: 'vitamina d' })], { med: medKey(e('a', 1)) })).toHaveLength(2);
  });
  it('by active, generic', () => {
    const p = { id: 'p2', kidId: 'k', name: 'Tachipirina', active: 'paracetamolo' };
    expect(findPlan([p], { kidId: 'k', name: 'Paracetamolo', active: 'paracetamolo' })).toBe(p);
    expect(findPlan([p], { kidId: 'k', name: 'Ibuprofene', active: 'ibuprofene' })).toBeNull();
  });
});

describe('sync of plans', () => {
  const L = { kids: [{ id: 'k', birth: '2025-01-01' }], growth: [], meds: [], medPlans: [plan], deleted: {} };
  it('merge: newer wins, union, tombstone', () => {
    const R = { kids: L.kids, medPlans: [{ ...plan, intervalH: 12, updatedAt: '2026-11-02T00:00:00Z' }, { id: 'p3', kidId: 'k', name: 'X', updatedAt: '2026-11-02T00:00:00Z' }], deleted: {} };
    const m = mergeData(L, R);
    expect(m.medPlans.find((p) => p.id === 'p1').intervalH).toBe(12);
    expect(m.medPlans).toHaveLength(2);
    expect(mergeData(L, { ...R, medPlans: [{ ...plan, intervalH: 3, updatedAt: '2026-10-01T00:00:00Z' }] }).medPlans[0].intervalH).toBe(24);
    const t = mergeData(L, { kids: L.kids, medPlans: [], deleted: { p1: '2026-11-05T00:00:00Z' } });
    expect(t.medPlans).toHaveLength(0);
  });
  it('QR payload carries plans of involved kids', async () => {
    const now = Date.parse('2026-11-09T12:00:00Z');
    const st = { ...L, meds: [{ ...e('m', 1), updatedAt: at(1) }] };
    const p = buildQuickPayload(st, { now });
    expect(p.medPlans.map((x) => x.id)).toEqual(['p1']);
    const back = await decodeQr((await encodeQr(p, 'passphrase1')).data, 'passphrase1');
    expect(back.medPlans[0].id).toBe('p1');
  });
});
