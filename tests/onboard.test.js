import { describe, it, expect } from 'vitest';
import { initialFromImport, finishOnboarding } from '../src/lib/onboard.js';

const remote = {
  kids: [{ id: 'k1', birth: '2024-01-02', name: 'Ada' }],
  growth: [{ id: 'g1', kidId: 'k1', date: '2024-06-01', updatedAt: '2024-06-01T00:00:00Z' }],
  meds: [{ id: 'm1', kidId: 'k1', name: 'x', at: '2020-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z' }],
  medPlans: [], deleted: { zz: '2024-01-01T00:00:00Z' }
};

describe('onboarding da dati condivisi', () => {
  it('costruisce lo stato iniziale e il riepilogo', () => {
    const r = initialFromImport(remote);
    expect(r.kids).toHaveLength(1);
    expect(r.summary).toEqual({ kids: 1, names: ['Ada'], growth: 1, meds: 1 });
    expect(r.deleted.zz).toBeTruthy();
  });
  it('file senza bimbi: nessun bimbo', () => {
    expect(initialFromImport({ ...remote, kids: [], growth: [], meds: [] }).kids).toHaveLength(0);
  });
  it('finish mantiene id e dati, ripulisce il nome', () => {
    const imp = initialFromImport(remote);
    const f = finishOnboarding([{ ...imp.kids[0], name: ' Ada B ' }], imp);
    expect(f.kids[0].id).toBe('k1');
    expect(f.kids[0].name).toBe('Ada B');
    expect(f.extra.growth).toHaveLength(1);
    expect(finishOnboarding([{ birth: '2024-01-01', name: 'a' }], null).extra).toEqual({});
  });
});
