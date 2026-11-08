// Nomi e descrizioni delle tracce (IT / RU)
export const TRACK_TEXT = {
  womb: {
    it: ['Grembo materno', 'Rumore profondo con un battito lento, simile a quello che sentiva nella pancia.'],
    ru: ['Как у мамы в животике', 'Глубокий шум с медленным сердцебиением — как звуки до рождения.']
  },
  shush: {
    it: ['Shhh', 'Un "shhh" ritmico e morbido, come quando lo culli in braccio.'],
    ru: ['Шшш', 'Мягкое ритмичное «шшш», как при укачивании на руках.']
  },
  car: {
    it: ['Viaggio in auto', 'Il rombo basso e regolare della strada, con qualche piccolo sobbalzo.'],
    ru: ['Поездка на машине', 'Низкий ровный гул дороги с редкими мягкими толчками.']
  },
  dryer: {
    it: ['Asciugacapelli', 'Il soffio costante del phon, in versione morbida e senza fischio.'],
    ru: ['Фен', 'Ровный поток воздуха фена — мягкий, без свиста.']
  },
  white: {
    it: ['Rumore bianco', 'Fruscio uniforme che copre i rumori di casa, addolcito negli acuti.'],
    ru: ['Белый шум', 'Ровный шум, который заглушает домашние звуки, со смягчёнными высокими частотами.']
  },
  pink: {
    it: ['Rumore rosa', 'Più morbido del bianco, con meno toni acuti.'],
    ru: ['Розовый шум', 'Мягче белого, с меньшим количеством высоких частот.']
  },
  brown: {
    it: ['Rumore profondo', 'Un brusio basso e avvolgente, il più delicato per l\'orecchio.'],
    ru: ['Глубокий шум', 'Низкий обволакивающий гул, самый мягкий для уха.']
  },
  fan: {
    it: ['Ventilatore', 'Il ronzio costante di un ventilatore lontano.'],
    ru: ['Вентилятор', 'Ровное гудение далёкого вентилятора.']
  },
  rain: {
    it: ['Pioggia leggera', 'Pioggerellina sulla finestra, con qualche goccia.'],
    ru: ['Лёгкий дождь', 'Мелкий дождик за окном, с отдельными каплями.']
  },
  waves: {
    it: ['Onde del mare', 'Onde lente che vanno e vengono, al ritmo di un respiro calmo.'],
    ru: ['Морские волны', 'Медленные волны в ритме спокойного дыхания.']
  },
  brahms: {
    it: ['Ninna nanna di Brahms', 'La ninna nanna più famosa, suonata da un carillon.'],
    ru: ['Колыбельная Брамса', 'Самая известная колыбельная в исполнении музыкальной шкатулки.']
  },
  twinkle: {
    it: ['Brilla brilla la stellina', 'Lenta, in versione carillon.'],
    ru: ['Мерцай, звёздочка', 'Медленно, в версии музыкальной шкатулки.']
  },
  carillon: {
    it: ['Carillon dei sogni', 'Note sempre diverse e senza fine, mai sorprendenti.'],
    ru: ['Шкатулка снов', 'Бесконечная мелодия без резких переходов.']
  },
  moon: {
    it: ['Luna calma', 'Accordi lunghi e campanelle lontane, per accompagnarlo nel sonno.'],
    ru: ['Спокойная луна', 'Долгие аккорды и далёкие колокольчики, чтобы проводить в сон.']
  },
  bubbles: {
    it: ['Bolle', 'Piccoli suoni come bolle, per il tempo a pancia in giù e il gioco a terra.'],
    ru: ['Пузырьки', 'Звуки-пузырьки для времени на животике и игр на полу.']
  },
  marimba: {
    it: ['Marimba allegra', 'Un ritmo tranquillo e solare per giocare insieme.'],
    ru: ['Весёлая маримба', 'Спокойный солнечный ритм для совместной игры.']
  },
  'fra-martino': {
    it: ['Fra Martino', 'Da cantare insieme, battendo le mani.'],
    ru: ['Братец Яков', 'Петь вместе и хлопать в ладоши.']
  },
  dance: {
    it: ['Balliamo!', 'Più vivace, con maracas: per muoversi, saltare e girare.'],
    ru: ['Танцуем!', 'Живее, с маракасами: двигаться, прыгать и кружиться.']
  },
  'twinkle-play': {
    it: ['Stellina ritmata', 'La melodia della stellina, a passo di gioco.'],
    ru: ['Звёздочка в ритме', 'Мелодия «звёздочки» в игровом темпе.']
  }
};

