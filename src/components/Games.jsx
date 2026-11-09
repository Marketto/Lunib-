import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ageMatch, formatRange, formatAge } from '../lib/age.js';
import { KidPills, kidLabel, spring, tap } from './Common.jsx';
import Scene from './Scenes.jsx';
import sources from '../../content/sources.json';
import { InlineRefs } from './Views.jsx';

const COLORS = ['#fdf0dc', '#e6f5ec', '#ece9fb', '#fde6ec', '#e3eefb', '#fff6d8'];

export const GAME_TEXT = {
  it: {
    title: 'Giochi',
    subtitle: 'Idee di gioco con riscontri nella ricerca, adatte all\'età.',
    forKid: (n, a) => `Per ${n}, ${a}`,
    all: 'Tutti', together: 'Insieme', alone: 'Da solo',
    mode: { insieme: 'Insieme', solo: 'Da solo', entrambi: 'Insieme o da solo' },
    evidence: {
      forte: 'Prove forti: studi controllati',
      media: 'Prove moderate: effetti piccoli, indiretti o studi osservazionali',
      raccomandato: 'Consigliato da linee guida (AAP/OMS); benefici del singolo gioco poco dimostrati',
      tappa: 'Adatto alla tappa: prove descrittive'
    },
    minutes: (m) => `${m} min`,
    materials: 'Cosa serve',
    steps: 'Come si gioca',
    why: 'Cosa dice la ricerca',
    tip: 'Consiglio',
    sources: 'Fonti',
    empty: 'Nessun gioco per questa età con questo filtro.',
    note: 'Abbiamo incluso solo giochi con un riscontro nella ricerca e, per ciascuno, diciamo quanto sono solide le prove. Approfondisci sempre le fonti.'
  },
  ru: {
    title: 'Игры',
    subtitle: 'Идеи игр с подтверждением в исследованиях, по возрасту.',
    forKid: (n, a) => `Для: ${n}, ${a}`,
    all: 'Все', together: 'Вместе', alone: 'Сам',
    mode: { insieme: 'Вместе', solo: 'Сам', entrambi: 'Вместе или сам' },
    evidence: {
      forte: 'Сильные доказательства: контролируемые исследования',
      media: 'Умеренные доказательства: небольшие или косвенные эффекты либо наблюдательные исследования',
      raccomandato: 'Рекомендовано руководствами (AAP/ВОЗ); польза конкретной игры мало доказана',
      tappa: 'Подходит этапу: описательные данные'
    },
    minutes: (m) => `${m} мин`,
    materials: 'Что нужно',
    steps: 'Как играть',
    why: 'Что говорят исследования',
    tip: 'Совет',
    sources: 'Источники',
    empty: 'Для этого возраста с таким фильтром игр нет.',
    note: 'Мы включили только игры, подтверждённые исследованиями, и для каждой указываем, насколько надёжны доказательства. Всегда проверяйте источники.'
  }
};

let cache = null;
export function loadGames() {
  if (!cache) cache = import('../../content/games.json').then((m) => m.default);
  return cache;
}

