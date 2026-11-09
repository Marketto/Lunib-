// Genera gli indici di ricerca offline e i blocchi di contenuto per il lazy load.
//   content/cards/*.json  + content/sources.json
//   → public/data/<lang>/index.json        (indice MiniSearch + metadati leggeri)
//   → public/data/<lang>/c/<categoria>.json (testo completo + fonti, caricato all'apertura)
import fs from 'node:fs';
import path from 'node:path';
import MiniSearch from 'minisearch';
import { miniSearchOptions, LANGS } from '../src/lib/searchConfig.js';
import { CATEGORY_IDS } from '../src/lib/categories.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cardsDir = path.join(root, 'content/cards');
const sources = JSON.parse(fs.readFileSync(path.join(root, 'content/sources.json'), 'utf8'));
const outDir = path.join(root, 'public/data');

const ALERTS = ['none', 'pediatra', 'urgente'];
const errors = [];
const cards = [];

for (const file of fs.readdirSync(cardsDir).filter((f) => f.endsWith('.json')).sort()) {
  const list = JSON.parse(fs.readFileSync(path.join(cardsDir, file), 'utf8'));
  for (const c of list) {
    const where = `${file}:${c.id}`;
    if (!CATEGORY_IDS.includes(c.category)) errors.push(`${where} categoria sconosciuta ${c.category}`);
    if (!(c.ageFrom >= 0 && c.ageTo > c.ageFrom && c.ageTo <= 144)) errors.push(`${where} fascia età non valida`);
    if (!ALERTS.includes(c.alert)) errors.push(`${where} alert non valido`);
    if (!c.sources?.length) errors.push(`${where} senza fonti`);
    for (const s of c.sources || []) if (!sources[s]) errors.push(`${where} fonte mancante ${s}`);
    for (const lang of LANGS) {
      const t = c[lang];
      if (!t?.title || !t?.summary || !t?.keywords?.length || !t?.research?.length || !t?.tips?.length) {
        errors.push(`${where} testo ${lang} incompleto`);
      }
      if (c.alert !== 'none' && !t?.redFlags?.length) errors.push(`${where} ${lang}: alert senza segnali d'allarme`);
      if (c.alert === 'urgente' && !t?.urgent?.length) errors.push(`${where} ${lang}: urgente senza segni di emergenza`);
    }
    for (const sec of ['research', 'tips', 'redFlags', 'urgent', 'guide']) {
      const a = c.it?.[sec] || [];
      const b = c.ru?.[sec] || [];
      const key = (x) => (typeof x === 'string' ? '*' : `${x.from ?? ''}-${x.to ?? ''}${x.strict ? '!' : ''}${x.v || ''}`);
      if (a.length !== b.length || a.some((x, i) => key(x) !== key(b[i]))) {
        errors.push(`${where} ${sec}: voci o fasce diverse tra it e ru`);
      }
      for (const x of a) {
        if (typeof x !== 'string' && !(x.t && (x.from == null || (x.from >= 0 && x.to > x.from)))) errors.push(`${where} ${sec}: voce non valida`);
      if (sec === 'guide' && !['si', 'limita', 'no'].includes(x.v)) errors.push(`${where} guide: verdetto non valido`);
      if (sec === 'guide' && (!x.why || !sources[x.src] || !c.sources.includes(x.src))) errors.push(`${where} guide: motivo o fonte mancante (${x.t})`);
      }
    }
    if (cards.some((x) => x.id === c.id)) errors.push(`${where} id duplicato`);
    cards.push(c);
  }
}

// Giochi: fonti esistenti e testi it/ru allineati
const games = JSON.parse(fs.readFileSync(path.join(root, 'content/games.json'), 'utf8'));
const EV = ['forte', 'media', 'raccomandato', 'tappa'];
for (const g of games) {
  const where = `games.json:${g.id}`;
  if (!(g.from >= 0 && g.to > g.from && g.to <= 144)) errors.push(`${where} fascia età non valida`);
  if (!['insieme', 'solo', 'entrambi'].includes(g.mode)) errors.push(`${where} modalità non valida`);
  if (!EV.includes(g.evidence)) errors.push(`${where} livello di evidenza non valido`);
  for (const sid of g.sources || []) if (!sources[sid]) errors.push(`${where} fonte mancante ${sid}`);
  if (!g.sources?.length) errors.push(`${where} senza fonti`);
  for (const k of ['materials', 'steps']) if (g.it[k]?.length !== g.ru[k]?.length) errors.push(`${where} ${k} diversi tra it e ru`);
  for (const lang of LANGS) for (const k of ['title', 'intro', 'why']) if (!g[lang]?.[k]) errors.push(`${where} ${lang}.${k} mancante`);
}

