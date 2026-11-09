import * as R from './realistic.js';

// Motore audio interamente generativo (Web Audio API): nessun file, nessuna rete, nessun diritto d'autore.
// Rumori, suoni della natura, ninne nanne in carillon (melodie di pubblico dominio) e musiche originali.

let ctx = null;
let master = null;
let analyser = null;
let reverb = null;
let tracksIn = null;
const noiseCache = {};

export function getContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    // Addolcimento comune: meno acuti (sopra ~3,5 kHz) e niente picchi improvvisi
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 3500;
    shelf.gain.value = -6;
    const top = ctx.createBiquadFilter();
    top.type = 'lowpass';
    top.frequency.value = 9000;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -20;
    limiter.knee.value = 10;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.3;
    tracksIn = ctx.createGain();
    tracksIn.connect(shelf).connect(top).connect(limiter).connect(master);
    master.connect(analyser).connect(ctx.destination);
    reverb = makeReverb(3.2);
    reverb.connect(tracksIn);
    R.initRealistic(ctx); // rumore continuo non ripetitivo (AudioWorklet), pronto in pochi ms
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function getAnalyser() { return analyser; }

// da chiamare all'apertura della sezione Suoni: prepara il motore prima del primo tocco
export function prepare() { getContext(); }

function realTrack(fn, level = 1, wet = 0) {
  const out = bus(level, wet);
  const kit = R.makeKit(ctx, (type) => noiseSource(type));
  fn(ctx, kit, out, noiseBuffer('white'));
  return { out, stop: () => kit.stopAll() };
}

function makeReverb(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  const conv = ctx.createConvolver();
  conv.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  conv.connect(wet);
  const input = ctx.createGain();
  input.connect(conv);
  return { connect: (n) => wet.connect(n), input };
}

function noiseBuffer(type) {
  if (noiseCache[type]) return noiseCache[type];
  const len = ctx.sampleRate * 8;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'white') d[i] = w * 0.5;
      else if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2;
      }
    }
    // dissolvenza agli estremi per un loop senza click
    const f = 2000;
    for (let i = 0; i < f; i++) {
      const g = i / f;
      d[i] *= g; d[len - 1 - i] *= g;
    }
  }
  noiseCache[type] = buf;
  return buf;
}

function noiseSource(type) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(type);
  src.loop = true;
  src.loopStart = 0.05;
  src.loopEnd = 7.95;
  src.start(0, Math.random() * 7);
  return src;
}

function lfo(freq, depth, target, offset = 0) {
  const o = ctx.createOscillator();
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(target);
  if (offset) target.value = offset;
  o.start();
  return o;
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// "E4", "C#5", "Bb3" → midi
export function noteToMidi(s) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

// ---------- Strumenti ----------
function musicBox(t, freq, out, vel = 0.25) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 2.4);
  [[1, 1], [2.0, 0.22], [3.01, 0.08], [5.4, 0.03]].forEach(([h, a]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * h;
    const og = ctx.createGain();
    og.gain.value = a;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + 2.5);
  });
  g.connect(out);
}

function marimba(t, freq, out, vel = 0.3) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
  [[1, 1], [3.93, 0.12], [9.2, 0.03]].forEach(([h, a]) => {
    const o = ctx.createOscillator();
    o.frequency.value = freq * h;
    const og = ctx.createGain();
    og.gain.value = a;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + 0.8);
  });
  g.connect(out);
}

function softBass(t, freq, dur, out, vel = 0.22) {
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function shaker(t, out, vel = 0.05) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer('white');
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vel, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  src.connect(hp).connect(g).connect(out);
  src.start(t, Math.random() * 6, 0.1);
}

function bubble(t, out) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const f0 = 500 + Math.random() * 600;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * 2.2, t + 0.12);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.2);
}

function padVoice(t, freqs, dur, out, vel = 0.05) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + dur * 0.35);
  g.gain.linearRampToValueAtTime(0, t + dur + 2.5);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  lp.Q.value = 0.3;
  for (const f of freqs) {
    for (const det of [-6, 5]) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 3);
    }
  }
  lp.connect(g).connect(out);
}

// ---------- Sequencer ----------
function sequencer(stepFn, stepDur) {
  let next = ctx.currentTime + 0.1;
  let i = 0;
  let alive = true;
  const tick = () => {
    if (!alive) return;
    while (next < ctx.currentTime + 0.4) {
      stepFn(i, next);
      next += typeof stepDur === 'function' ? stepDur(i) : stepDur;
      i++;
    }
    timer = setTimeout(tick, 80);
  };
  let timer = setTimeout(tick, 0);
  return () => { alive = false; clearTimeout(timer); };
}

