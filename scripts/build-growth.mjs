// Builds src/data/growth.json (monthly L,M,S 0-144 months) from WHO LMS tables in scripts/data-raw.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = new URL('./data-raw/', import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), 'utf8').trim().split('\n').slice(1).map((r) => r.split('\t'));
const DAYS = 30.4375;
const r4 = (x) => Math.round(x * 1e5) / 1e5;
function build(std, ref, maxStd = 60, maxAll = 144, minAll = 0) {
  const out = { 1: [], 2: [], early: { 1: [], 2: [] } };
  const byDay = { 1: new Map(), 2: new Map() };
  for (const [sex, age, l, m, s] of read(std)) byDay[sex].set(+age, [r4(+l), r4(+m), r4(+s)]);
  const byMonth = { 1: new Map(), 2: new Map() };
  if (ref) for (const [sex, age, l, m, s] of read(ref)) byMonth[sex].set(+age, [r4(+l), r4(+m), r4(+s)]);
  for (const sex of [1, 2]) {
    for (let mo = 0; mo <= maxAll; mo++) {
      if (mo < minAll) out[sex].push(null);
      else if (mo <= maxStd) out[sex].push(byDay[sex].get(Math.round(mo * DAYS)));
      else if (ref) out[sex].push(byMonth[sex].get(mo));
      else break;
    }
    // primi 91 giorni: valori giornalieri (le mensili sbagliano fino a ~0,2 z nei primi 2 mesi)
    if (minAll === 0) for (let d = 0; d <= 91; d++) out.early[sex].push(byDay[sex].get(d));
    if (std === 'lenanthro.txt') out[`len730_${sex}`] = byDay[sex].get(730); // ultima lunghezza (sdraiato) prima dei 24 mesi
    if (out[sex].some((v, i) => !v && i >= minAll)) throw new Error(`missing values in ${std}`);
  }
  return out;
}
const weight = build('weianthro.txt', 'wfawho2007.txt', 60, 120); // peso per età OMS 2007: solo fino a 10 anni
const bmi = build('bmianthro.txt', 'bfawho2007.txt', 60, 144, 24); // BMI per età: 24-60 mesi standard 2006, 61-144 reference 2007
delete bmi.early;
const data = {
  source: 'WHO Child Growth Standards 2006 (0-60 mesi); WHO Growth Reference 2007 (61-144 mesi)',
  weight,
  height: build('lenanthro.txt', 'hfawho2007.txt'),
  head: build('hcanthro.txt', null, 60, 60),
  bmi,
};
mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/growth.json', import.meta.url), JSON.stringify(data));
console.log('growth.json ok');
