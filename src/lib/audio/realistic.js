// Suoni d'ambiente "realistici": rumore continuo che non si ripete mai (AudioWorklet),
// variazioni lente casuali, eventi indipendenti (gocce, onde, auto che passano) e stereo.
// Nessun campione registrato: tutto sintetizzato al momento.

const WORKLET = `
class NoiseGen extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    this.type = (opts.processorOptions && opts.processorOptions.type) || 'white';
    this.s = [0, 1].map(() => ({ b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0, last: 0 }));
  }
  process(_, outputs) {
    const out = outputs[0];
    for (let ch = 0; ch < out.length; ch++) {
      const o = out[ch], st = this.s[ch % 2];
      for (let i = 0; i < o.length; i++) {
        const w = Math.random() * 2 - 1;
        if (this.type === 'white') o[i] = w * 0.5;
        else if (this.type === 'pink') {
          st.b0 = 0.99886 * st.b0 + w * 0.0555179; st.b1 = 0.99332 * st.b1 + w * 0.0750759;
          st.b2 = 0.969 * st.b2 + w * 0.153852; st.b3 = 0.8665 * st.b3 + w * 0.3104856;
          st.b4 = 0.55 * st.b4 + w * 0.5329522; st.b5 = -0.7616 * st.b5 - w * 0.016898;
          o[i] = (st.b0 + st.b1 + st.b2 + st.b3 + st.b4 + st.b5 + st.b6 + w * 0.5362) * 0.11;
          st.b6 = w * 0.115926;
        } else {
          st.last = (st.last + 0.02 * w) / 1.02;
          o[i] = st.last * 3.2;
        }
      }
    }
    return true;
  }
}
registerProcessor('noise-gen', NoiseGen);
`;

let ready = null;
export function prepareWorklet(ctx) {
  if (!ready) {
    ready = (async () => {
      try {
        if (!ctx.audioWorklet) return false;
        const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
        await ctx.audioWorklet.addModule(url);
        return true;
      } catch { return false; }
    })();
  }
  return ready;
}

let workletOk = false;
export async function initRealistic(ctx) {
  workletOk = await prepareWorklet(ctx);
  return workletOk;
}

// --- primitive ---
export function makeKit(ctx, fallbackNoise) {
  const stops = [];
  const kit = {
    stops,
    noise(type) {
      let n;
      if (workletOk) {
        n = new AudioWorkletNode(ctx, 'noise-gen', { numberOfInputs: 0, outputChannelCount: [2], processorOptions: { type } });
        stops.push(() => n.disconnect());
      } else {
        n = fallbackNoise(type); // buffer in loop come ripiego
        stops.push(() => { try { n.stop(); } catch { /* */ } });
      }
      return n;
    },
    filter(type, freq, q = 0.7, gain = 0) {
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q; f.gain.value = gain;
      return f;
    },
    gain(v = 1) { const g = ctx.createGain(); g.gain.value = v; return g; },
    pan(p = 0) {
      const s = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
      if (s.pan) s.pan.value = p;
      return s;
    },
    osc(type, freq) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.start();
      stops.push(() => { try { o.stop(); } catch { /* */ } });
      return o;
    },
    // variazione lenta casuale di un parametro tra min e max (random walk morbido)
    drift(param, min, max, minSec = 4, maxSec = 12) {
      let alive = true;
      const go = () => {
        if (!alive) return;
        const dur = minSec + Math.random() * (maxSec - minSec);
        const target = min + Math.random() * (max - min);
        param.setTargetAtTime(target, ctx.currentTime, dur / 3);
        setTimeout(go, dur * 1000);
      };
      param.value = (min + max) / 2;
      go();
      stops.push(() => { alive = false; });
    },
    // eventi a intervalli casuali
    every(minSec, maxSec, fn) {
      let alive = true;
      let t;
      const go = () => {
        if (!alive) return;
        fn(ctx.currentTime + 0.05);
        t = setTimeout(go, (minSec + Math.random() * (maxSec - minSec)) * 1000);
      };
      t = setTimeout(go, Math.random() * maxSec * 500);
      stops.push(() => { alive = false; clearTimeout(t); });
    },
    stopAll() { stops.forEach((f) => f()); }
  };
  return kit;
}

// scheduler ad alta frequenza per i grani (gocce)
function grainLoop(ctx, kit, fn) {
  let alive = true;
  let next = ctx.currentTime + 0.1;
  const tick = () => {
    if (!alive) return;
    while (next < ctx.currentTime + 0.2) { fn(next); next += 0.025; }
    setTimeout(tick, 60);
  };
  tick();
  kit.stops.push(() => { alive = false; });
}

