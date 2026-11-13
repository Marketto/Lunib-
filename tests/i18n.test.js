import { describe, it, expect } from 'vitest';
import { STRINGS, MILESTONE_TEXT, LOCALE } from '../src/lib/i18n.js';
import { TERMS, TERMS_VERSION } from '../src/lib/terms.js';
import { TRACK_TEXT, SOUND_STRINGS } from '../src/lib/audio/tracks-i18n.js';
import { SYNONYMS } from '../src/lib/synonyms.js';
import { CATEGORIES, GENERAL_QUOTES, pickQuote } from '../src/lib/categories.js';
import { LANGS } from '../src/lib/searchConfig.js';
import { formatAge, formatRange } from '../src/lib/age.js';
import { processTerm } from '../src/lib/text.js';
import { DIARY_TEXT } from '../src/components/Diary.jsx';
import { GAME_TEXT } from '../src/components/Games.jsx';
import { SHARE_TEXT } from '../src/components/Share.jsx';
import { TX } from '../src/components/SyncCard.jsx';

// Ogni chiave (anche annidata) presente in it deve esistere in ru e en, con lo stesso tipo (stringa/funzione/lista)
const shape = (o) => (o && typeof o === 'object' && !Array.isArray(o)
  ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)]))
  : Array.isArray(o) ? `list${o.length}` : typeof o);
const missing = (a, b, path = '') => Object.keys(a).flatMap((k) => {
  if (!(k in b)) return [`${path}${k}`];
  return typeof a[k] === 'object' && !Array.isArray(a[k]) ? missing(a[k], b[k], `${path}${k}.`) : [];
});

describe('lingue', () => {
  it('LANGS contiene it, ru, en', () => expect(LANGS).toEqual(['it', 'ru', 'en']));

  for (const [name, map, skip] of [
    ['STRINGS', STRINGS, ['srcTypes']], ['MILESTONE_TEXT', MILESTONE_TEXT, []], ['TERMS', TERMS, []],
    ['SOUND_STRINGS', SOUND_STRINGS, []], ['DIARY_TEXT', DIARY_TEXT, []], ['GAME_TEXT', GAME_TEXT, []],
    ['SHARE_TEXT', SHARE_TEXT, []], ['SyncCard TX', TX, []]
  ]) {
    for (const l of ['ru', 'en']) {
      it(`${name}: ogni chiave it ha ${l}`, () => {
        expect(map[l], `${name}.${l}`).toBeTruthy();
        expect(missing(map.it, map[l]).filter((k) => !skip.includes(k))).toEqual([]);
        // liste (iosSteps, safety, sections…) con la stessa lunghezza
        for (const [k, v] of Object.entries(map.it)) if (Array.isArray(v)) expect(map[l][k]?.length, `${name}.${k}`).toBe(v.length);
      });
    }
  }

  it('STRINGS: le funzioni restituiscono testo in tutte le lingue', () => {
    for (const l of ['it', 'ru', 'en']) {
      expect(STRINGS[l].results(1)).toBeTruthy();
      expect(STRINGS[l].results(5)).toContain('5');
      expect(STRINGS[l].forAge('Anna')).toContain('Anna');
    }
    expect(STRINGS.en.results(1)).toBe('1 result');
    expect(STRINGS.en.results(3)).toBe('3 results');
  });

  it('tracce: ogni traccia ha nome e descrizione in en', () => {
    for (const [id, v] of Object.entries(TRACK_TEXT)) {
      expect(v.en?.length, id).toBe(2);
      expect(v.en.every(Boolean), id).toBe(true);
    }
  });

  it('categorie e frasi: en presente e non vuoto', () => {
    for (const c of CATEGORIES) {
      expect(c.name.en, c.id).toBeTruthy();
      expect(c.quotes.en.length, c.id).toBe(c.quotes.it.length);
    }
    expect(GENERAL_QUOTES.en.length).toBe(GENERAL_QUOTES.it.length);
    expect(pickQuote('en', 'sonno', 0)).toMatch(/[a-z]/);
  });

  it('sinonimi en definiti', () => expect(Object.keys(SYNONYMS.en).length).toBeGreaterThan(30));

  it('età e fasce in inglese (singolare/plurale, metrico)', () => {
    const t = new Date('2026-11-14T12:00:00');
    expect(formatAge('2026-11-07', 'en', t)).toBe('1 week');
    expect(formatAge('2025-10-14', 'en', t)).toBe('1 year and 1 month');
    expect(formatAge('2024-05-14', 'en', t)).toBe('2 years and 6 months');
    expect(formatRange(0, 12, 'en')).toBe('0 – 1 year');
    expect(formatRange(6, 24, 'en')).toBe('6 months – 2 years');
    expect(formatRange(1, 3, 'en')).toBe('1 month – 3 months');
  });

  it('stemming inglese unisce singolare, plurale e gerundio', () => {
    expect(processTerm('naps', 'en')).toBe(processTerm('nap', 'en'));
    expect(processTerm('sleeping', 'en')).toBe(processTerm('sleep', 'en'));
    expect(processTerm('allergies', 'en')).toBe(processTerm('allergy', 'en'));
    expect(processTerm('the', 'en')).toBeNull();
  });

  it('locale en-US', () => expect(LOCALE.en).toBe('en-US'));
});

