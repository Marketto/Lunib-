import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { TOUR } from '../src/data/tour.js';
import { pendingSlides, markSeen, cmpVer } from '../src/lib/tour.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const ROUTES = ['', 'giochi', 'suoni', 'diario', 'bimbi', null];

describe('dati del giro', () => {
  it('6-9 slide con id unici', () => {
    expect(TOUR.length).toBeGreaterThanOrEqual(6);
    expect(TOUR.length).toBeLessThanOrEqual(9);
    expect(new Set(TOUR.map((s) => s.id)).size).toBe(TOUR.length);
  });
  it('titolo e testo IT e RU', () => {
    for (const s of TOUR) for (const l of ['it', 'ru']) {
      expect(s[l]?.title?.trim(), `${s.id} ${l} title`).toBeTruthy();
      expect(s[l]?.text?.trim(), `${s.id} ${l} text`).toBeTruthy();
    }
  });
  it('since è semver valido e non oltre la versione del pacchetto; tab valido', () => {
    for (const s of TOUR) {
      expect(s.since).toMatch(/^\d+\.\d+\.\d+$/);
      expect(cmpVer(s.since, pkg.version)).toBeLessThanOrEqual(0);
      expect(ROUTES).toContain(s.tab);
    }
  });
});

describe('selezione', () => {
  const S = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  it('installazione nuova: tutte', () => expect(pendingSlides([], S).map((x) => x.id)).toEqual(['a', 'b', 'c']));
  it('solo le nuove', () => expect(pendingSlides(['a', 'b'], S).map((x) => x.id)).toEqual(['c']));
  it('tutte viste: nessuna', () => expect(pendingSlides(['a', 'b', 'c', 'zz'], S)).toEqual([]));
  it('seen assente o id sconosciuti', () => {
    expect(pendingSlides(undefined, S)).toHaveLength(3);
    expect(pendingSlides(['x'], S)).toHaveLength(3);
  });
  it('markSeen senza duplicati', () => expect(markSeen(['a'], ['a', 'b'])).toEqual(['a', 'b']));
  it('cmpVer', () => { expect(cmpVer('1.9.0', '1.13.0')).toBe(-1); expect(cmpVer('1.13.0', '1.13.0')).toBe(0); expect(cmpVer('2.0.0', '1.13.9')).toBe(1); });
});
