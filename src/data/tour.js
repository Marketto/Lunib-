// Giro delle funzioni. Nuova funzionalità visibile → aggiungi una slide con since = versione che la introduce.
// tab: rotta a cui porta il pulsante "Vai" ('' = Domande, null = nessuna). char: personaggio di Characters.jsx.
export const TOUR = [
  { id: 'domande', since: '1.13.0', tab: '', char: 'cloud',
    it: { title: 'Domande', text: 'Scrivi una domanda e trovi le risposte della ricerca adatte all\'età del tuo bimbo, ognuna con le sue fonti.' },
    ru: { title: 'Вопросы', text: 'Напишите вопрос, и вы найдёте ответы из исследований, подходящие по возрасту ребёнка, каждый с источниками.' } },
  { id: 'giochi', since: '1.13.0', tab: 'giochi', char: 'bear',
    it: { title: 'Giochi', text: 'Idee di gioco per ogni età, con il perché e le fonti. Scegli quella che ti piace e provala insieme.' },
    ru: { title: 'Игры', text: 'Идеи игр для каждого возраста, с пояснением и источниками. Выберите подходящую и попробуйте вместе.' } },
  { id: 'suoni', since: '1.13.0', tab: 'suoni', char: 'moon',
    it: { title: 'Suoni', text: 'Ninne nanne e rumori, con timer. Continuano anche a schermo spento. Con il microfono puoi controllare il volume.' },
    ru: { title: 'Звуки', text: 'Колыбельные и шумы с таймером. Играют и при выключенном экране. Микрофоном можно проверить громкость.' } },
  { id: 'diario', since: '1.13.0', tab: 'diario', char: 'heart',
    it: { title: 'Diario', text: 'Crescita con le curve OMS e gli avvisi, Medicine con registro e controllo dei limiti solo per paracetamolo e ibuprofene, e le Tappe.' },
    ru: { title: 'Дневник', text: 'Рост с кривыми ВОЗ и предупреждениями, Лекарства с журналом и проверкой лимитов только для парацетамола и ибупрофена, а также Вехи.' } },
  { id: 'bimbi', since: '1.13.0', tab: 'bimbi', char: 'flower',
    it: { title: 'Bimbi', text: 'Un profilo per ogni bimbo. Puoi condividere i dati con l\'altro genitore e importare quelli di Baby Tracker.' },
    ru: { title: 'Дети', text: 'Профиль для каждого ребёнка. Данными можно делиться с другим родителем и импортировать их из Baby Tracker.' } },
  { id: 'offline', since: '1.13.0', tab: null, char: 'leaf',
    it: { title: 'Offline e privato', text: 'Funziona senza connessione e i tuoi dati restano solo sul telefono. Gli aggiornamenti arrivano da soli. Puoi anche condividere l\'app.' },
    ru: { title: 'Офлайн и приватно', text: 'Работает без интернета, а ваши данные остаются только на телефоне. Обновления приходят сами. Приложением можно поделиться.' } },
  { id: 'avviso', since: '1.13.0', tab: null, char: 'sun',
    it: { title: 'Una cosa importante', text: 'Lunibù è uno strumento per cercare in fretta dati dalla ricerca. Non sostituisce il pediatra né gli altri professionisti.' },
    ru: { title: 'Важное', text: 'Lunibù помогает быстро найти данные исследований. Он не заменяет педиатра и других специалистов.' } }
];