// melodia: array di [nota|null, durata in battiti]
function melodyLoop(melody, bpm, play, { pause = 2 } = {}) {
  const beat = 60 / bpm;
  const total = melody.length;
  return sequencer(
    (i, t) => {
      const [n, d] = melody[i % total];
      if (n) play(t, midi(noteToMidi(n)), d * beat);
    },
    (i) => {
      const d = melody[i % total][1] * beat;
      return (i % total === total - 1) ? d + pause : d;
    }
  );
}

// ---------- Melodie di pubblico dominio ----------
// Brahms, "Wiegenlied" op. 49 n. 4 (1868)
const BRAHMS = [
  ['E4', .5], ['E4', .5], ['G4', 2], ['E4', .5], ['E4', .5], ['G4', 2], ['E4', .5], ['G4', .5], ['C5', 1], ['B4', 1.5], ['A4', .5], ['A4', 1], ['G4', 1],
  ['D4', .5], ['E4', .5], ['F4', 1], ['D4', 1], ['D4', .5], ['E4', .5], ['F4', 2], ['D4', .5], ['F4', .5], ['B4', .5], ['A4', .5], ['G4', 1], ['B4', 1], ['C5', 2],
  ['C4', .5], ['C4', .5], ['C5', 2], ['A4', .5], ['F4', .5], ['G4', 2], ['E4', .5], ['C4', .5], ['F4', 1], ['G4', 1], ['A4', 1], ['G4', 2],
  ['C4', .5], ['C4', .5], ['C5', 2], ['A4', .5], ['F4', .5], ['G4', 2], ['E4', .5], ['C4', .5], ['F4', 1], ['E4', 1], ['D4', 1], ['C4', 3]
];
// "Ah! vous dirai-je, maman" (XVIII sec.) — la melodia di "Brilla brilla la stellina"
const TWINKLE = [
  ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
  ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2],
  ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
  ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
  ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
  ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]
];
// "Frère Jacques" / "Fra Martino" (tradizionale, XVIII sec.)
const FRA_MARTINO = [
  ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1],
  ['E4', 1], ['F4', 1], ['G4', 2], ['E4', 1], ['F4', 1], ['G4', 2],
  ['G4', .5], ['A4', .5], ['G4', .5], ['F4', .5], ['E4', 1], ['C4', 1], ['G4', .5], ['A4', .5], ['G4', .5], ['F4', .5], ['E4', 1], ['C4', 1],
  ['C4', 1], ['G3', 1], ['C4', 2], ['C4', 1], ['G3', 1], ['C4', 2]
];

const PENTA = [60, 62, 64, 67, 69, 72, 74, 76];

