// Fails if tracked/staged files contain personal emails, tokens or private keys.
// Allowed identity: GitHub noreply addresses and project/organization emails used in sources.
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const files = execSync('git ls-files -co --exclude-standard', { encoding: 'utf8' })
  .split('\n').filter((f) => f && existsSync(f) && !/\.(png|jpe?g|webp|woff2?|ico)$/i.test(f) && !f.includes('package-lock'));

const rules = [
  ['email personale', /[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|icloud|libero|yandex|mail)\.[a-z.]+/gi],
  ['token GitHub', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['chiave AWS', /\bAKIA[0-9A-Z]{16}\b/g],
  ['chiave API generica', /\b(sk|pk)-[A-Za-z0-9]{24,}\b/g],
  ['chiave privata', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['file env', null],
];
const problems = [];
for (const f of files) {
  if (/(^|\/)\.env(\.|$)/.test(f)) { problems.push(`${f}: file env`); continue; }
  if (f === 'scripts/check-secrets.mjs') continue;
  let text; try { text = readFileSync(f, 'utf8'); } catch { continue; }
  for (const [name, re] of rules) {
    if (!re) continue;
    const m = text.match(re);
    if (m) problems.push(`${f}: ${name} (${m[0].slice(0, 6)}…)`);
  }
}
if (problems.length) {
  console.log('Possibili dati sensibili:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`check-secrets: ${files.length} file controllati, nessun dato sensibile.`);
