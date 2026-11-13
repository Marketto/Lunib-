import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../lib/i18n.js';
import { CATEGORIES, CAT, pickQuote } from '../lib/categories.js';
import { formatRange, formatAge, ageMatch, filterByAge as filterItems } from '../lib/age.js';
import { loadCard, search, listByCategory, listForAge, loadIndex } from '../lib/search.js';
import { ResultItem, AlertNote, KidPills, AlertChip, NearChip, Loading, SkeletonList, kidLabel, spring, tap } from './Common.jsx';
import InstallCard from './Install.jsx';
import { Mobile, PaperIcon, darker } from './Paper.jsx';
import { IconSearch, IconClose } from './Icons.jsx';

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const rise = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring }
};

export function Home({ lang, kids, active, setActive, months, query, setQuery, go, showInstall, onDismissInstall }) {
  const s = t(lang);
  const q = useDebounced(query, 200);
  const [results, setResults] = useState(null);
  const [forAge, setForAge] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [seed] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    let alive = true;
    if (!q.trim()) { setResults(null); return undefined; }
    setLoading(true);
    search(lang, q, months)
      .then((r) => alive && setResults(r))
      .catch(() => alive && setResults([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, lang, months]);

  useEffect(() => {
    let alive = true;
    listForAge(lang, months, 8).then((r) => alive && setForAge(r)).catch(() => {});
    loadIndex(lang).then(({ docs }) => {
      if (!alive) return;
      const c = {};
      for (const d of Object.values(docs)) if (ageMatch(months, d.f, d.to)) c[d.c] = (c[d.c] || 0) + 1;
      setCounts(c);
    }).catch(() => {});
    return () => { alive = false; };
  }, [lang, months]);

  const topCat = results?.[0]?.doc.c;
  const hasHealth = results?.slice(0, 6).some((r) => r.doc.a !== 'none');
  const kid = active >= 0 ? kids[active] : null;

  return (
    <div className="home">
      <Mobile height={170} />
      <motion.header className="hero" variants={stagger} initial="initial" animate="animate">
        <motion.h1 variants={rise}>
          {kid ? `${s.hello}, ${kidLabel(kid, active, lang)}` : s.allKidsTitle}
          {kid && <span className="age">{formatAge(kid.birth, lang)}</span>}
        </motion.h1>
        <AnimatePresence mode="wait">
          <motion.p key={topCat || 'g'} className="quote" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {pickQuote(lang, topCat, seed)}
          </motion.p>
        </AnimatePresence>
      </motion.header>

      {kids.length > 0 && <KidPills kids={kids} active={active} setActive={setActive} lang={lang} id="home" />}

      <div className="search" data-tour="search">
        <IconSearch />
        <input type="search" value={query} placeholder={s.searchPlaceholder} aria-label={s.searchPlaceholder}
          onChange={(e) => setQuery(e.target.value)} />
        <AnimatePresence>
          {query && (
            <motion.button className="clear" onClick={() => setQuery('')} aria-label={s.close}
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}>
              <IconClose />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {loading && !results && <><Loading label={s.loading} /><SkeletonList /></>}

      <AnimatePresence mode="wait">
        {results ? (
          <motion.section key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {hasHealth && <AlertNote kind="care">{s.resultsBanner}</AlertNote>}
            <div className="results-head">
              <span className="muted small">{s.results(results.length)}</span>
            </div>
            {results.length === 0 && <p className="empty">{s.noResults}</p>}
            <AnimatePresence mode="popLayout">
              {results.map((r, i) => <ResultItem key={r.id} item={r} index={i} lang={lang} onOpen={(id) => go(`card--${id}`)} />)}
            </AnimatePresence>
          </motion.section>
        ) : (
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {forAge.length > 0 && (
              <>
                <div className="section-title"><h2>{kid ? s.forAge(kidLabel(kid, active, lang)) : s.forAgeGeneric}</h2></div>
                <motion.div className="age-strip" variants={stagger} initial="initial" animate="animate">
                  {forAge.map((r) => {
                    const c = CAT[r.doc.c];
                    return (
                      <motion.button key={r.id} className="age-card" variants={rise} style={{ '--c': c.color, '--cd': darker(c.color) }}
                        whileTap={{ scale: 0.96, rotate: -1 }} onClick={() => go(`card--${r.id}`)}>
                        <PaperIcon id={r.doc.c} color="#ffffff" size={40} />
                        <strong>{r.doc.t}</strong>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </>
            )}
            {showInstall && <InstallCard lang={lang} compact onDismiss={onDismissInstall} />}
            <div className="section-title"><h2>{s.categories}</h2></div>
            <motion.div className="topics" variants={stagger} initial="initial" animate="animate">
              {CATEGORIES.map((c) => (
                <motion.button key={c.id} className="topic" variants={rise} style={{ '--c': c.color }}
                  whileTap={{ scale: 0.95 }} whileHover={{ y: -3 }} onClick={() => go(`cat--${c.id}`)}>
                  <motion.span whileTap={{ rotate: [0, -12, 10, 0] }}><PaperIcon id={c.id} color={c.color} size={50} /></motion.span>
                  <strong>{c.name[lang]}</strong>
                  <span className="count">{s.cardsCount(counts[c.id] || 0)}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CategoryView({ lang, id, months, kids, active, setActive, go }) {
  const s = t(lang);
  const cat = CAT[id];
  const [list, setList] = useState(null);
  useEffect(() => {
    listByCategory(lang, id, months).then(setList).catch(() => setList([]));
  }, [lang, id, months]);
  if (!cat) return null;
  return (
    <div>
      <motion.div className="cat-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <motion.span className="icon-bg" style={{ '--c': cat.color, '--cd': darker(cat.color) }}
          initial={{ rotate: -14, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
          <PaperIcon id={id} color="#ffffff" size={52} />
        </motion.span>
        <div>
          <h1>{cat.name[lang]}</h1>
          <p className="quote" style={{ marginTop: 4 }}>{pickQuote(lang, id, Math.floor(Date.now() / 60000))}</p>
        </div>
      </motion.div>
      <KidPills kids={kids} active={active} setActive={setActive} lang={lang} id="cat" />
      {!list && <SkeletonList n={4} />}
      {list?.length === 0 && <p className="empty">{s.noResults}</p>}
      <AnimatePresence mode="popLayout">
        {list?.map((r, i) => <ResultItem key={r.id} item={r} index={i} lang={lang} onOpen={(cid) => go(`card--${cid}`)} />)}
      </AnimatePresence>
    </div>
  );
}


// Fonte di una voce: autore/ente della fonte citato nel testo (es. "Mindell 2015", "OMS")
const AUTHOR_ALIASES = { WHO: ['OMS', 'ВОЗ'], AAP: ['AAP'], NICE: ['NICE'], CDC: ['CDC'], EFSA: ['EFSA'], UNICEF: ['UNICEF', 'ЮНИСЕФ'] };
export function refsFor(text, sources = []) {
  const t = String(text);
  return sources.filter((src) => {
    const first = (src.label.match(/^[\p{L}'’-]+/u) || [''])[0];
    if (first.length > 2 && t.includes(first)) return true;
    return (AUTHOR_ALIASES[first] || []).some((a) => t.includes(a));
  });
}

export function InlineRefs({ list }) {
  if (!list.length) return null;
  return <span className="refs">{list.map((x) => <a key={x.id} href={x.url} target="_blank" rel="noreferrer" title={x.label}>{x.id}</a>)}</span>;
}

function Block({ className = '', title, items, lang, showRanges, delay = 0, sources = [] }) {
  if (!items.length) return null;
  const s = t(lang);
  return (
    <motion.section className={`block ${className}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: delay * 0.08 }}>
      <h2><i className="dot" />{title}</h2>
      <ul>
        {items.map((x, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: delay * 0.08 + i * 0.04 }}>
            {x.t} <InlineRefs list={refsFor(x.t, sources)} />
            {showRanges && x.from != null && <span className="chip">{formatRange(x.from, x.to, lang)}</span>}
            {!showRanges && x.match === 'near' && <NearChip lang={lang} />}
          </motion.li>
        ))}
      </ul>
      {sources.length > 0 && items.some((x) => !refsFor(x.t, sources).length) && <p className="block-src">{s.blockSources} <InlineRefs list={sources} /></p>}
    </motion.section>
  );
}

const VERDICT = {
  si: { cls: 'yes', mark: '✓' },
  limita: { cls: 'limit', mark: '–' },
  no: { cls: 'no', mark: '✕' }
};

function Guide({ items, sources, lang, showRanges }) {
  const s = t(lang);
  if (!items.length) return null;
  const num = (id) => sources.findIndex((x) => x.id === id) + 1;
  return (
    <div className="guide">
      {['si', 'limita', 'no'].map((v, gi) => {
        const list = items.filter((x) => x.v === v);
        if (!list.length) return null;
        return (
          <motion.section key={v} className={`guide-group ${VERDICT[v].cls}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 + gi * 0.1 }}>
            <h2><span className="verdict">{VERDICT[v].mark}</span>{s.guideTitles[v]}</h2>
            <ul>
              {list.map((x, i) => (
                <motion.li key={x.t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.2 + gi * 0.1 + i * 0.04 }}>
                  <strong>{x.t}</strong>
                  {showRanges && x.from != null && <span className="chip">{formatRange(x.from, x.to, lang)}</span>}
                  <p>{x.why} <a className="ref" href={`#src-${x.src}`} onClick={(e) => { e.preventDefault(); document.getElementById(`src-${x.src}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>[{num(x.src)}]</a></p>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        );
      })}
    </div>
  );
}

export function CardView({ lang, id, months, kids, active, setActive, go }) {
  const s = t(lang);
  const [card, setCard] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setCard(null);
    loadCard(lang, id).then((c) => (c ? setCard(c) : setErr(true))).catch(() => setErr(true));
  }, [lang, id]);

  const quote = useMemo(() => (card ? pickQuote(lang, card.meta.c, id.length) : ''), [card, lang, id]);

  if (err) return <p className="empty">{s.noResults}</p>;
  if (!card) return <Loading label={s.loading} />;
  const cat = CAT[card.meta.c];
  const all = months == null;
  const sec = {
    research: filterItems(card.research, months),
    tips: filterItems(card.tips, months),
    redFlags: filterItems(card.redFlags, months),
    urgent: filterItems(card.urgent, months),
    guide: filterItems(card.guide, months)
  };
  const kid = active >= 0 ? kids[active] : null;

  return (
    <article style={{ '--c': cat.color }}>
      {/* L'avviso pediatra è la prima cosa visibile */}
      {card.meta.a !== 'none' && (
        <AlertNote kind={card.meta.a === 'urgente' ? 'urgent' : 'care'}>{s.pediatraBanner}</AlertNote>
      )}

      <motion.header className="card-hero" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <motion.span className="big-icon" initial={{ rotate: -20, scale: 0.5, opacity: 0 }} animate={{ rotate: 8, scale: 1, opacity: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}>
          <PaperIcon id={card.meta.c} color={cat.color} size={92} />
        </motion.span>
        <h1>{card.title}</h1>
        <div className="meta">
          <motion.button className="chip" onClick={() => go(`cat--${card.meta.c}`)} {...tap}>{cat.name[lang]}</motion.button>
          <span className="chip">{s.ageRange} {formatRange(card.meta.f, card.meta.to, lang)}</span>
          <AlertChip alert={card.meta.a} lang={lang} />
        </div>
        <p className="lead">{card.summary}</p>
      </motion.header>

      {sec.urgent.length > 0 && (
        <Block className="urgent" title={s.urgentTitle} items={sec.urgent} lang={lang} sources={card.sources} showRanges={all} delay={1} />
      )}
      {kids.length > 0 && (
        <>
          <p className="for-kid">{kid ? s.shownFor(kidLabel(kid, active, lang), formatAge(kid.birth, lang)) : s.shownAll}</p>
          <KidPills kids={kids} active={active} setActive={setActive} lang={lang} id="card" />
        </>
      )}

      <Guide items={sec.guide} sources={card.sources} lang={lang} showRanges={all} />
      <Block title={s.whatResearchSays} items={sec.research} lang={lang} sources={card.sources} showRanges={all} delay={2} />
      <Block className="tips" title={s.whatYouCanDo} items={sec.tips} lang={lang} sources={card.sources} showRanges={all} delay={3} />
      <Block className="flags" title={s.redFlags} items={sec.redFlags} lang={lang} sources={card.sources} showRanges={all} delay={4} />

      <motion.div className="quote-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
        {quote}
      </motion.div>

      <section className="sources">
        <h2>{s.sources}</h2>
        <p className="muted small" style={{ marginTop: 6 }}>{s.evidence}: {s.evidenceLevels[card.evidence] || card.evidence}</p>
        <ol>
          {card.sources.map((src) => (
            <li key={src.id} id={`src-${src.id}`}>
              <a href={src.url} target="_blank" rel="noopener noreferrer">{src.label}</a>{' '}
              <span className="chip">{s.srcTypes?.[src.type] || src.type}</span>
            </li>
          ))}
        </ol>
      </section>
      <p className="footnote">{s.footer}</p>
    </article>
  );
}
