// Categorie, colori e frasi motivazionali per tema (IT / RU / EN).
export const CATEGORIES = [
  {
    id: 'sonno', emoji: '🌙', color: '#b9b2ec',
    name: { it: 'Sonno', ru: 'Сон', en: 'Sleep' },
    quotes: {
      it: [
        'Anche le notti più lunghe finiscono con un buongiorno.',
        'Ogni bimbo trova il suo ritmo: lo state cercando insieme.',
        'Riposare quando puoi non è pigrizia, è cura.'
      ],
      ru: [
        'Даже самая длинная ночь заканчивается добрым утром.',
        'Каждый малыш находит свой ритм — вы ищете его вместе.',
        'Отдыхать, когда можете, — это не лень, а забота.'
      ],
      en: [
        'Even the longest nights end with a good morning.',
        'Every baby finds their own rhythm: you are looking for it together.',
        'Resting when you can is not laziness, it is care.'
      ]
    }
  },
  {
    id: 'alimentazione', emoji: '🥕', color: '#f7c48f',
    name: { it: 'Alimentazione', ru: 'Питание', en: 'Feeding' },
    quotes: {
      it: [
        'Un assaggio oggi, un sorriso domani: il gusto si costruisce piano.',
        'A tavola conta più la serenità che il piatto vuoto.',
        'Tu decidi cosa offrire, lui quanto mangiarne: siete una squadra.'
      ],
      ru: [
        'Сегодня — кусочек, завтра — улыбка: вкус растёт постепенно.',
        'За столом спокойствие важнее пустой тарелки.',
        'Вы решаете, что предложить, малыш — сколько съесть. Вы команда.'
      ],
      en: [
        'A taste today, a smile tomorrow: flavor is built slowly.',
        'At the table, calm matters more than an empty plate.',
        'You decide what to offer, they decide how much to eat: you are a team.'
      ]
    }
  },
  {
    id: 'salute', emoji: '🩺', color: '#f1b4c3',
    name: { it: 'Salute', ru: 'Здоровье', en: 'Health' },
    quotes: {
      it: [
        'Chiedere aiuto al pediatra è un gesto d\'amore, non un fallimento.',
        'Conosci il tuo bambino meglio di chiunque: fidati del tuo istinto.',
        'Respira. Un passo alla volta, state andando bene.'
      ],
      ru: [
        'Обратиться к педиатру — это проявление любви, а не слабость.',
        'Вы знаете своего малыша лучше всех — доверяйте себе.',
        'Вдохните. Шаг за шагом — у вас всё получается.'
      ],
      en: [
        'Asking the pediatrician for help is an act of love, not a failure.',
        'You know your child better than anyone: trust your instincts.',
        'Breathe. One step at a time, you are doing well.'
      ]
    }
  },
  {
    id: 'sviluppo', emoji: '🐣', color: '#a8d0be',
    name: { it: 'Crescita e movimento', ru: 'Развитие и движение', en: 'Growth and movement' },
    quotes: {
      it: [
        'Ogni bimbo sboccia nel suo tempo, come i fiori.',
        'Non è una gara: è un viaggio meraviglioso.',
        'Oggi un rotolone, domani un passo: tutto conta.'
      ],
      ru: [
        'Каждый малыш расцветает в своё время, как цветок.',
        'Это не гонка, а чудесное путешествие.',
        'Сегодня — перекат, завтра — шаг: важно всё.'
      ],
      en: [
        'Every child blooms in their own time, like flowers.',
        'It is not a race: it is a wonderful journey.',
        'A roll today, a step tomorrow: everything counts.'
      ]
    }
  },
  {
    id: 'linguaggio', emoji: '💬', color: '#a9c7ee',
    name: { it: 'Linguaggio e lettura', ru: 'Речь и чтение', en: 'Language and reading' },
    quotes: {
      it: [
        'Ogni parola che gli regali è un mattoncino del suo mondo.',
        'Parlare, cantare, leggere: le tue voci preferite sono la tua.',
        'Una storia prima della nanna vale più di mille giochi.'
      ],
      ru: [
        'Каждое ваше слово — кирпичик его мира.',
        'Говорите, пойте, читайте: ваш голос — самый любимый.',
        'Сказка перед сном стоит тысячи игрушек.'
      ],
      en: [
        'Every word you give them is a little brick in their world.',
        'Talking, singing, reading: their favorite voice is yours.',
        'A story before bedtime is worth a thousand toys.'
      ]
    }
  },
  {
    id: 'emozioni', emoji: '🌈', color: '#f7d79a',
    name: { it: 'Emozioni e comportamento', ru: 'Эмоции и поведение', en: 'Emotions and behavior' },
    quotes: {
      it: [
        'Dietro un capriccio c\'è un piccolo cuore che sta imparando.',
        'Non serve essere genitori perfetti, basta essere presenti.',
        'La calma si impara guardando la tua.'
      ],
      ru: [
        'За капризом стоит маленькое сердце, которое учится.',
        'Не нужно быть идеальными родителями — достаточно быть рядом.',
        'Спокойствию малыш учится, глядя на ваше.'
      ],
      en: [
        'Behind a tantrum there is a little heart that is learning.',
        'You do not need to be perfect parents, just present ones.',
        'Calm is learned by watching yours.'
      ]
    }
  },
  {
    id: 'gioco', emoji: '🧸', color: '#f5b39b',
    name: { it: 'Gioco e schermi', ru: 'Игра и экраны', en: 'Play and screens' },
    quotes: {
      it: [
        'Giocare è il lavoro più serio dei bambini.',
        'Il gioco migliore? Quello in cui ci sei anche tu.',
        'Una scatola di cartone può diventare un castello.'
      ],
      ru: [
        'Игра — самая серьёзная работа детей.',
        'Лучшая игра — та, в которой есть вы.',
        'Картонная коробка может стать замком.'
      ],
      en: [
        'Play is children\'s most serious work.',
        'The best game? The one you are part of too.',
        'A cardboard box can become a castle.'
      ]
    }
  },
  {
    id: 'sicurezza', emoji: '🛡️', color: '#9ed3d6',
    name: { it: 'Sicurezza', ru: 'Безопасность', en: 'Safety' },
    quotes: {
      it: [
        'Piccole attenzioni oggi, grandi tranquillità domani.',
        'Proteggere non vuol dire vietare tutto: vuol dire preparare il terreno.',
        'Un ambiente sicuro lascia spazio alla curiosità.'
      ],
      ru: [
        'Маленькие меры сегодня — большое спокойствие завтра.',
        'Защищать — не значит всё запрещать, а значит подготовить пространство.',
        'Безопасная среда оставляет место для любопытства.'
      ],
      en: [
        'Small precautions today, great peace of mind tomorrow.',
        'Protecting does not mean forbidding everything: it means preparing the ground.',
        'A safe environment leaves room for curiosity.'
      ]
    }
  }
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const GENERAL_QUOTES = {
  it: [
    'Stai facendo un lavoro straordinario, anche nei giorni storti.',
    'Il fatto che tu stia cercando risposte dice già molto di te.',
    'Nessun manuale conosce il tuo bambino come lo conosci tu.',
    'Un respiro profondo, una tazza calda, e si riparte.',
    'I giorni sono lunghi, ma gli anni volano: goditi un sorriso oggi.'
  ],
  ru: [
    'Вы делаете невероятную работу — даже в трудные дни.',
    'То, что вы ищете ответы, уже многое о вас говорит.',
    'Ни одна книга не знает вашего малыша так, как вы.',
    'Глубокий вдох, чашка чего-то тёплого — и дальше.',
    'Дни длинные, а годы летят: порадуйтесь улыбке сегодня.'
  ],
  en: [
    'You are doing an extraordinary job, even on the rough days.',
    'The fact that you are looking for answers already says a lot about you.',
    'No manual knows your child the way you do.',
    'A deep breath, a warm cup, and off we go.',
    'The days are long, but the years fly: enjoy a smile today.'
  ]
};

export function pickQuote(lang, categoryId, seed = Date.now()) {
  const list = categoryId ? CAT[categoryId]?.quotes[lang] : GENERAL_QUOTES[lang];
  const arr = list?.length ? list : (GENERAL_QUOTES[lang] || GENERAL_QUOTES.it);
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}
