import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { filterByAge } from '../src/lib/age.js';

beforeAll(() => {
  globalThis.fetch = async (url) => {
    const body = fs.readFileSync(path.resolve('public', String(url).replace(/^\.?\/?/, '')), 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  };
});
const { search } = await import('../src/lib/search.js');
const all = fs.readdirSync('content/cards').flatMap((f) => JSON.parse(fs.readFileSync(`content/cards/${f}`, 'utf8')));
const card = (id) => all.find((c) => c.id === id);

describe('nuove schede 3–6 e guide', () => {
  const cases = [
    ['it', 'pipì a letto', 60, 'pipi-a-letto'],
    ['it', 'balbetta', 40, 'balbuzie'],
    ['it', 'urla di notte', 30, 'incubi-terrori'],
    ['it', 'trampolino', 50, 'giochi-3-6'],
    ['it', 'girello', 8, 'giochi-0-12'],
    ['it', 'cosa può mangiare', 8, 'cibi-6-12'],
    ['it', 'succo di frutta', 20, 'cibi-1-3'],
    ['it', 'paura del buio', 48, 'paure'],
    ['it', 'cosa sa fare a 4 anni', 50, 'tappe-3-6'],
    ['ru', 'энурез', 60, 'pipi-a-letto'],
    ['ru', 'заикается', 40, 'balbuzie'],
    ['ru', 'батут', 50, 'giochi-3-6'],
    ['ru', 'что можно есть', 8, 'cibi-6-12']
  ];
  for (const [lang, q, m, id] of cases) {
    it(`[${lang}] "${q}" a ${m} mesi → ${id}`, async () => {
      const r = await search(lang, q, m);
      expect(r.slice(0, 3).map((x) => x.id), JSON.stringify(r.slice(0, 4).map((x) => [x.id, x.score]))).toContain(id);
    });
  }
  it('cibi 3–6: frutta secca intera "no" a 4 anni, "sì sorvegliati" a 5 anni e mezzo', () => {
    const at48 = filterByAge(card('cibi-3-6').it.guide, 48).filter((x) => /Frutta secca intera/.test(x.t));
    expect(at48.map((x) => x.v)).toEqual(['no']);
    const at66 = filterByAge(card('cibi-3-6').it.guide, 66).filter((x) => /Frutta secca intera/.test(x.t));
    expect(at66.map((x) => x.v)).toEqual(['si']);
  });
  it('cibi 6–12: miele e succo "no" non compaiono come consigli', () => {
    const g = card('cibi-6-12').it.guide;
    expect(g.find((x) => /Miele/.test(x.t)).v).toBe('no');
  });
  it('ogni voce delle guide ha motivo e fonte presente nella scheda', () => {
    for (const c of all.filter((x) => x.it.guide)) {
      for (const x of c.it.guide) {
        expect(x.why.length).toBeGreaterThan(10);
        expect(c.sources).toContain(x.src);
      }
    }
  });
});
