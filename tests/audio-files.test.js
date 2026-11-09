import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';

// Ogni traccia del catalogo (e la musica di sottofondo) ha il suo loop pre-renderizzato in public/audio
describe('loop audio pre-renderizzati', () => {
  const src = readFileSync('src/lib/audio/engine.js', 'utf8');
  const ids = [...src.matchAll(/^\s*\{ id: '([a-z-]+)', group:/gm)].map((m) => m[1]).concat('ambient');
  it('catalogo non vuoto', () => expect(ids.length).toBeGreaterThan(15));
  it.each(ids)('%s.m4a esiste (npm run audio:render)', (id) => {
    const f = `public/audio/${id}.m4a`;
    expect(existsSync(f)).toBe(true);
    expect(statSync(f).size).toBeGreaterThan(100000);
    expect(statSync(f).size).toBeLessThan(2 * 1024 * 1024); // limite di precache di workbox
  });
  it('inviluppi per le animazioni', () => {
    const env = JSON.parse(readFileSync('public/audio/env.json', 'utf8'));
    for (const id of ids) expect(typeof env[id]).toBe('string');
  });
});