// --- suoni ---
export function white(ctx, kit, out) {
  const n = kit.noise('white');
  const hp = kit.filter('highpass', 40);
  const lp = kit.filter('lowpass', 7000, 0.5);
  const g = kit.gain(0.55);
  kit.drift(lp.frequency, 5500, 8500, 6, 18);
  kit.drift(g.gain, 0.5, 0.6, 8, 20);
  n.connect(hp).connect(lp).connect(g).connect(out);
}

export function pink(ctx, kit, out) {
  const n = kit.noise('pink');
  const lp = kit.filter('lowpass', 4000, 0.5);
  const g = kit.gain(0.9);
  kit.drift(lp.frequency, 3000, 5000, 6, 18);
  kit.drift(g.gain, 0.82, 0.98, 8, 20);
  n.connect(lp).connect(g).connect(out);
}

export function brown(ctx, kit, out) {
  const n = kit.noise('brown');
  const lp = kit.filter('lowpass', 600, 0.5);
  const lp2 = kit.filter('lowpass', 900, 0.5);
  const g = kit.gain(1);
  kit.drift(lp.frequency, 380, 800, 10, 25);
  kit.drift(g.gain, 0.85, 1.05, 10, 25);
  n.connect(lp).connect(lp2).connect(g).connect(out);
}

export function fan(ctx, kit, out) {
  // flusso d'aria
  const air = kit.noise('pink');
  const bp = kit.filter('bandpass', 650, 0.45);
  const airG = kit.gain(1.1);
  air.connect(bp).connect(airG);
  const body = kit.noise('brown');
  const blp = kit.filter('lowpass', 280, 0.5);
  const bodyG = kit.gain(0.55);
  body.connect(blp).connect(bodyG);
  // passaggio delle pale: modulazione d'ampiezza a ~18 Hz con velocità che varia appena
  const am = kit.gain(0.85);
  const blade = kit.osc('sine', 18);
  const depth = kit.gain(0.12);
  blade.connect(depth).connect(am.gain);
  kit.drift(blade.frequency, 16.5, 19.5, 5, 14);
  airG.connect(am); bodyG.connect(am);
  // ronzio del motore (50 Hz e armoniche, molto basso)
  const hum = kit.gain(0.012);
  [50, 100, 150].forEach((f, i) => { const o = kit.osc('sine', f); const g = kit.gain([1, 0.5, 0.25][i]); o.connect(g).connect(hum); });
  // oscillazione lenta del ventilatore: si sposta a destra e sinistra
  const p = kit.pan(0);
  const swing = kit.osc('sine', 0.045);
  const sw = kit.gain(0.55);
  swing.connect(sw).connect(p.pan || kit.gain(0));
  am.connect(p); hum.connect(p);
  p.connect(out);
}

export function rain(ctx, kit, out, slice) {
  // fondo di pioggia con intensità che cambia (raffiche)
  const bed = kit.noise('pink');
  const bhp = kit.filter('highpass', 500, 0.5);
  const blp = kit.filter('lowpass', 5200, 0.5);
  const bedG = kit.gain(0.4);
  kit.drift(bedG.gain, 0.25, 0.55, 12, 35);
  bed.connect(bhp).connect(blp).connect(bedG).connect(out);
  // rombo lontano
  const rum = kit.noise('brown');
  const rlp = kit.filter('lowpass', 160);
  const rumG = kit.gain(0.35);
  rum.connect(rlp).connect(rumG).connect(out);
  // gocce: grani brevi, frequenza, durata e posizione casuali
  let intensity = 0.6;
  kit.every(8, 25, () => { intensity = 0.35 + Math.random() * 0.6; });
  grainLoop(ctx, kit, (t) => {
    const n = Math.random() < intensity ? 1 + Math.floor(Math.random() * 3 * intensity) : 0;
    for (let k = 0; k < n; k++) {
      const tt = t + Math.random() * 0.025;
      const src = ctx.createBufferSource();
      src.buffer = slice;
      const f = kit.filter('bandpass', 1400 + Math.random() * 4200, 1.5 + Math.random() * 5);
      const g = ctx.createGain();
      const big = Math.random() < 0.08;
      const peak = (big ? 0.5 : 0.12) * (0.4 + Math.random() * 0.6);
      const dur = (big ? 0.06 : 0.015) + Math.random() * 0.04;
      g.gain.setValueAtTime(0, tt);
      g.gain.linearRampToValueAtTime(peak, tt + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0005, tt + dur);
      const p = kit.pan(Math.random() * 2 - 1);
      src.connect(f).connect(g).connect(p).connect(out);
      src.start(tt, Math.random() * 6, dur + 0.02);
    }
  });
  // gocciolio dalla grondaia: qualche "plic" intonato
  kit.every(2.5, 7, (t) => {
    const o = ctx.createOscillator();
    const f0 = 1600 + Math.random() * 1400;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.7, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
    const p = kit.pan(Math.random() * 1.6 - 0.8);
    o.connect(g).connect(p).connect(out); o.start(t); o.stop(t + 0.15);
  });
}