describe('testi sensibili en', () => {
  it('numero di emergenza: 112 e numero locale', () => {
    expect(STRINGS.en.emergency).toBe('Emergencies: 112 (EU) or your local emergency number');
    expect(STRINGS.en.disclaimer).toContain('112');
    expect(STRINGS.en.urgentTitle).toContain('112');
  });
  it('condizioni: versione 1.5 e nota che prevale l\'italiano', () => {
    expect(TERMS_VERSION).toBe('1.5');
    expect(TERMS.en.updated).toMatch(/Italian version prevails/);
    expect(TERMS.en.sections.length).toBe(TERMS.it.sections.length);
  });
  it('medicine: il testo en non è mai una posologia (nessuna istruzione "give/take N mg")', () => {
    const all = JSON.stringify([DIARY_TEXT.en.medsNever, DIARY_TEXT.en.planCopy, TERMS.en.sections[6]]);
    expect(all).toMatch(/does not calculate or suggest doses|do(es)? not suggest doses|NOT calculate or suggest doses/i);
    expect(DIARY_TEXT.en.medsNever).toMatch(/Always use the dose given on the packaging or by the pediatrician/);
  });
  it('soglie e numeri coincidono con l\'italiano (stesse cifre nelle frasi chiave)', () => {
    const nums = (s) => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(',', '.')).sort().join(',');
    for (const k of ['sub', 'chartNote', 'wFoot', 'medsIntro', 'beforeTerm']) expect(nums(DIARY_TEXT.en[k]), k).toBe(nums(DIARY_TEXT.it[k]));
    for (const k of Object.keys(DIARY_TEXT.it.w)) {
      if (typeof DIARY_TEXT.it.w[k] === 'string') expect(nums(DIARY_TEXT.en.w[k]), `w.${k}`).toBe(nums(DIARY_TEXT.it.w[k]));
    }
    for (const k of ['rcpNote', 'noCheck', 'rectalBand', 'vitDInfo', 'vitDNoIU', 'ok', 'noWeight']) expect(nums(DIARY_TEXT.en.c[k]), `c.${k}`).toBe(nums(DIARY_TEXT.it.c[k]));
    expect(nums(DIARY_TEXT.en.c.vitDRec({ period: 'infant' }))).toBe(nums(DIARY_TEXT.it.c.vitDRec({ period: 'infant' })));
    expect(nums(DIARY_TEXT.en.c.vitDRec({ period: 'child' }))).toBe(nums(DIARY_TEXT.it.c.vitDRec({ period: 'child' })));
    expect(nums(MILESTONE_TEXT.en.checks)).toBe(nums(MILESTONE_TEXT.it.checks));
    expect(nums(MILESTONE_TEXT.en.window.puberty())).toBe(nums(MILESTONE_TEXT.it.window.puberty()));
    for (const i of [0, 1, 2, 3]) expect(nums(SOUND_STRINGS.en.safety[i]), `safety${i}`).toBe(nums(SOUND_STRINGS.it.safety[i]));
  });
});