// ---------- Catalogo ----------
// Ogni traccia: id, gruppo (sleep/play), tipo, fascia d'età in mesi [from, to), e una funzione che la avvia.
export const TRACKS = [
  // --- Per dormire: rumori e suoni ---
  { id: 'womb', group: 'sleep', kind: 'noise', from: 0, to: 6, hue: '#f1b4c3', start: () => realTrack(R.womb, 1) },
  { id: 'shush', group: 'sleep', kind: 'noise', from: 0, to: 6, hue: '#cfd6f6', start: () => realTrack(R.shush, 0.8) },
  { id: 'car', group: 'sleep', kind: 'noise', from: 0, to: 144, hue: '#c6cbe0', start: () => realTrack(R.car, 1) },
  { id: 'dryer', group: 'sleep', kind: 'noise', from: 0, to: 24, hue: '#f6cfd8', start: () => realTrack(R.dryer, 0.9) },
  { id: 'brown', group: 'sleep', kind: 'noise', from: 0, to: 144, hue: '#d9b99b', start: () => realTrack(R.brown, 1) },
  { id: 'pink', group: 'sleep', kind: 'noise', from: 3, to: 144, hue: '#f6cfd8', start: () => realTrack(R.pink, 1) },
  { id: 'white', group: 'sleep', kind: 'noise', from: 0, to: 144, hue: '#e8ecf7', start: () => realTrack(R.white, 1) },
  { id: 'fan', group: 'sleep', kind: 'noise', from: 0, to: 144, hue: '#bfe0d2', start: () => realTrack(R.fan, 1) },
  { id: 'rain', group: 'sleep', kind: 'nature', from: 6, to: 144, hue: '#a9c7ee', start: () => realTrack(R.rain, 1, 0.12) },
  { id: 'waves', group: 'sleep', kind: 'nature', from: 6, to: 144, hue: '#9ed3d6', start: () => realTrack(R.waves, 1, 0.2) },
  // --- Per dormire: musica ---
  { id: 'brahms', group: 'sleep', kind: 'music', from: 0, to: 144, hue: '#b9b2ec', start: () => startMusicBox(BRAHMS, 66) },
  { id: 'twinkle', group: 'sleep', kind: 'music', from: 0, to: 144, hue: '#f7d79a', start: () => startMusicBox(TWINKLE, 72) },
  { id: 'carillon', group: 'sleep', kind: 'music', from: 0, to: 144, hue: '#c9e3b8', start: startCarillon },
  { id: 'moon', group: 'sleep', kind: 'music', from: 12, to: 144, hue: '#8f8ad6', start: startAmbient },
  // --- Per giocare ---
  { id: 'bubbles', group: 'play', kind: 'music', from: 0, to: 12, hue: '#a9dcf0', start: startBubbles },
  { id: 'marimba', group: 'play', kind: 'music', from: 6, to: 144, hue: '#f7c48f', start: () => startGroove(96, false) },
  { id: 'twinkle-play', group: 'play', kind: 'music', from: 6, to: 144, hue: '#f7d79a', start: () => startMarimbaSong(TWINKLE, 108) },
  { id: 'fra-martino', group: 'play', kind: 'music', from: 12, to: 144, hue: '#f1b4c3', start: startFraMartino },
  { id: 'dance', group: 'play', kind: 'music', from: 18, to: 144, hue: '#a8d0be', start: () => startGroove(112, true) }
];

// Guadagni di normalizzazione (misurati, vedi tests/audio): tutte le tracce a volume percepito simile
export const NORM = {'womb': 1.3, 'shush': 2.31, 'car': 1.1, 'dryer': 0.55, 'brown': 0.76, 'pink': 0.67, 'white': 0.5, 'fan': 0.66, 'rain': 0.79, 'waves': 0.67, 'brahms': 0.76, 'twinkle': 0.76, 'carillon': 1.07, 'moon': 1.17, 'bubbles': 3.0, 'marimba': 1.62, 'twinkle-play': 1.62, 'fra-martino': 1.68, 'dance': 1.32}; // misurati con pesatura K (BS.1770) su 14 s

// ---------- Generatori ----------
function bus(level = 1, wet = 0) {
  const out = ctx.createGain();
  out.gain.value = level;
  out.connect(tracksIn);
  if (wet) {
    const send = ctx.createGain();
    send.gain.value = wet;
    out.connect(send).connect(reverb.input);
  }
  return out;
}

// Due filtri in cascata (24 dB/ottava) per un rumore morbido, senza sibilo acuto
function softLowpass(cutoff) {
  const a = ctx.createBiquadFilter();
  a.type = 'lowpass'; a.frequency.value = cutoff; a.Q.value = 0.5;
  const b = ctx.createBiquadFilter();
  b.type = 'lowpass'; b.frequency.value = cutoff; b.Q.value = 0.5;
  a.connect(b);
  return { input: a, output: b };
}

function startNoise(type, cutoff) {
  const out = bus(0.9);
  const src = noiseSource(type);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 30; // niente rimbombi inudibili
  const lp = softLowpass(cutoff);
  src.connect(hp).connect(lp.input);
  lp.output.connect(out);
  return { out, stop: () => src.stop() };
}

