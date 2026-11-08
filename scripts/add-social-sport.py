# Schede su nido/scuola dell'infanzia, socialità e sport (fonti S*, P* verificate).
import json

def A(t, f, to, strict=False):
    d = {"t": t, "from": f, "to": to}
    if strict: d["strict"] = True
    return d

def pair(it, ru):
    return it, ru

CARDS = {
"emozioni": [
 {"id": "nido-ricerca", "category": "emozioni", "ageFrom": 6, "ageTo": 72, "alert": "none", "evidence": "alta",
  "sources": ["S8", "S1", "S3", "S4", "S2", "S7b", "B32"],
  "it": {"title": "Nido e scuola dell'infanzia: cosa dice la ricerca",
    "summary": "Conta soprattutto la qualità del servizio, e la famiglia resta l'influenza più forte. Gli effetti della frequenza esistono ma sono piccoli, positivi o negativi a seconda di qualità e ore.",
    "keywords": ["nido", "asilo nido", "scuola dell'infanzia", "materna", "mandarlo al nido", "fa bene il nido", "quando iscriverlo", "socializzazione", "qualità del nido", "ore al nido"],
    "research": [
      "Il grande studio americano NICHD (NICHD 2006; Belsky 2007) ha trovato che il modo di essere genitori pesa più del tipo di cura: a 4 anni e mezzo l'effetto della qualità del nido sul linguaggio era circa un terzo di quello della famiglia.",
      "Nello stesso studio una qualità più alta si associava a un vocabolario migliore fino alla prima media; più ore in strutture collettive si associavano a un po' più di comportamenti difficili segnalati dalle maestre. Gli effetti erano piccoli.",
      "Una meta-analisi di esperimenti naturali europei e non (van Huizen e Plantenga 2018) trova risultati misti nel complesso, ma servizi di alta qualità con effetti positivi costanti, maggiori per i bambini di famiglie svantaggiate; l'età d'ingresso non cambiava in modo coerente i risultati.",
      "Una meta-analisi di 17 studi europei (Ulferts 2019) collega la qualità delle interazioni educative a piccoli vantaggi in linguaggio e matematica che durano negli anni di scuola.",
      A("Una meta-analisi (Vermeer e van IJzendoorn 2006) ha trovato livelli di cortisolo, l'ormone dello stress, più alti nei giorni di nido che a casa, soprattutto sotto i 3 anni.", 6, 36)
    ],
    "tips": [
      "Guarda la qualità: educatrici stabili e calde, gruppi piccoli, rapporto adulti/bambini adeguato, tempo per giocare.",
      "Se puoi scegliere, valuta anche quante ore al giorno: per i più piccoli giornate lunghe sono più impegnative.",
      "Fai un inserimento graduale con te presente all'inizio (Ahnert 2004).",
      "Non pensare che \"non piange più\" voglia dire per forza che si è ambientato: conta che esplori, sorrida e interagisca (Datler 2012).",
      "A casa continuate a leggere, giocare e parlare: è l'ingrediente che pesa di più."
    ]},
  "ru": {"title": "Ясли и детский сад: что говорят исследования",
    "summary": "Важнее всего качество учреждения, а семья остаётся самым сильным влиянием. Эффекты посещения есть, но они небольшие — положительные или отрицательные в зависимости от качества и количества часов.",
    "keywords": ["ясли", "детский сад", "садик", "отдавать в сад", "полезен ли сад", "когда отдавать", "социализация", "качество сада", "часы в саду"],
    "research": [
      "Крупное американское исследование NICHD (NICHD, 2006; Belsky, 2007): родительское поведение влияет сильнее, чем тип ухода; в 4,5 года эффект качества яслей на речь составлял около трети эффекта семьи.",
      "В том же исследовании более высокое качество было связано с лучшим словарным запасом вплоть до 6-го класса; больше часов в группах — с немного большим числом поведенческих трудностей по оценке воспитателей. Эффекты были небольшими.",
      "Метаанализ естественных экспериментов (van Huizen, Plantenga, 2018): в целом результаты смешанные, но качественные учреждения стабильно дают положительный эффект, особенно для детей из неблагополучных семей; возраст начала посещения не менял результаты последовательно.",
      "Метаанализ 17 европейских исследований (Ulferts, 2019) связывает качество педагогического взаимодействия с небольшими преимуществами в речи и математике, сохраняющимися в школьные годы.",
      A("Метаанализ (Vermeer, van IJzendoorn, 2006) выявил более высокий уровень кортизола, гормона стресса, в дни в яслях, чем дома, особенно до 3 лет.", 6, 36)
    ],
    "tips": [
      "Смотрите на качество: стабильные и тёплые воспитатели, небольшие группы, достаточное число взрослых на детей, время для игры.",
      "Если есть выбор, учитывайте и количество часов в день: для малышей длинные дни труднее.",
      "Проводите адаптацию постепенно, в начале оставаясь рядом (Ahnert, 2004).",
      "«Перестал плакать» не всегда значит «привык»: важно, что ребёнок исследует, улыбается и общается (Datler, 2012).",
      "Дома продолжайте читать, играть и разговаривать — это весит больше всего."
    ]}},
 {"id": "socialita", "category": "emozioni", "ageFrom": 18, "ageTo": 72, "alert": "pediatra", "evidence": "alta",
  "sources": ["A24", "S5", "B27"],
  "it": {"title": "Amici e socialità: come cresce",
    "summary": "Si passa dal giocare accanto agli altri al giocare insieme, rispettando turni e regole. Le tappe CDC/AAP aiutano a sapere cosa aspettarsi a ogni età.",
    "keywords": ["socialità", "amici", "gioca da solo", "non gioca con gli altri", "condividere", "fare a turno", "empatia", "timido", "abilità sociali", "litiga"],
    "research": [
      A("CDC/AAP 2022, 2 anni: nota quando qualcuno è triste o ferito e guarda il tuo viso per capire come reagire in situazioni nuove.", 18, 30),
      A("CDC/AAP, 30 mesi: gioca accanto agli altri bambini e a volte con loro.", 24, 36),
      A("CDC/AAP, 3 anni: nota gli altri bambini e si unisce al loro gioco; si calma entro 10 minuti dopo il saluto al nido.", 30, 48),
      A("CDC/AAP, 4 anni: fa finta di essere qualcun altro, chiede di giocare con gli amici, consola chi è triste e gli piace aiutare.", 42, 60),
      A("CDC/AAP, 5 anni: segue le regole e fa a turno nei giochi con altri bambini.", 54, 72),
      "Una meta-analisi di 48 studi (Murano 2020) mostra che i programmi di educazione socio-emotiva nella scuola dell'infanzia migliorano le competenze sociali e riducono i comportamenti problematici, con effetti da piccoli a medi."
    ],
    "tips": [
      "Organizza ogni tanto incontri di gioco con uno o due bambini: per iniziare, piccoli gruppi sono più facili.",
      "Dai un nome alle emozioni (\"Luca è triste perché…\") e chiedi cosa si potrebbe fare.",
      "Giochi a turni come rotolare una palla o i giochi da tavolo semplici allenano l'attesa.",
      "Non forzare la condivisione dei giochi preferiti: proponi di metterli via prima che arrivino gli amici.",
      "La timidezza è un tratto, non un difetto: dai tempo e resta vicino all'inizio."
    ],
    "redFlags": [
      "Non mostra interesse per le altre persone o non cerca di condividere con te ciò che lo interessa.",
      "Perde abilità sociali o di linguaggio che aveva.",
      "Aggressività frequente che non migliora, o le maestre segnalano difficoltà importanti."
    ]},
  "ru": {"title": "Друзья и общение: как это развивается",
    "summary": "Ребёнок переходит от игры рядом с другими к совместной игре с очерёдностью и правилами. Этапы CDC/AAP помогают понять, чего ждать в каждом возрасте.",
    "keywords": ["общение", "друзья", "играет один", "не играет с детьми", "делиться", "по очереди", "эмпатия", "стеснительный", "социальные навыки", "ссорится"],
    "research": [
      A("CDC/AAP 2022, 2 года: замечает, когда кому-то грустно или больно, и смотрит на ваше лицо, чтобы понять, как реагировать в новой ситуации.", 18, 30),
      A("CDC/AAP, 30 месяцев: играет рядом с другими детьми и иногда с ними.", 24, 36),
      A("CDC/AAP, 3 года: замечает других детей и присоединяется к их игре; успокаивается в течение 10 минут после прощания в садике.", 30, 48),
      A("CDC/AAP, 4 года: изображает кого-то другого, просится поиграть с друзьями, утешает того, кому грустно, любит помогать.", 42, 60),
      A("CDC/AAP, 5 лет: соблюдает правила и очерёдность в играх с другими детьми.", 54, 72),
      "Метаанализ 48 исследований (Murano, 2020): программы социально-эмоционального обучения в детском саду улучшают социальные навыки и уменьшают проблемное поведение, эффекты от малых до средних."
    ],
    "tips": [
      "Иногда устраивайте игровые встречи с одним-двумя детьми: для начала маленькие группы проще.",
      "Называйте эмоции («Лука грустит, потому что…») и спрашивайте, что можно сделать.",
      "Игры по очереди — катать мяч, простые настольные игры — учат ждать.",
      "Не заставляйте делиться любимыми игрушками: предложите убрать их до прихода друзей.",
      "Застенчивость — черта, а не недостаток: дайте время и будьте рядом в начале."
    ],
    "redFlags": [
      "Не проявляет интереса к другим людям и не пытается делиться с вами тем, что его интересует.",
      "Теряет уже освоенные социальные или речевые навыки.",
      "Частая агрессия, которая не проходит, или воспитатели сообщают о серьёзных трудностях."
    ]}}
],
"gioco": [
 {"id": "sport-bambini", "category": "gioco", "ageFrom": 24, "ageTo": 72, "alert": "none", "evidence": "alta",
  "sources": ["P1", "P2", "P8", "P4", "P4b", "P5", "D3", "D4"],
  "it": {"title": "Quale sport e quando?",
    "summary": "Prima dei 6 anni conta il movimento libero e vario più dello sport organizzato. La scelta va fatta in base al divertimento del bambino, non alla specializzazione precoce.",
    "keywords": ["sport", "quale sport", "a che età lo sport", "calcio", "danza", "ginnastica", "nuoto", "arti marziali", "corsi", "attività sportiva", "psicomotricità"],
    "research": [
      "L'AAP (Logan e Cuff 2019) indica i 6 anni come età adatta per iniziare la maggior parte degli sport organizzati: prima molti bambini non hanno ancora abilità e attenzione sufficienti, e serve tanto gioco libero.",
      "Per 2–5 anni l'AAP suggerisce attività di base come correre, nuotare, capriole, lanciare e afferrare, senza competizione.",
      "Due meta-analisi (Logan 2012; Wick 2017) mostrano che programmi di movimento ben strutturati nella prima infanzia migliorano le abilità motorie di base, più del solo gioco libero; la qualità delle prove è però bassa.",
      "Una revisione (Robinson 2015) associa una buona competenza motoria da piccoli a più attività fisica e a un peso sano negli anni successivi.",
      "L'AAP (Brenner 2016) sconsiglia di specializzarsi in un solo sport prima dei 15–16 anni: la specializzazione precoce si associa a più infortuni da sovraccarico e abbandoni.",
      "Una revisione sull'abbandono dello sport (Crane e Temple 2015) indica come cause principali la mancanza di divertimento, il sentirsi poco capaci e le pressioni."
    ],
    "tips": [
      "Prima dei 6 anni: corsi di movimento o psicomotricità, nuoto, danza, giochi con la palla, bici: varietà e divertimento.",
      "Scegli in base a ciò che gli piace e al suo carattere: c'è chi ama il gruppo e chi preferisce attività individuali.",
      "Tieni conto anche di orari, distanza e costi: lo sport che dura è quello sostenibile per la famiglia.",
      "Più sport diversi sono meglio di uno solo: allenano abilità diverse e riducono il rischio di stancarsi.",
      "Niente pressioni sui risultati: chiedigli se si è divertito, non se ha vinto."
    ]},
  "ru": {"title": "Какой спорт и когда?",
    "summary": "До 6 лет свободное и разнообразное движение важнее организованного спорта. Выбирать стоит по тому, что ребёнку нравится, а не ради ранней специализации.",
    "keywords": ["спорт", "какой спорт", "с какого возраста спорт", "футбол", "танцы", "гимнастика", "плавание", "единоборства", "секции", "кружки"],
    "research": [
      "AAP (Logan, Cuff, 2019) называет 6 лет подходящим возрастом для начала большинства организованных видов спорта: до этого у многих детей недостаточно навыков и внимания, и нужно много свободной игры.",
      "Для 2–5 лет AAP предлагает базовые занятия: бег, плавание, кувырки, бросание и ловля — без соревнований.",
      "Два метаанализа (Logan, 2012; Wick, 2017): хорошо организованные программы движения в раннем возрасте улучшают базовые двигательные навыки лучше, чем только свободная игра; однако качество доказательств низкое.",
      "Обзор (Robinson, 2015) связывает хорошую двигательную компетентность в детстве с большей физической активностью и здоровым весом в дальнейшем.",
      "AAP (Brenner, 2016) не рекомендует специализироваться в одном виде спорта до 15–16 лет: ранняя специализация связана с травмами от перегрузки и уходом из спорта.",
      "Обзор причин ухода из спорта (Crane, Temple, 2015): главные причины — отсутствие удовольствия, ощущение, что не получается, и давление."
    ],
    "tips": [
      "До 6 лет: занятия по развитию движений, плавание, танцы, игры с мячом, велосипед — разнообразие и удовольствие.",
      "Выбирайте по интересам и характеру: кто-то любит группу, кто-то — индивидуальные занятия.",
      "Учитывайте расписание, расстояние и стоимость: долго продолжается тот спорт, который посилен семье.",
      "Несколько видов спорта лучше одного: развиваются разные навыки и меньше риск устать.",
      "Без давления на результат: спрашивайте, было ли весело, а не победил ли он."
    ]}}
],
"sicurezza": [
 {"id": "nuoto-acqua", "category": "sicurezza", "ageFrom": 0, "ageTo": 72, "alert": "none", "evidence": "alta",
  "sources": ["P3a", "P3b"],
  "it": {"title": "Corsi di nuoto e sicurezza in acqua",
    "summary": "L'AAP consiglia di iniziare i corsi di nuoto dopo il primo compleanno. Nuotare aiuta, ma da solo non protegge dall'annegamento: serve sempre un adulto a portata di braccio.",
    "keywords": ["nuoto", "corso di nuoto", "piscina", "acquaticità", "neonatale", "annegamento", "mare", "braccioli", "giubbotto salvagente", "sicurezza acqua"],
    "research": [
      A("AAP (Shenoi 2026): non ci sono prove che i corsi di acquaticità per lattanti riducano l'annegamento; possono essere un momento piacevole, non una protezione.", 0, 12, True),
      A("AAP (Shenoi 2026): iniziare i corsi di nuoto dopo il primo compleanno.", 12, 72, True),
      A("In uno studio caso-controllo (Brenner 2009) tra 1 e 4 anni i corsi di nuoto erano associati a un rischio di annegamento più basso (circa −88%), ma i numeri erano piccoli e l'incertezza ampia.", 12, 60),
      "L'AAP raccomanda più livelli di protezione: sorveglianza costante di un adulto a portata di braccio per i bambini sotto i 5 anni, recinzione della piscina sui 4 lati con cancelletto a chiusura automatica, giubbotti salvagente, saper chiamare aiuto e fare la rianimazione."
    ],
    "tips": [
      "In acqua un adulto sempre a portata di braccio, senza telefono in mano.",
      "Braccioli e ciambelle non sono dispositivi di sicurezza: in barca e al lago serve il giubbotto salvagente omologato.",
      "Anche se sa nuotare, non lasciarlo mai solo vicino all'acqua.",
      "Impara la rianimazione pediatrica: è un regalo per tutta la famiglia."
    ]},
  "ru": {"title": "Плавание и безопасность на воде",
    "summary": "AAP советует начинать уроки плавания после первого дня рождения. Умение плавать помогает, но само по себе не защищает от утопления: взрослый всегда должен быть на расстоянии вытянутой руки.",
    "keywords": ["плавание", "уроки плавания", "бассейн", "грудничковое плавание", "утопление", "море", "нарукавники", "спасательный жилет", "безопасность на воде"],
    "research": [
      A("AAP (Shenoi, 2026): нет доказательств, что грудничковое плавание снижает риск утопления; это может быть приятным занятием, но не защитой.", 0, 12, True),
      A("AAP (Shenoi, 2026): начинать уроки плавания после первого дня рождения.", 12, 72, True),
      A("В исследовании случай-контроль (Brenner, 2009) в возрасте 1–4 лет уроки плавания были связаны с меньшим риском утопления (примерно −88%), но число случаев было малым, а неопределённость — большой.", 12, 60),
      "AAP рекомендует несколько уровней защиты: постоянный присмотр взрослого на расстоянии вытянутой руки для детей до 5 лет, ограждение бассейна с 4 сторон с самозакрывающейся калиткой, спасательные жилеты, умение вызвать помощь и провести реанимацию."
    ],
    "tips": [
      "В воде взрослый всегда на расстоянии вытянутой руки и без телефона.",
      "Нарукавники и круги — не средства безопасности: в лодке и на озере нужен сертифицированный спасательный жилет.",
      "Даже если ребёнок умеет плавать, никогда не оставляйте его одного у воды.",
      "Научитесь детской реанимации — это подарок для всей семьи."
    ]}},
 {"id": "bici-casco", "category": "sicurezza", "ageFrom": 24, "ageTo": 72, "alert": "none", "evidence": "alta",
  "sources": ["P6"],
  "it": {"title": "Bici e casco",
    "summary": "Il casco riduce di circa la metà il rischio di trauma cranico in caso di incidente in bici. Va indossato sempre, anche per brevi tragitti e sulle bici senza pedali.",
    "keywords": ["bici", "bicicletta", "casco", "bici senza pedali", "monopattino", "rotelle", "pedalare", "trauma cranico"],
    "research": [
      "Una meta-analisi di 40 studi su oltre 64.000 ciclisti feriti (Olivier e Creighton 2017) ha trovato che il casco si associa a circa il 51% in meno di traumi cranici, il 69% in meno di traumi cranici gravi e il 65% in meno di traumi cranici mortali.",
      "Lo studio riguarda tutte le età: non esistono dati specifici per i più piccoli, ma la protezione della testa vale allo stesso modo."
    ],
    "tips": [
      "Casco della misura giusta: appoggiato in piano sulla fronte, cinghie a V sotto le orecchie, un dito tra cinghia e mento.",
      "Usalo anche su monopattino, pattini e bici senza pedali.",
      "Dai il buon esempio indossandolo anche tu.",
      "Sostituiscilo dopo un urto importante."
    ]},
  "ru": {"title": "Велосипед и шлем",
    "summary": "Шлем примерно вдвое снижает риск черепно-мозговой травмы при падении с велосипеда. Его надо надевать всегда, даже на короткие поездки и на беговеле.",
    "keywords": ["велосипед", "шлем", "беговел", "самокат", "боковые колёса", "кататься", "травма головы"],
    "research": [
      "Метаанализ 40 исследований, более 64 000 пострадавших велосипедистов (Olivier, Creighton, 2017): шлем связан примерно с 51% меньшим числом травм головы, 69% меньшим числом тяжёлых и 65% меньшим числом смертельных травм головы.",
      "Исследование охватывает все возрасты: отдельных данных для малышей нет, но защита головы работает так же."
    ],
    "tips": [
      "Шлем по размеру: ровно на лбу, ремешки буквой V под ушами, между ремешком и подбородком проходит палец.",
      "Надевайте его и на самокат, ролики и беговел.",
      "Показывайте пример — надевайте шлем сами.",
      "Меняйте шлем после сильного удара."
    ]}}
]
}

for cat, new in CARDS.items():
    p = f"content/cards/{cat}.json"
    lst = json.load(open(p))
    ids = {c["id"] for c in new}
    lst = [c for c in lst if c["id"] not in ids] + new
    json.dump(lst, open(p, "w"), ensure_ascii=False, indent=2)
print("ok")
