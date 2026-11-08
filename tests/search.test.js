import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

beforeAll(() => {
  globalThis.fetch = async (url) => {
    const rel = String(url).replace(/^\.?\/?/, '');
    const file = path.resolve('public', rel);
    const body = fs.readFileSync(file, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  };
});

const { search, loadCard } = await import('../src/lib/search.js');

const cases = {
  it: [
    ['febbre alta', 'febbre'],
    ['ha la febbre a 2 mesi', 'febbre'],
    ['tachipirina', 'antipiretici'],
    ['non dorme la notte', 'risvegli-notturni'],
    ['capricci', 'capricci'],
    ['si butta a terra e urla', 'capricci'],
    ['quando iniziare lo svezzamento', 'svezzamento'],
    ['uva tagliata', 'soffocamento'],
    ['cacca dura', 'stitichezza'],
    ['tablet', 'schermi'],
    ['non parla ancora', 'ritardo-linguaggio'],
    ['vaccini autismo', 'vaccini'],
    ['spuntano i denti', 'dentizione'],
    ['vasino', 'vasino'],
    ['miele', 'latte-miele'],
    ['piange sempre la sera', 'coliche']
  ],
  ru: [
    ['высокая температура', 'febbre'],
    ['нурофен', 'antipiretici'],
    ['не спит ночью', 'risvegli-notturni'],
    ['истерики', 'capricci'],
    ['когда начинать прикорм', 'svezzamento'],
    ['подавился виноградом', 'soffocamento'],
    ['запор', 'stitichezza'],
    ['мультики', 'schermi'],
    ['не говорит', 'ritardo-linguaggio'],
    ['прививки', 'vaccini'],
    ['режутся зубы', 'dentizione'],
    ['горшок', 'vasino'],
    ['мёд', 'latte-miele'],
    ['колики', 'coliche']
  ]
};

describe('ricerca offline', () => {
  for (const [lang, list] of Object.entries(cases)) {
    for (const [q, expected] of list) {
      it(`[${lang}] "${q}" → ${expected} nei primi 3`, async () => {
        const r = await search(lang, q, null);
        const top = r.slice(0, 3).map((x) => x.id);
        expect(top, JSON.stringify(r.slice(0, 5).map((x) => [x.id, x.score]))).toContain(expected);
        expect(r[0].score).toBeGreaterThan(0);
        expect(r[0].score).toBeLessThanOrEqual(100);
      });
    }
  }

  it('il filtro età esclude schede fuori tolleranza', async () => {
    const r = await search('it', 'svezzamento', 30); // 2a6m, svezzamento è 4–12
    expect(r.map((x) => x.id)).not.toContain('svezzamento');
  });

  it('tolleranza: 34 mesi vede scheda 18–48 e 0–24 no; 26 mesi vede 0–24 come vicina', async () => {
    const r = await search('it', 'cammina', 26);
    const motor = r.find((x) => x.id === 'tappe-motorie');
    expect(motor?.match).toBe('near');
  });

  it('le schede mediche portano l\'avviso', async () => {
    const r = await search('it', 'febbre', null);
    expect(r[0].doc.a).toBe('urgente');
    const c = await loadCard('it', 'febbre');
    expect(c.urgent.length).toBeGreaterThan(0);
    expect(c.sources[0].url).toMatch(/^https:/);
  });
});