// Viaggio in auto: rombo basso della strada, motore lontano e qualche piccolo sobbalzo
function startCar() {
  const out = bus(1);
  const road = noiseSource('brown');
  const rlp = softLowpass(220);
  const rg = ctx.createGain(); rg.gain.value = 1;
  road.connect(rlp.input); rlp.output.connect(rg).connect(out);
  const tyres = noiseSource('pink');
  const tlp = softLowpass(700);
  const tg = ctx.createGain(); tg.gain.value = 0.18;
  const l1 = lfo(0.05, 0.06, tg.gain, 0.18);
  tyres.connect(tlp.input); tlp.output.connect(tg).connect(out);
  const eng = ctx.createOscillator(); eng.type = 'sawtooth'; eng.frequency.value = 42;
  const vib = lfo(0.13, 2.5, eng.frequency, 42);
  const elp = ctx.createBiquadFilter(); elp.type = 'lowpass'; elp.frequency.value = 110;
  const eg = ctx.createGain(); eg.gain.value = 0.05;
  eng.connect(elp).connect(eg).connect(out); eng.start();
  const stopSeq = sequencer((i, t) => {
    if (Math.random() < 0.5) return;
    const o = ctx.createOscillator(); o.frequency.value = 38;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.4);
  }, () => 5 + Math.random() * 8);
  return { out, stop: () => { road.stop(); tyres.stop(); eng.stop(); l1.stop(); vib.stop(); stopSeq(); } };
}

// Asciugacapelli: soffio d'aria nelle frequenze medie e ronzio del motorino, senza fischio acuto
function startDryer() {
  const out = bus(0.9);
  const air = noiseSource('pink');
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.5;
  const alp = softLowpass(2400);
  const ag = ctx.createGain(); ag.gain.value = 1.2;
  air.connect(bp).connect(alp.input); alp.output.connect(ag).connect(out);
  const body = noiseSource('brown');
  const blp = softLowpass(400);
  const bg = ctx.createGain(); bg.gain.value = 0.5;
  body.connect(blp.input); blp.output.connect(bg).connect(out);
  const motor = ctx.createOscillator(); motor.type = 'triangle'; motor.frequency.value = 118;
  const m2 = ctx.createOscillator(); m2.type = 'sine'; m2.frequency.value = 236;
  const mg = ctx.createGain(); mg.gain.value = 0.03;
  motor.connect(mg); m2.connect(mg); mg.connect(out);
  motor.start(); m2.start();
  return { out, stop: () => { air.stop(); body.stop(); motor.stop(); m2.stop(); } };
}

function startFan() {
  const out = bus(1);
  const a = noiseSource('brown');
  const b = noiseSource('pink');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  const bg = ctx.createGain();
  bg.gain.value = 0.35;
  a.connect(lp);
  b.connect(bg).connect(lp);
  const am = ctx.createGain();
  am.gain.value = 0.9;
  const l = lfo(0.9, 0.05, am.gain, 0.9);
  lp.connect(am).connect(out);
  return { out, stop: () => { a.stop(); b.stop(); l.stop(); } };
}

function startShush() {
  const out = bus(0.8);
  const src = noiseSource('white');
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2200;
  bp.Q.value = 0.7;
  const am = ctx.createGain();
  am.gain.value = 0.5;
  const l = lfo(0.45, 0.45, am.gain, 0.5);
  src.connect(bp).connect(am).connect(out);
  return { out, stop: () => { src.stop(); l.stop(); } };
}

function startWomb() {
  const out = bus(1);
  const src = noiseSource('brown');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 320;
  const ng = ctx.createGain();
  ng.gain.value = 0.9;
  src.connect(lp).connect(ng).connect(out);
  // battito: "lub-dub" a ~68 bpm
  const stopSeq = sequencer((i, t) => {
    [0, 0.28].forEach((off, k) => {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(k ? 58 : 52, t + off);
      o.frequency.exponentialRampToValueAtTime(32, t + off + 0.15);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + off);
      g.gain.linearRampToValueAtTime(k ? 0.35 : 0.5, t + off + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.22);
      o.connect(g).connect(out);
      o.start(t + off);
      o.stop(t + off + 0.25);
    });
  }, 60 / 68);
  return { out, stop: () => { src.stop(); stopSeq(); } };
}

function startRain() {
  const out = bus(0.9, 0.15);
  const src = noiseSource('pink');
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 400;
  const lp = softLowpass(3000);
  const g = ctx.createGain();
  g.gain.value = 0.7;
  src.connect(hp).connect(lp.input);
  lp.output.connect(g).connect(out);
  // gocce
  const stopSeq = sequencer((i, t) => {
    const n = Math.random() < 0.6 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const tt = t + Math.random() * 0.12;
      const o = ctx.createOscillator();
      const f = 1200 + Math.random() * 1600;
      o.frequency.setValueAtTime(f, tt);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, tt + 0.03);
      const dg = ctx.createGain();
      dg.gain.setValueAtTime(0.025 + Math.random() * 0.03, tt);
      dg.gain.exponentialRampToValueAtTime(0.0005, tt + 0.04);
      o.connect(dg).connect(out);
      o.start(tt);
      o.stop(tt + 0.05);
    }
  }, () => 0.04 + Math.random() * 0.12);
  return { out, stop: () => { src.stop(); stopSeq(); } };
}