export function waves(ctx, kit, out) {
  // risacca di fondo
  const bed = kit.noise('brown');
  const blp = kit.filter('lowpass', 420);
  const bedG = kit.gain(0.45);
  bed.connect(blp).connect(bedG).connect(out);
  // ogni onda: sale, si rompe, si ritira frizzando sulla sabbia
  const swellSrc = kit.noise('pink');
  const washSrc = kit.noise('white');
  kit.every(7, 13, (t) => {
    const swell = 2.2 + Math.random() * 2;
    const size = 0.6 + Math.random() * 0.5;
    const p = kit.pan(Math.random() * 1.2 - 0.6);
    p.connect(out);
    // salita
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(250, t);
    lp.frequency.exponentialRampToValueAtTime(1800 * size, t + swell);
    lp.frequency.exponentialRampToValueAtTime(500, t + swell + 3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * size, t + swell);
    g.gain.exponentialRampToValueAtTime(0.0001, t + swell + 4.5);
    swellSrc.connect(lp); lp.connect(g).connect(p);
    // schiuma che si ritira
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    const wl = ctx.createBiquadFilter(); wl.type = 'lowpass'; wl.frequency.value = 6000;
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t + swell * 0.9);
    wg.gain.exponentialRampToValueAtTime(0.25 * size, t + swell + 0.4);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + swell + 5.5);
    washSrc.connect(hp); hp.connect(wl).connect(wg).connect(p);
    setTimeout(() => { try { swellSrc.disconnect(lp); washSrc.disconnect(hp); p.disconnect(); } catch { /* */ } }, (swell + 6) * 1000);
  });
}

export function car(ctx, kit, out) {
  // rotolamento: rombo basso + pneumatici; l'asfalto cambia ogni tanto
  const road = kit.noise('brown');
  const rlp = kit.filter('lowpass', 170);
  const roadG = kit.gain(1.1);
  road.connect(rlp).connect(roadG).connect(out);
  const tyres = kit.noise('pink');
  const tbp = kit.filter('bandpass', 480, 0.6);
  const tG = kit.gain(0.35);
  kit.drift(tbp.frequency, 350, 700, 15, 50);
  kit.drift(tG.gain, 0.22, 0.45, 15, 50);
  tyres.connect(tbp).connect(tG).connect(out);
  // motore con giri che variano e cambi marcia
  const eng = kit.osc('sawtooth', 38);
  kit.drift(eng.frequency, 32, 44, 6, 20);
  const elp = kit.filter('lowpass', 110);
  const eG = kit.gain(0.045);
  eng.connect(elp).connect(eG).connect(out);
  // auto che sorpassano da un lato all'altro
  const pass = kit.noise('pink');
  kit.every(20, 50, (t) => {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(500, t); bp.frequency.linearRampToValueAtTime(900, t + 1.5); bp.frequency.linearRampToValueAtTime(400, t + 3.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
    const p = kit.pan(0);
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (p.pan) { p.pan.setValueAtTime(-0.9 * dir, t); p.pan.linearRampToValueAtTime(0.9 * dir, t + 3.2); }
    pass.connect(bp); bp.connect(g).connect(p).connect(out);
    setTimeout(() => { try { pass.disconnect(bp); } catch { /* */ } }, 3600);
  });
  // piccoli sobbalzi
  kit.every(6, 14, (t) => {
    const o = ctx.createOscillator(); o.frequency.value = 36 + Math.random() * 10;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.14, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.35);
  });
}

