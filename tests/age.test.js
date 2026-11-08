import { describe, it, expect } from 'vitest';
import { ageMatch, ageInMonths, formatAge } from '../src/lib/age.js';
import { processTerm } from '../src/lib/text.js';

const Y2 = [24, 36];
const Y3 = [36, 48];

describe('tolleranza di 3 mesi', () => {
  it('2 anni e 10 mesi vede schede dei 2 e dei 3 anni', () => {
    expect(ageMatch(34, ...Y2)).toBe('in');
    expect(ageMatch(34, ...Y3)).toBe('near');
  });
  it('3 anni e 3 mesi vede schede dei 3 e dei 2 anni', () => {
    expect(ageMatch(39, ...Y3)).toBe('in');
    expect(ageMatch(39, ...Y2)).toBe('near');
  });
  it('oltre la tolleranza la scheda è esclusa', () => {
    expect(ageMatch(40, ...Y2)).toBe(null);
    expect(ageMatch(32, ...Y3)).toBe(null);
  });
  it('neonato e fascia 0-6 mesi', () => {
    expect(ageMatch(0, 0, 6)).toBe('in');
    expect(ageMatch(9, 0, 6)).toBe('near');
    expect(ageMatch(10, 0, 6)).toBe(null);
  });
});

describe('calcolo età', () => {
  it('mesi compiuti', () => {
    expect(ageInMonths('2024-01-15', new Date(2026, 10, 8))).toBe(33);
    expect(ageInMonths('2024-01-08', new Date(2026, 10, 8))).toBe(34);
  });
  it('formato leggibile', () => {
    expect(formatAge('2024-01-08', 'it', new Date(2026, 10, 8))).toBe('2 anni e 10 mesi');
    expect(formatAge('2024-01-08', 'ru', new Date(2026, 10, 8))).toBe('2 года 10 месяцев');
    expect(formatAge('2026-10-25', 'it', new Date(2026, 10, 8))).toBe('2 settimane');
  });
});

describe('testo', () => {
  it('stemming italiano unisce singolare e plurale', () => {
    expect(processTerm('bambini', 'it')).toBe(null); // stopword
    expect(processTerm('capricci', 'it')).toBe(processTerm('capriccio', 'it'));
    expect(processTerm('pupù', 'it')).toBe('pupu');
  });
  it('russo: ё e desinenze', () => {
    expect(processTerm('температура', 'ru')).toBe(processTerm('температуры', 'ru'));
    expect(processTerm('йогурт', 'ru')).toBe('йогурт');
  });
});
