// Giro delle funzioni (coach-mark sull'interfaccia reale). Nuova funzionalità visibile → aggiungi un passo con since = versione.
// target: valore di data-tour="…" sull'elemento reale da evidenziare. Testi brevi (≤ 60 caratteri).
// Gli id della 1.13.0 restano invariati: chi li ha già visti non li rivede.
export const TOUR_TARGETS = ['search', 'nav-giochi', 'nav-suoni', 'nav-diario', 'nav-bimbi', 'footer', 'recall', 'lang'];
export const TOUR = [
  { id: 'domande', since: '1.13.0', target: 'search', icon: '🔎',
    it: { text: 'Cerca una domanda: risposte per età, con fonti' },
    ru: { text: 'Задайте вопрос: ответы по возрасту, с источниками' },
    en: { text: 'Ask a question: age-based answers, with sources' } },
  { id: 'giochi', since: '1.13.0', target: 'nav-giochi', icon: '🧸',
    it: { text: 'Giochi adatti all\'età' },
    ru: { text: 'Игры по возрасту ребёнка' },
    en: { text: 'Games suited to the age' } },
  { id: 'suoni', since: '1.13.0', target: 'nav-suoni', icon: '🌙',
    it: { text: 'Ninne nanne e rumori, anche a schermo spento' },
    ru: { text: 'Колыбельные и шумы, даже при выключенном экране' },
    en: { text: 'Lullabies and noises, even with the screen off' } },
  { id: 'diario', since: '1.13.0', target: 'nav-diario', icon: '📒',
    it: { text: 'Crescita, medicine e tappe' },
    ru: { text: 'Рост, лекарства и вехи' },
    en: { text: 'Growth, medicines and milestones' } },
  { id: 'bimbi', since: '1.13.0', target: 'nav-bimbi', icon: '👶',
    it: { text: 'Profili e condivisione con l\'altro genitore' },
    ru: { text: 'Профили и обмен данными с другим родителем' },
    en: { text: 'Profiles and sharing with the other parent' } },
  { id: 'avviso', since: '1.13.0', target: 'footer', icon: '⚠️',
    it: { text: 'Non sostituisce il pediatra' },
    ru: { text: 'Не заменяет педиатра' },
    en: { text: 'It does not replace the pediatrician' } },
  { id: 'offline', since: '1.13.0', target: 'recall', icon: '❔',
    it: { text: 'Riapri questa guida da qui' },
    ru: { text: 'Откройте это руководство снова здесь' },
    en: { text: 'Reopen this guide from here' } },
  { id: 'lingua', since: '1.14.0', target: 'lang', icon: '🌍',
    it: { text: 'Lingua: Italiano, Русский, English' },
    ru: { text: 'Язык: Italiano, Русский, English' },
    en: { text: 'Language: Italiano, Русский, English' } }
];