export function dryer(ctx, kit, out) {
  const air = kit.noise('pink');
  const bp = kit.filter('bandpass', 1100, 0.5);
  const lp = kit.filter('lowpass', 3200, 0.5);
  const airG = kit.gain(1.2);
  air.connect(bp).connect(lp).connect(airG);
  // turbolenza: tremolio rapido e irregolare
  const flut = kit.noise('brown');
  const flp = kit.filter('lowpass', 12);
  const fdepth = kit.gain(0.6);
  flut.connect(flp).connect(fdepth).connect(airG.gain);
  // la mano che muove il phon: filtro e volume oscillano piano
  kit.drift(bp.frequency, 850, 1400, 1.5, 4);
  const body = kit.noise('brown');
  const blp = kit.filter('lowpass', 380);
  const bodyG = kit.gain(0.45);
  body.connect(blp).connect(bodyG).connect(out);
  // motorino
  const m = kit.osc('sawtooth', 182);
  kit.drift(m.frequency, 178, 186, 2, 6);
  const mbp = kit.filter('bandpass', 360, 3);
  const mG = kit.gain(0.02);
  m.connect(mbp).connect(mG).connect(out);
  const p = kit.pan(0);
  kit.drift(p.pan || kit.gain(0).gain, -0.25, 0.25, 2, 5);
  airG.connect(p).connect(out);
}

export function womb(ctx, kit, out) {
  // flusso sanguigno ovattato che "soffia" a ogni battito
  const bed = kit.noise('brown');
  const lp = kit.filter('lowpass', 260, 0.5);
  const bedG = kit.gain(0.75);
  bed.connect(lp).connect(bedG).connect(out);
  const flow = kit.noise('pink');
  const flp = kit.filter('lowpass', 420, 0.6);
  const flowG = kit.gain(0.05);
  flow.connect(flp).connect(flowG).connect(out);
  let alive = true;
  let next = ctx.currentTime + 0.2;
  const beat = () => {
    if (!alive) return;
    while (next < ctx.currentTime + 0.5) {
      const t = next;
      const rate = 64 + Math.random() * 8; // variabilità del battito
      [0, 0.28].forEach((off, k) => {
        const o = ctx.createOscillator();
        o.frequency.setValueAtTime(k ? 58 : 50, t + off);
        o.frequency.exponentialRampToValueAtTime(30, t + off + 0.16);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t + off);
        g.gain.linearRampToValueAtTime(k ? 0.32 : 0.48, t + off + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.24);
        o.connect(g).connect(out); o.start(t + off); o.stop(t + off + 0.26);
      });
      flowG.gain.setValueAtTime(0.05, t);
      flowG.gain.linearRampToValueAtTime(0.32, t + 0.12);
      flowG.gain.exponentialRampToValueAtTime(0.05, t + 0.6);
      next += 60 / rate;
    }
    setTimeout(beat, 100);
  };
  beat();
  kit.stops.push(() => { alive = false; });
}

export function shush(ctx, kit, out) {
  // "shhh" con due formanti, lunghezza e intensità variabili, piccoli respiri tra uno e l'altro
  const src = kit.noise('white');
  const f1 = kit.filter('bandpass', 2600, 1.2);
  const f2 = kit.filter('bandpass', 4300, 1.6);
  const g1 = kit.gain(0.9); const g2 = kit.gain(0.45);
  const env = kit.gain(0);
  src.connect(f1).connect(g1).connect(env);
  src.connect(f2).connect(g2).connect(env);
  env.connect(out);
  const breath = kit.noise('pink');
  const blp = kit.filter('bandpass', 900, 0.6);
  const benv = kit.gain(0);
  breath.connect(blp).connect(benv).connect(out);
  let alive = true;
  let next = ctx.currentTime + 0.2;
  const tick = () => {
    if (!alive) return;
    while (next < ctx.currentTime + 1) {
      const t = next;
      const dur = 0.8 + Math.random() * 1.1;
      const lvl = 0.55 + Math.random() * 0.35;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(lvl, t + 0.12);
      env.gain.setTargetAtTime(lvl * 0.8, t + 0.15, dur / 2);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      f1.frequency.setValueAtTime(2400 + Math.random() * 400, t);
      const gap = 0.35 + Math.random() * 0.5;
      benv.gain.setValueAtTime(0.0001, t + dur + 0.05);
      benv.gain.exponentialRampToValueAtTime(0.06, t + dur + gap * 0.5);
      benv.gain.exponentialRampToValueAtTime(0.0001, t + dur + gap);
      next = t + dur + gap;
    }
    setTimeout(tick, 200);
  };
  tick();
  kit.stops.push(() => { alive = false; });
}
