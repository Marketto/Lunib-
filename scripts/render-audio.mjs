// Pre-renderizza i loop audio (stessa sintesi dell'app) in public/audio/<traccia>.m4a (AAC ~96 kbps) + env.json.
// Uso: npm run audio:render [id ...]    (senza argomenti: tutte le tracce)
// Richiede: Chromium/Chrome (playwright o playwright-core; CHROME_PATH per il binario) e ffmpeg (PATH o ffmpeg-static).
// Va rieseguito (e i file ricommittati) quando cambia la sintesi in src/lib/audio/ o NORM; poi rimisurare la loudness.
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, mkdtempSync, rmSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'audio');
const require = createRequire(import.meta.url);

function loadPlaywright() {
  for (const m of ['playwright', 'playwright-core', '/opt/npm-tools/node_modules/playwright']) {
    try { return require(m); } catch { /* prossimo */ }
  }
  throw new Error('playwright non trovato (npm i -D playwright-core, oppure installazione globale)');
}
function ffmpegBin() {
  try { return require('ffmpeg-static'); } catch { /* usa il PATH */ }
  return 'ffmpeg';
}
const BITRATE = process.env.AUDIO_BITRATE || '96k';
const BITRATE_OVERRIDE = { white: '128k' }; // a 96 kbps il rumore bianco risulta +0,5 dB più forte dopo la codifica

const { chromium } = loadPlaywright();
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
mkdirSync(out, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'lunibu-audio-'));

const server = await createServer({ root, server: { port: 4181, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: chrome, args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto('http://localhost:4181/?debug', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ppAudio?.tracks);
  const ids = process.argv.length > 2 ? process.argv.slice(2) : await page.evaluate(() => window.__ppAudio.tracks());
  const env = existsSync(join(out, 'env.json')) ? JSON.parse(await (await import('node:fs/promises')).readFile(join(out, 'env.json'), 'utf8')) : {};
  for (const id of ids) {
    const r = await page.evaluate((i) => window.__ppAudio.renderLoop(i), id);
    const name = id === '__ambient' ? 'ambient' : id;
    const wav = join(tmp, name + '.wav');
    writeFileSync(wav, Buffer.from(r.wav, 'base64'));
    if (process.env.AUDIO_KEEP_WAV) writeFileSync(join(process.env.AUDIO_KEEP_WAV, name + '.wav'), Buffer.from(r.wav, 'base64')); // per le misure di loudness
    const dst = join(out, name + '.m4a');
    execFileSync(ffmpegBin(), ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', BITRATE_OVERRIDE[name] || BITRATE, '-movflags', '+faststart', dst]);
    env[name] = r.env;
    console.log(name.padEnd(14), `${r.dur.toFixed(2)} s`, r.periodic ? 'periodico' : 'dissolvenza', `${(statSync(dst).size / 1e6).toFixed(2)} MB`);
  }
  writeFileSync(join(out, 'env.json'), JSON.stringify(env));
} finally {
  await browser.close();
  await server.close();
  rmSync(tmp, { recursive: true, force: true });
}
const total = readdirSync(out).filter((f) => f.endsWith('.m4a')).reduce((a, f) => a + statSync(join(out, f)).size, 0);
console.log(`totale: ${(total / 1e6).toFixed(1)} MB`);