// Tappe: id univoci, fonti esistenti, finestre coerenti, testi it/ru
const miles = JSON.parse(fs.readFileSync(path.join(root, 'content/milestones.json'), 'utf8')).items;
const M_AREAS = ['motor', 'language', 'social', 'feeding', 'sleep', 'toilet', 'dental', 'puberty'];
const M_TYPES = ['who-1-99', 'cdc-75pct', 'guideline-range', 'not-before', 'puberty'];
const mSeen = new Set();
for (const m of miles) {
  const where = `milestones.json:${m.id}`;
  if (!m.id || mSeen.has(m.id)) errors.push(`${where} id mancante o duplicato`);
  mSeen.add(m.id);
  if (!M_AREAS.includes(m.area)) errors.push(`${where} area non valida ${m.area}`);
  if (!M_TYPES.includes(m.type)) errors.push(`${where} tipo finestra non valido ${m.type}`);
  if (!(m.from >= 0)) errors.push(`${where} from non valido`);
  if (m.to != null && !(m.to > m.from)) errors.push(`${where} to deve essere maggiore di from`);
  if (typeof m.warn !== 'boolean' || typeof m.verified !== 'boolean') errors.push(`${where} warn/verified devono essere booleani`);
  if (!m.src?.length) errors.push(`${where} senza fonti`);
  for (const sid of m.src || []) if (!sources[sid]) errors.push(`${where} fonte mancante ${sid}`);
  for (const lang of LANGS) if (!m[lang]?.title) errors.push(`${where} ${lang}.title mancante`);
  if (m.type === 'puberty') {
    if (!m.bySex || !m.early?.it || !m.early?.ru || !(m.showFrom >= 0)) errors.push(`${where} pubertà: servono bySex, early it/ru e showFrom`);
    for (const [sx, w] of Object.entries(m.bySex || {})) if (!['f', 'm'].includes(sx) || !(w.from >= 0 && w.to > w.from)) errors.push(`${where} bySex.${sx} non valido`);
    for (const sid of m.early?.src || []) if (!sources[sid]) errors.push(`${where} early fonte mancante ${sid}`);
    if (!m.early?.src?.length) errors.push(`${where} early senza fonti`);
  }
  if (!!m.it?.info !== !!m.ru?.info) errors.push(`${where} info presente solo in una lingua`);
}

if (errors.length) {
  console.error('Errori nei contenuti:\n - ' + errors.join('\n - '));
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });

for (const lang of LANGS) {
  const ms = new MiniSearch(miniSearchOptions(lang));
  const docs = {};
  const chunks = {};
  for (const c of cards) {
    const t = c[lang];
    ms.add({
      id: c.id,
      title: t.title,
      keywords: t.keywords.join(' '),
      summary: t.summary,
      text: [...t.research, ...t.tips, ...(t.redFlags || []), ...(t.urgent || []), ...(t.guide || [])]
        .map((x) => (typeof x === 'string' ? x : `${x.t} ${x.why || ''}`)).join(' ')
    });
    docs[c.id] = {
      t: t.title, s: t.summary, c: c.category, f: c.ageFrom, to: c.ageTo, a: c.alert, e: c.evidence
    };
    (chunks[c.category] ||= {})[c.id] = {
      ...t,
      evidence: c.evidence,
      sources: c.sources.map((id) => ({ id, ...sources[id] }))
    };
  }
  const dir = path.join(outDir, lang, 'c');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(outDir, lang, 'index.json'), JSON.stringify({ docs, index: ms.toJSON() }));
  for (const [cat, data] of Object.entries(chunks)) {
    fs.writeFileSync(path.join(dir, `${cat}.json`), JSON.stringify(data));
  }
  const size = fs.statSync(path.join(outDir, lang, 'index.json')).size;
  console.log(`[${lang}] ${cards.length} schede, indice ${(size / 1024).toFixed(1)} KB, ${Object.keys(chunks).length} blocchi`);
}
