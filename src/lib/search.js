import MiniSearch from 'minisearch';
import { miniSearchOptions, SEARCH_BOOST } from './searchConfig.js';
import { ageMatch } from './age.js';
import { processTerm, tokenize } from './text.js';
import { SYNONYMS } from './synonyms.js';

// Lazy load: l'indice di una lingua si scarica solo alla prima ricerca/navigazione,
// il testo completo di una scheda solo quando la si apre (un blocco per categoria).
const indexCache = {};
const docsSync = {};
export function getDocsSync(lang) { return docsSync[lang] || null; }
const chunkCache = {};
const base = import.meta.env?.BASE_URL ?? './';

export function loadIndex(lang) {
  if (!indexCache[lang]) {
    indexCache[lang] = fetch(`${base}data/${lang}/index.json`)
      .then((r) => {
        if (!r.ok) throw new Error('index ' + r.status);
        return r.json();
      })
      .then(({ docs, index }) => ({
        docs: (docsSync[lang] = docs),
        ms: MiniSearch.loadJS(index, miniSearchOptions(lang))
      }))
      .catch((e) => {
        delete indexCache[lang];
        throw e;
      });
  }
  return indexCache[lang];
}

export async function loadCard(lang, id) {
  const { docs } = await loadIndex(lang);
  const meta = docs[id];
  if (!meta) return null;
  const key = `${lang}/${meta.c}`;
  if (!chunkCache[key]) {
    chunkCache[key] = fetch(`${base}data/${lang}/c/${meta.c}.json`).then((r) => r.json());
  }
  const chunk = await chunkCache[key];
  return { id, meta, ...chunk[id] };
}

// Ogni parola significativa della domanda diventa un "gruppo": il termine stesso
// più eventuali sinonimi colloquiali (es. nanna → sonno).
function analyzeQuery(query, lang) {
  const syn = SYNONYMS[lang] || {};
  const groups = [];
  const seen = new Set();
  for (const w of tokenize(query, lang)) {
    const q = processTerm(w, lang);
    if (!q || seen.has(q)) continue;
    seen.add(q);
    const alts = new Set();
    for (const [k, list] of Object.entries(syn)) {
      if (w === k || w.startsWith(k)) {
        for (const s of list) for (const tk of tokenize(s, lang)) {
          const p = processTerm(tk, lang);
          if (p && p !== q) alts.add(p);
        }
      }
    }
    groups.push({ q, alts: [...alts] });
  }
  return groups;
}

const FIELD_WEIGHT = { title: 1, keywords: 0.9, summary: 0.65, text: 0.4 };

function termQuality(q, t) {
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.6 + 0.4 * (q.length / t.length);
  if (q.startsWith(t)) return 0.85 * (t.length / q.length);
  return 0;
}

// Quanto bene un gruppo della domanda è "coperto" dalla scheda (0–1)
function groupScore(group, match) {
  let best = 0;
  for (const [t, fields] of Object.entries(match)) {
    const fw = Math.max(...fields.map((f) => FIELD_WEIGHT[f] || 0));
    let qual = termQuality(group.q, t);
    if (!qual) {
      for (const a of group.alts) qual = Math.max(qual, 0.75 * termQuality(a, t));
    }
    best = Math.max(best, qual * fw);
  }
  return best;
}

/**
 * Ricerca offline con indice di pertinenza 0–100.
 * La pertinenza è assoluta, non relativa al primo risultato:
 *  - per ogni parola della domanda: dove compare (titolo > parole chiave > riassunto > testo)
 *    e quanto è esatta la corrispondenza (esatta > prefisso > sinonimo > simile)
 *  - una piccola quota dipende dal punteggio BM25 rispetto al migliore
 *  - le schede in "fascia vicina" (±3 mesi) pesano un po' meno
 */
export async function search(lang, query, months = null) {
  const { ms, docs } = await loadIndex(lang);
  const groups = analyzeQuery(query, lang);
  if (!groups.length) return [];
  const expanded = groups.flatMap((g) => [g.q, ...g.alts]).join(' ');

  const raw = ms.search(expanded, {
    boost: SEARCH_BOOST,
    prefix: (term) => term.length >= 3,
    fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
    combineWith: 'OR'
  });

  const results = [];
  for (const r of raw) {
    const d = docs[r.id];
    const match = ageMatch(months, d.f, d.to);
    if (!match) continue;
    const coverage = groups.reduce((sum, g) => sum + groupScore(g, r.match), 0) / groups.length;
    results.push({ id: r.id, doc: d, match, raw: r.score, coverage });
  }
  if (!results.length) return [];

  const top = Math.max(...results.map((r) => r.raw));
  for (const r of results) {
    const ageFactor = r.match === 'in' ? 1 : 0.85;
    // parole trovate solo per somiglianza (fuzzy) danno comunque un minimo
    const coverage = Math.max(r.coverage, 0.12);
    r.score = Math.round(100 * ageFactor * (0.85 * coverage + 0.15 * (r.raw / top)));
  }
  return results
    .filter((r) => r.score >= 20)
    .sort((a, b) => b.score - a.score || b.raw - a.raw);
}

export async function listByCategory(lang, category, months = null) {
  const { docs } = await loadIndex(lang);
  return Object.entries(docs)
    .filter(([, d]) => d.c === category)
    .map(([id, d]) => ({ id, doc: d, match: ageMatch(months, d.f, d.to) }))
    .filter((r) => r.match)
    .sort((a, b) => (a.match === b.match ? a.doc.f - b.doc.f : a.match === 'in' ? -1 : 1));
}

export async function listForAge(lang, months, limit = 6) {
  const { docs } = await loadIndex(lang);
  if (months == null) return [];
  const list = Object.entries(docs)
    .map(([id, d]) => ({ id, doc: d, match: ageMatch(months, d.f, d.to, 0) }))
    .filter((r) => r.match === 'in');
  // le schede con fascia più stretta sono più specifiche per quell'età
  list.sort((a, b) => (a.doc.to - a.doc.f) - (b.doc.to - b.doc.f));
  return list.slice(0, limit);
}
