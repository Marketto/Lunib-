// Normalizzazione e stemming leggero, condivisi tra build dell'indice e ricerca nell'app.
// Devono restare identici nei due punti, per questo vivono in un solo file.

const STOP = {
  it: new Set(('il lo la i gli le un uno una di a da in con su per tra fra e ed o che chi cosa come ' +
    'del dello della dei degli delle al allo alla ai agli alle dal dalla dai dalle nel nello nella nei ' +
    'negli nelle sul sulla sui sulle mio mia miei mie suo sua non si ci mi ti è sono ha hanno ho quando ' +
    'perché perche quanto quanti quale quali mio figlio figlia bimbo bimba bimbi bimbe bambino bambina bambini bambine figli figlie mi ma se anche').split(' ')),
  ru: new Set(('и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее ' +
    'мне было вот от меня еще нет о из ему когда даже ну ли если уже или ни быть был него до вас нибудь ' +
    'опять уж вам ведь там потом себя ничего ей может они тут где надо ней для мы тебя их чем была ' +
    'сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним ' +
    'здесь этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда при наконец два об ' +
    'другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем ' +
    'хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между ' +
    'ребенок ребёнок ребенка ребёнка малыш малыша сын дочь').split(' ')),
  en: new Set(('a an the and or but if of to in on at by for with from as is are was were be been am do does did ' +
    'it its this that these those i me my we our you your he she they them his her their what when how why who ' +
    'which where can could should would will may might not no so than too very just also about into over ' +
    'baby babies child children kid kids son daughter toddler').split(' '))
};

const RU_SUFFIXES = ['иями', 'ями', 'ами', 'ость', 'ости', 'ению', 'ения', 'ение', 'ениe',
  'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ией', 'ия', 'ий', 'ый', 'ой', 'ая', 'яя', 'ое', 'ее',
  'ые', 'ие', 'ых', 'их', 'ую', 'юю', 'ов', 'ев', 'ей', 'ам', 'ям', 'ах', 'ях', 'ом', 'ем',
  'а', 'я', 'ы', 'и', 'у', 'ю', 'е', 'о', 'ь', 'й'];

const IT_SUFFIXES = ['amenti', 'amento', 'imenti', 'imento', 'azioni', 'azione', 'mente',
  'ini', 'ino', 'ina', 'ine', 'i', 'e', 'a', 'o'];

// Stemming inglese leggero (plurali e suffissi comuni); radice minima di 3 lettere.
const EN_SUFFIXES = ['ations', 'ation', 'ments', 'ment', 'ings', 'ing', 'ies', 'ied', 'ness', 'ly', 'ed', 'es', 's'];

function stemEn(term) {
  for (const suf of EN_SUFFIXES) {
    if (term.length - suf.length >= ((suf === 'ies' || suf === 'ied') ? 2 : 3) && term.endsWith(suf)) {
      let t = term.slice(0, -suf.length);
      if (suf === 'ies' || suf === 'ied') t += 'y';
      else if (/(.)\1$/.test(t) && !/(ll|ss|zz)$/.test(t)) t = t.slice(0, -1); // running → run
      return t.replace(/e$/, '');
    }
  }
  return term.replace(/e$/, '');
}

export function normalize(str, lang) {
  let s = String(str || '').toLowerCase();
  if (lang === 'ru') s = s.replace(/ё/g, 'е');
  // rimuove accenti latini (pupù → pupu), lascia intatto il cirillico
  s = s.normalize('NFD').replace(/([a-z])[̀-ͯ]+/g, '$1').normalize('NFC');
  return s;
}

export function stem(term, lang) {
  if (lang === 'en') return stemEn(term);
  const list = lang === 'ru' ? RU_SUFFIXES : IT_SUFFIXES;
  const minRoot = lang === 'ru' ? 4 : 4;
  let t = term;
  for (const suf of list) {
    if (t.length - suf.length >= minRoot && t.endsWith(suf)) {
      t = t.slice(0, -suf.length);
      break;
    }
  }
  if (lang === 'it') {
    // capriccio / capricci → capricc
    while (t.length > minRoot && /[aeiou]$/.test(t)) t = t.slice(0, -1);
  }
  return t;
}

export function tokenize(str, lang) {
  return normalize(str, lang).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// Usato da MiniSearch come processTerm (indice e query)
export function processTerm(term, lang) {
  const t = normalize(term, lang);
  if (!t || t.length < 2 || STOP[lang]?.has(t)) return null;
  return stem(t, lang);
}

export function isStopword(term, lang) {
  return STOP[lang]?.has(normalize(term, lang));
}