function startWaves() {
  const out = bus(1, 0.2);
  const src = noiseSource('brown');
  const src2 = noiseSource('pink');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;
  const l1 = lfo(0.08, 500, lp.frequency, 800);
  const g = ctx.createGain();
  g.gain.value = 0.5;
  const l2 = lfo(0.08, 0.42, g.gain, 0.5);
  const sg = ctx.createGain();
  sg.gain.value = 0.25;
  src.connect(lp);
  src2.connect(sg).connect(lp);
  lp.connect(g).connect(out);
  return { out, stop: () => { src.stop(); src2.stop(); l1.stop(); l2.stop(); } };
}

function startMusicBox(melody, bpm) {
  const out = bus(0.9, 0.6);
  const stop = melodyLoop(melody, bpm, (t, f) => musicBox(t, f * 2, out, 0.2), { pause: 3 });
  return { out, stop };
}

function startCarillon() {
  const out = bus(0.9, 0.7);
  let pos = 2;
  const stop = sequencer((i, t) => {
    if (Math.random() < 0.18) return; // respiri
    pos = Math.max(0, Math.min(PENTA.length - 1, pos + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
    musicBox(t, midi(PENTA[pos] + 12), out, 0.16);
    if (i % 8 === 0) musicBox(t, midi(PENTA[0] - 12 + 12), out, 0.08);
  }, () => 0.55 + Math.random() * 0.5);
  return { out, stop };
}

const CHORDS = [
  [48, 52, 55, 59, 62], // Cmaj9
  [45, 48, 52, 55, 59], // Am9
  [41, 45, 48, 52, 55], // Fmaj9
  [43, 50, 52, 57]      // G6/9 sus
];

function startAmbient(level = 1) {
  const out = bus(0.9 * level, 0.8);
  const stop = sequencer((i, t) => {
    padVoice(t, CHORDS[i % CHORDS.length].map(midi), 7, out, 0.035);
    // qualche campanella pentatonica
    for (let k = 0; k < 3; k++) {
      if (Math.random() < 0.55) musicBox(t + 1 + Math.random() * 6, midi(PENTA[Math.floor(Math.random() * PENTA.length)] + 12), out, 0.05);
    }
  }, 8);
  return { out, stop };
}

function startBubbles() {
  const out = bus(0.8, 0.4);
  const stop = sequencer((i, t) => {
    if (Math.random() < 0.7) bubble(t, out);
    if (i % 6 === 0) musicBox(t, midi(PENTA[Math.floor(Math.random() * 5)] + 12), out, 0.1);
  }, () => 0.22 + Math.random() * 0.4);
  return { out, stop };
}

const GROOVE_BASS = [36, 33, 29, 31];
const GROOVE_MEL = [
  [0, 4, 7, 4, 9, 7, 4, null], [9, 7, 4, 0, 4, 7, null, 4],
  [5, 9, 12, 9, 7, 5, 4, null], [7, 4, 2, 4, 7, null, 11, 12]
];

function startGroove(bpm, withShaker) {
  const out = bus(0.85, 0.25);
  const eighth = 60 / bpm / 2;
  const stop = sequencer((i, t) => {
    const bar = Math.floor(i / 8) % 4;
    const step = i % 8;
    if (step === 0 || step === 4) softBass(t, midi(GROOVE_BASS[bar]), eighth * 3.5, out);
    const n = GROOVE_MEL[bar][step];
    if (n != null) marimba(t, midi(60 + n + (Math.floor(i / 32) % 2 ? 0 : 0)), out, 0.22);
    if (withShaker && step % 2 === 1) shaker(t, out, 0.04);
  }, eighth);
  return { out, stop };
}

function startFraMartino() {
  const out = bus(0.85, 0.3);
  const stop = melodyLoop(FRA_MARTINO, 104, (t, f, d) => {
    marimba(t, f * 2, out, 0.26);
    softBass(t, f / 2, Math.min(d, 0.9), out, 0.08);
  }, { pause: 1.2 });
  return { out, stop };
}

function startMarimbaSong(melody, bpm) {
  const out = bus(0.85, 0.3);
  const stop = melodyLoop(melody, bpm, (t, f) => marimba(t, f * 2, out, 0.26), { pause: 1 });
  return { out, stop };
}

// ---------- Player ----------
// Regola: suona UNA sola cosa alla volta. Ogni avvio ferma tutto ciò che è attivo,
// anche le tracce ancora in dissolvenza e la musica di sottofondo.
const active = new Set(); // handle in riproduzione o in dissolvenza
let current = null;       // { id, handle }
let ambient = null;
let timer = null;

function fadeIn(node, to, sec = 1.5) {
  const g = node.gain;
  const now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(0.0001, now);
  g.exponentialRampToValueAtTime(Math.max(to, 0.001), now + sec);
}

function kill(handle, sec = 0.8) {
  if (!handle || handle._dead) return;
  handle._dead = true;
  const g = handle.out.gain;
  const now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(Math.max(g.value, 0.0001), now);
  g.exponentialRampToValueAtTime(0.0001, now + sec);
  try { handle.stop(); } catch { /* già fermo */ } // ferma subito i sequencer: niente nuove note
  setTimeout(() => {
    try { handle.out.disconnect(); } catch { /* già scollegato */ }
    active.delete(handle);
  }, sec * 1000 + 80);
}

function killAll(sec) {
  for (const h of active) kill(h, sec);
  current = null;
}

export function play(id) {
  getContext();
  clearTimeout(timer);
  killAll(0.6);
  if (ambient) { kill(ambient, 0.6); ambient = null; }
  const track = TRACKS.find((t) => t.id === id);
  if (!track) return;
  const handle = track.start();
  const level = handle.out.gain.value * (NORM[id] ?? 1);
  fadeIn(handle.out, level);
  active.add(handle);
  current = { id, handle };
}

export function stop() {
  clearTimeout(timer);
  timer = null;
  killAll(0.8);
}

export function currentId() { return current?.id || null; }

export function setVolume(v) {
  getContext();
  master.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
}

export function setSleepTimer(minutes, onEnd) {
  clearTimeout(timer);
  if (!minutes) return;
  timer = setTimeout(() => {
    killAll(20); // dissolvenza lunga e dolce
    onEnd?.();
  }, minutes * 60000);
}

// Musica di sottofondo dell'app: parte solo se non c'è un'altra traccia
export function setAmbient(on) {
  getContext();
  if (on && !ambient && !current) {
    ambient = startAmbient(0.45);
    fadeIn(ambient.out, ambient.out.gain.value, 3);
    active.add(ambient);
  } else if (!on && ambient) {
    kill(ambient, 1.5);
    ambient = null;
  }
}

export function ambientOn() { return !!ambient && !ambient._dead; }

// livello (0–1) per le animazioni che seguono il suono
const buf = new Uint8Array(1024);
export function level() {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 4);
}

// Misure per i test automatici (solo con ?debug nell'indirizzo)
if (typeof window !== 'undefined' && /[?&]debug/.test(window.location.search)) {
  window.__ppAudio = {
    play, stop,
    measure() {
      const n = analyser.frequencyBinCount;
      const f = new Float32Array(n);
      analyser.getFloatFrequencyData(f);
      let pw = 0, cw = 0, aw = 0, kw = 0;
      // pesatura K (ITU-R BS.1770, approssimata): shelf +4 dB sopra ~1,7 kHz e passa-alto a 38 Hz
      const K = (fr) => {
        const x = (fr / 1681) ** 2;
        const shelf = (1 + x * 2.512) / (1 + x);
        const h = (fr / 38) ** 4;
        return shelf * (h / (1 + h));
      };
      const A = (fr) => {
        const f2 = fr * fr;
        const r = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
        return r * r * 1.2589; // +2 dB a 1 kHz
      };
      for (let i = 1; i < n; i++) {
        const fr = i * ctx.sampleRate / analyser.fftSize;
        const p = Math.pow(10, f[i] / 10);
        pw += p; cw += p * fr; aw += p * A(fr); kw += p * K(fr);
      }
      const t = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(t);
      let ss = 0, pk = 0;
      for (const v of t) { ss += v * v; pk = Math.max(pk, Math.abs(v)); }
      return { rmsDb: 10 * Math.log10(ss / t.length + 1e-12), aDb: 10 * Math.log10(aw + 1e-20), kDb: 10 * Math.log10(kw + 1e-20), peak: pk, centroid: cw / (pw || 1) };
    }
  };
}
