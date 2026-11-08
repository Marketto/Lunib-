import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { filterByAge } from '../src/lib/age.js';

const all = fs.readdirSync('content/cards').flatMap((f) => JSON.parse(fs.readFileSync(`content/cards/${f}`, 'utf8')));
const card = (id) => all.find((c) => c.id === id);
const texts = (items) => items.map((x) => x.t).join(' | ');

describe('dettagli della scheda filtrati per età', () => {
  it('febbre a 34 mesi: niente soglie dei lattanti', () => {
    const r = filterByAge(card('febbre').it.research, 34);
    expect(texts(r)).not.toMatch(/sotto i 3 mesi|3–6 mesi/);
    const u = filterByAge(card('febbre').it.urgent, 34);
    expect(texts(u)).not.toMatch(/Fontanella/);
  });
  it('febbre a 4 mesi: soglie 0–3 (vicina) e 3–6 (in fascia)', () => {
    const r = filterByAge(card('febbre').it.research, 4);
    expect(r.find((x) => x.from === 0 && x.to === 3)?.match).toBe('near');
    expect(r.find((x) => x.from === 3 && x.to === 6)?.match).toBe('in');
  });
  it('linguaggio a 2a10m: tappe dei 30 e 36 mesi, non quelle dei 12', () => {
    const r = texts(filterByAge(card('ritardo-linguaggio').it.research, 34));
    expect(r).toMatch(/30 mesi/);
    expect(r).toMatch(/36 mesi/);
    expect(r).not.toMatch(/a 12 mesi/);
  });
  it('schermi a 8 mesi: niente "1 ora a 2 anni"', () => {
    const r = texts(filterByAge(card('schermi').it.research, 8));
    expect(r).toMatch(/prima dei 2 anni/);
    expect(r).not.toMatch(/a 2 anni non più/);
  });
  it('tosse a 6 mesi: niente miele come consiglio, sì avviso "mai miele"', () => {
    const tips = texts(filterByAge(card('tosse-raffreddore').it.tips, 6));
    expect(tips).not.toMatch(/miele/);
    const res = texts(filterByAge(card('tosse-raffreddore').it.research, 6));
    expect(res).toMatch(/Mai miele/);
  });
  it('senza figlio selezionato si vede tutto', () => {
    expect(filterByAge(card('febbre').it.research, null).length).toBe(card('febbre').it.research.length);
  });
});

describe('soglie di sicurezza senza tolleranza', () => {
  it('a 10 mesi nessun consiglio sul miele, solo il divieto', () => {
    const tips = filterByAge(card('tosse-raffreddore').it.tips, 10).map((x) => x.t).join(' ');
    expect(tips).not.toMatch(/miele/);
    const res = filterByAge(card('tosse-raffreddore').it.research, 10).map((x) => x.t).join(' ');
    expect(res).toMatch(/Mai miele/);
    expect(res).not.toMatch(/allevia la tosse/);
  });
  it('a 13 mesi il miele è ammesso e il divieto sparisce', () => {
    const res = filterByAge(card('tosse-raffreddore').it.research, 13).map((x) => x.t).join(' ');
    expect(res).toMatch(/allevia la tosse/);
    expect(res).not.toMatch(/Mai miele/);
  });
  it('a 22 mesi niente "1 ora a 2 anni"', () => {
    const res = filterByAge(card('schermi').it.research, 22).map((x) => x.t).join(' ');
    expect(res).not.toMatch(/a 2 anni non più/);
  });
});