export function GamesList({ lang, kids, active, setActive, months, go }) {
  const s = GAME_TEXT[lang];
  const [games, setGames] = useState(null);
  const [filter, setFilter] = useState('all');
  useEffect(() => { loadGames().then(setGames); }, []);
  const kid = active >= 0 ? kids[active] : null;
  const list = (games || [])
    .map((g, i) => ({ ...g, i, match: ageMatch(months, g.from, g.to) }))
    .filter((g) => g.match)
    .filter((g) => filter === 'all' || g.mode === 'entrambi' || (filter === 'together' ? g.mode === 'insieme' : g.mode === 'solo'));

  return (
    <div>
      <h1 style={{ marginTop: 6 }}>{s.title}</h1>
      <p className="muted" style={{ marginTop: 4 }}>{kid ? s.forKid(kidLabel(kid, active, lang), formatAge(kid.birth, lang)) : s.subtitle}</p>
      <KidPills kids={kids} active={active} setActive={setActive} lang={lang} id="games" />
      <div className="seg seg-light" role="tablist" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[['all', s.all], ['together', s.together], ['alone', s.alone]].map(([f, l]) => (
          <motion.button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)} {...tap}>
            {filter === f && <motion.i layoutId="games-seg" className="seg-bg" transition={spring} />}
            <span>{l}</span>
          </motion.button>
        ))}
      </div>
      {games && list.length === 0 && <p className="empty">{s.empty}</p>}
      <div className="games-grid">
        <AnimatePresence mode="popLayout">
          {list.map((g, i) => (
            <motion.button key={g.id} layout className="game-card" onClick={() => go(`gioco--${g.id}`)}
              initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ ...spring, delay: Math.min(i, 8) * 0.05 }} whileTap={{ scale: 0.97 }}>
              <Scene id={g.scene} color={COLORS[g.i % COLORS.length]} height={140} />
              <strong>{g[lang].title}</strong>
              <span className="game-meta">
                <span className="chip">{s.mode[g.mode]}</span>
                <span className="chip">{formatRange(g.from, g.to, lang)}</span>
                <span className="chip">{s.minutes(g.minutes)}</span>
              </span>
              <span className={`ev ev-${g.evidence}`}>{s.evidence[g.evidence]}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      <p className="footnote">{s.note}</p>
    </div>
  );
}

export function GameView({ lang, id }) {
  const s = GAME_TEXT[lang];
  const [games, setGames] = useState(null);
  useEffect(() => { loadGames().then(setGames); }, []);
  if (!games) return null;
  const idx = games.findIndex((x) => x.id === id);
  const g = games[idx];
  if (!g) return <p className="empty">{s.empty}</p>;
  const t = g[lang];
  return (
    <article>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
        <Scene id={g.scene} color={COLORS[idx % COLORS.length]} height={220} />
      </motion.div>
      <h1 style={{ marginTop: 14 }}>{t.title}</h1>
      <div className="game-meta" style={{ marginTop: 10 }}>
        <span className="chip">{s.mode[g.mode]}</span>
        <span className="chip">{formatRange(g.from, g.to, lang)}</span>
        <span className="chip">{s.minutes(g.minutes)}</span>
      </div>
      <span className={`ev ev-${g.evidence}`} style={{ marginTop: 10 }}>{s.evidence[g.evidence]}</span>
      <p className="lead" style={{ marginTop: 12 }}>{t.intro}</p>

      <section className="block tips" style={{ '--c': '#f7c48f' }}>
        <h2><i className="dot" />{s.materials}</h2>
        <ul>{t.materials.map((m, i) => <li key={i}>{m}</li>)}</ul>
      </section>

      <section className="block" style={{ '--c': '#b9b2ec' }}>
        <h2><i className="dot" />{s.steps}</h2>
        <ol className="steps">
          {t.steps.map((st, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 + i * 0.07 }}>
              <span className="step-n">{i + 1}</span><span>{st}</span>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="block" style={{ '--c': '#a8d0be' }}>
        <h2><i className="dot" />{s.why}</h2>
        <p style={{ marginTop: 10, lineHeight: 1.6 }}>{t.why} <InlineRefs list={g.sources.map((id) => ({ id, ...sources[id] }))} /></p>
      </section>

      {t.tip && <div className="quote-card" style={{ '--c': '#f7d79a' }}>💡 {t.tip}</div>}

      <section className="sources">
        <h2>{s.sources}</h2>
        <ol>
          {g.sources.map((sid) => (
            <li key={sid}><a href={sources[sid].url} target="_blank" rel="noopener noreferrer">{sources[sid].label}</a></li>
          ))}
        </ol>
      </section>
      <p className="footnote">{s.note}</p>
    </article>
  );
}
