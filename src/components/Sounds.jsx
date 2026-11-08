import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TRACKS } from '../lib/audio/engine.js';
import { TRACK_TEXT, SOUND_STRINGS } from '../lib/audio/tracks-i18n.js';
import { useAudio } from '../lib/audio/useAudio.jsx';
import { ageMatch, formatAge } from '../lib/age.js';
import { KidPills, kidLabel, spring, tap } from './Common.jsx';
import { Mobile } from './Paper.jsx';
import { IconMoon, IconBall, IconPlay, IconStop } from './Icons.jsx';
import TrackIcon from './TrackIcons.jsx';
import VolumeCheck from './VolumeCheck.jsx';
import sources from '../../content/sources.json';

function Eq() {
  return <span className="eq" aria-hidden="true"><i /><i /><i /><i /></span>;
}

// Visualizzazione che segue il volume reale del suono
function SleepOrb({ hue, playing, level, label }) {
  const orb = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    let raf;
    let smooth = 0;
    let t0 = performance.now();
    const loop = (now) => {
      const l = playing ? level() : 0;
      smooth += (l - smooth) * 0.08;
      const breath = Math.sin((now - t0) / 1800) * 0.04; // respiro lento anche da fermo
      const sc = 1 + breath + smooth * 0.35;
      if (orb.current) orb.current.style.transform = `scale(${sc})`;
      if (ring.current) {
        ring.current.style.transform = `scale(${1.15 + smooth * 0.9 + breath})`;
        ring.current.style.opacity = String(0.25 + smooth * 0.6);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, level]);
  return (
    <div className="orb-wrap" style={{ '--hue': hue }}>
      <div ref={ring} className="orb-ring" />
      <div ref={orb} className="orb" />
      <AnimatePresence mode="wait">
        <motion.div key={label} className="orb-label" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {label}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const PLAY_SHAPES = ['#f7c48f', '#f1b4c3', '#a8d0be', '#a9c7ee', '#b9b2ec', '#f7d79a'];

function PlayOrbit({ hue, playing, level, label }) {
  const refs = useRef([]);
  useEffect(() => {
    let raf;
    let smooth = 0;
    const loop = (now) => {
      const l = playing ? level() : 0;
      smooth += (l - smooth) * 0.2;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const a = now / (playing ? 1400 : 4000) + (i / PLAY_SHAPES.length) * Math.PI * 2;
        const r = 78 + Math.sin(now / 500 + i) * 6;
        const hop = smooth * 26 * Math.abs(Math.sin(now / 160 + i));
        el.style.transform = `translate(${Math.cos(a) * r + 94}px, ${Math.sin(a) * r + 94 - hop}px) rotate(${a * 60}deg)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, level]);
  return (
    <div className="orb-wrap" style={{ '--hue': hue }}>
      <div className="play-orbit">
        {PLAY_SHAPES.map((c, i) => (
          <span key={c} ref={(el) => { refs.current[i] = el; }} style={{ background: c, borderRadius: i % 2 ? '50%' : 6 }} />
        ))}
      </div>
      <motion.div className="orb" style={{ width: 120, height: 120 }} animate={playing ? { rotate: [0, 6, -6, 0] } : { rotate: 0 }}
        transition={{ duration: 1.2, repeat: playing ? Infinity : 0 }} />
      <AnimatePresence mode="wait">
        <motion.div key={label} className="orb-label" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {label}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TrackButton({ track, lang, on, onClick, index }) {
  const [name, desc] = TRACK_TEXT[track.id][lang];
  return (
    <motion.button className={`track ${on ? 'on' : ''}`} style={{ '--hue': track.hue }} onClick={onClick}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: index * 0.04 }}
      whileTap={{ scale: 0.97 }} layout>
      <span className="sw"><TrackIcon id={track.id} /></span>
      <span><strong>{name}</strong><small>{desc}</small></span>
      <span>{on ? <Eq /> : <IconPlay />}</span>
    </motion.button>
  );
}

export default function Sounds({ lang, kids, active, setActive, months, group, setGroup }) {
  const s = SOUND_STRINGS[lang];
  const audio = useAudio();
  const kid = active >= 0 ? kids[active] : null;
  const night = group === 'sleep';
  const [vc, setVc] = useState(false);
  useEffect(() => { import('../lib/audio/engine.js').then((e) => e.prepare()); }, []);

  useEffect(() => {
    document.body.classList.toggle('night', night);
    return () => document.body.classList.remove('night');
  }, [night]);

  const visible = TRACKS.filter((tr) => tr.group === group && ageMatch(months, tr.from, tr.to));
  const noise = visible.filter((tr) => tr.kind !== 'music');
  const music = visible.filter((tr) => tr.kind === 'music');
  const current = TRACKS.find((tr) => tr.id === audio.playing);
  const label = current ? TRACK_TEXT[current.id][lang][0] : s.tapToPlay;
  const toggle = (id) => (audio.playing === id ? audio.stopTrack() : audio.playTrack(id));

  const list = (items, offset = 0) => items.map((tr, i) => (
    <TrackButton key={tr.id} track={tr} lang={lang} index={i + offset} on={audio.playing === tr.id} onClick={() => toggle(tr.id)} />
  ));

  return (
    <div className={`sounds ${night ? '' : 'light'}`}>
      <AnimatePresence>{night && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <Mobile night height={120} />
        </motion.div>
      )}</AnimatePresence>
      <h1 style={night ? undefined : { color: 'var(--ink)' }}>{s.title}</h1>
      <p className="muted small" style={{ marginTop: 4 }}>{kid ? s.forKid(kidLabel(kid, active, lang), formatAge(kid.birth, lang)) : s.forAll}</p>

      <div className="seg" role="tablist">
        {[['sleep', s.sleep, <IconMoon key="m" />], ['play', s.play, <IconBall key="b" />]].map(([g, l, ic]) => (
          <motion.button key={g} role="tab" aria-selected={group === g} className={group === g ? 'on' : ''} onClick={() => setGroup(g)} {...tap}>
            {group === g && <motion.i layoutId="seg-bg" className="seg-bg" transition={spring} />}
            {ic}<span>{l}</span>
          </motion.button>
        ))}
      </div>

      <KidPills kids={kids} active={active} setActive={setActive} lang={lang} id="snd" />

      {night
        ? <SleepOrb hue={current?.hue || '#f7d79a'} playing={!!audio.playing} level={audio.level} label={label} />
        : <PlayOrbit hue={current?.hue || '#f7c48f'} playing={!!audio.playing} level={audio.level} label={label} />}

      <div className="bigplay-row">
        <motion.button className={`bigplay ${audio.playing ? 'on' : ''}`} {...tap}
          aria-label={audio.playing ? s.stopAll : s.playFirst}
          onClick={() => (audio.playing ? audio.stopTrack() : visible[0] && audio.playTrack(visible[0].id))}>
          <AnimatePresence mode="wait">
            <motion.span key={audio.playing ? 's' : 'p'} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} style={{ display: 'grid' }}>
              {audio.playing ? <IconStop /> : <IconPlay />}
            </motion.span>
          </AnimatePresence>
          <span>{audio.playing ? s.stopAll : s.playFirst}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {audio.playing && (
          <motion.div className="controls" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <label>{s.timer}</label>
            <div className="timer-row">
              {[0, 15, 30, 60].map((m) => (
                <motion.button key={m} className={audio.timer === m ? 'on' : ''} onClick={() => audio.setTimer(m)} {...tap}>
                  {m ? s.min(m) : s.off}
                </motion.button>
              ))}
            </div>
            <label htmlFor="vol">{s.volume}</label>
            <input id="vol" type="range" min="0.05" max="1" step="0.05" value={audio.volume} onChange={(e) => audio.setVolume(Number(e.target.value))} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div key={group + months} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {night ? (
            <>
              {noise.length > 0 && <div className="track-group"><h2>{s.noise}</h2>{list(noise)}</div>}
              {music.length > 0 && <div className="track-group"><h2>{s.music}</h2>{list(music, noise.length)}</div>}
            </>
          ) : (
            <div className="track-group">{list(visible)}<p className="muted small" style={{ marginTop: 14 }}>{s.playNote}</p></div>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.button className="vol-open" onClick={() => setVc(true)} {...tap}>
        <span className="vol-ic">🎚️</span>
        <span><strong>{s.measureTitle}</strong><small>{s.measureText}</small></span>
      </motion.button>
      <AnimatePresence>{vc && <VolumeCheck lang={lang} onClose={() => setVc(false)} />}</AnimatePresence>

      {night && (
        <section className="safety">
          <h3>{s.safetyTitle}</h3>
          <ul>{s.safety.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <p className="small" style={{ marginTop: 8 }}>
            <a href={sources.C1.url} target="_blank" rel="noopener noreferrer">{sources.C1.label}</a>
            <br />
            <a href={sources.C2.url} target="_blank" rel="noopener noreferrer">{sources.C2.label}</a>
          </p>
        </section>
      )}
    </div>
  );
}

export function MiniPlayer({ lang, go }) {
  const audio = useAudio();
  const tr = TRACKS.find((x) => x.id === audio.playing);
  return (
    <AnimatePresence>
      {tr && (
        <motion.div className="mini-player" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={spring}>
          <span className="mini-ic" style={{ '--hue': tr.hue }}><TrackIcon id={tr.id} /></span>
          <button className="grow" onClick={() => go('suoni')} style={{ textAlign: 'left' }}>
            <small className="muted">{SOUND_STRINGS[lang].nowPlaying}</small>
            <strong>{TRACK_TEXT[tr.id][lang][0]}</strong>
          </button>
          <motion.button className="stop" onClick={audio.stopTrack} aria-label={SOUND_STRINGS[lang].stop} {...tap}><IconStop /></motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