export const SOUND_STRINGS = {
  it: {
    title: 'Suoni',
    sleep: 'Per dormire',
    play: 'Per giocare',
    noise: 'Rumori e natura',
    music: 'Musica',
    forKid: (n, a) => `Scelti per ${n}, ${a}`,
    forAll: 'Tutte le età',
    timer: 'Spegni dopo',
    off: 'Mai',
    min: (m) => `${m} min`,
    volume: 'Volume',
    nowPlaying: 'In riproduzione',
    tapToPlay: 'Tocca un suono per iniziare',
    stop: 'Ferma',
    stopAll: 'Ferma la musica',
    measureTitle: 'Misura il volume',
    measureText: 'Usa il microfono per controllare che il suono al lettino non superi i 50 dB.',
    playFirst: 'Avvia',
    ambientOn: 'Musica di sottofondo attiva',
    ambientOff: 'Attiva la musica di sottofondo',
    safetyTitle: 'Usarli in sicurezza',
    safety: [
      'In uno studio su neonati di 2–7 giorni (Spencer 1990), l\'80% si è addormentato entro 5 minuti con il rumore bianco, contro il 25% senza.',
      'Uno studio sugli apparecchi per il sonno (Hugh 2014) ha misurato che a volume massimo superano i 50 dB, il limite raccomandato per i neonati nei reparti ospedalieri: tieni il volume basso.',
      'Gli autori consigliano di tenere l\'apparecchio ad almeno 2 metri dal lettino, mai dentro o sul bordo, e di usare il timer.',
      'Tutti i suoni dell\'app sono filtrati negli acuti e livellati allo stesso volume percepito. Il telefono non può misurare i decibel nella stanza: tieni un volume da "doccia leggera" e abbassalo se devi alzare la voce per parlare.'
    ],
    playNote: 'Cantate, ballate e battete le mani insieme: la musica è più bella condivisa.'
  },
  ru: {
    title: 'Звуки',
    sleep: 'Для сна',
    play: 'Для игры',
    noise: 'Шумы и природа',
    music: 'Музыка',
    forKid: (n, a) => `Подобрано: ${n}, ${a}`,
    forAll: 'Любой возраст',
    timer: 'Выключить через',
    off: 'Нет',
    min: (m) => `${m} мин`,
    volume: 'Громкость',
    nowPlaying: 'Сейчас играет',
    tapToPlay: 'Нажмите на звук, чтобы начать',
    stop: 'Стоп',
    stopAll: 'Остановить',
    measureTitle: 'Измерить громкость',
    measureText: 'Микрофон проверит, что у кроватки звук не превышает 50 дБ.',
    playFirst: 'Включить',
    ambientOn: 'Фоновая музыка включена',
    ambientOff: 'Включить фоновую музыку',
    safetyTitle: 'Как пользоваться безопасно',
    safety: [
      'В исследовании новорождённых 2–7 дней (Spencer, 1990) 80% уснули в течение 5 минут под белый шум против 25% без него.',
      'Исследование устройств для сна (Hugh, 2014) показало, что на максимальной громкости они превышают 50 дБ — рекомендованный предел для младенцев в больничных отделениях: держите громкость низкой.',
      'Авторы советуют держать устройство не ближе 2 метров от кроватки, никогда не в ней и не на бортике, и использовать таймер.',
      'Все звуки приложения смягчены в высоких частотах и выровнены по воспринимаемой громкости. Телефон не может измерить децибелы в комнате: выбирайте громкость «тихого душа» и убавляйте, если приходится повышать голос.'
    ],
    playNote: 'Пойте, танцуйте и хлопайте вместе: музыка лучше, когда её разделяют.'
  }
};
