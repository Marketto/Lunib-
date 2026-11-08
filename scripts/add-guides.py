# Guide "consigliati / con moderazione / da evitare" per cibi e giochi, per fascia d'età.
# Ogni voce: t (cosa), v (si | limita | no), why (motivo), src (id fonte), eventuale from/to/strict.
import json

def G(v, src, it, ru, f=None, to=None, strict=False):
    a = {"t": it[0], "v": v, "why": it[1], "src": src}
    b = {"t": ru[0], "v": v, "why": ru[1], "src": src}
    if f is not None:
        for d in (a, b):
            d["from"], d["to"] = f, to
            if strict: d["strict"] = True
    return a, b

def card(cid, cat, f, to, sources, it, ru, items, alert="none", evidence="alta"):
    it = dict(it); ru = dict(ru)
    it["guide"] = [x[0] for x in items]
    ru["guide"] = [x[1] for x in items]
    return {"id": cid, "category": cat, "ageFrom": f, "ageTo": to, "alert": alert, "evidence": evidence,
            "sources": sources, "it": it, "ru": ru}

FOOD = []

# ---------------- CIBI 6–12 MESI ----------------
FOOD.append(card("cibi-6-12", "alimentazione", 6, 12,
  ["A9", "A10", "A13", "A16", "A17", "F1", "F4", "F5", "F6", "F7", "F10", "F10b", "F15"],
  {"title": "Cibi sì e cibi no: 6–12 mesi",
   "summary": "Cosa offrire durante lo svezzamento, cosa limitare e cosa evitare, con il perché di ogni scelta.",
   "keywords": ["cosa può mangiare", "cibi consigliati", "cibi vietati", "cibi da evitare", "svezzamento", "alimenti", "lista cibi", "primo anno"],
   "research": ["L'OMS (2023) raccomanda alimenti di origine animale ogni giorno (carne, pesce o uova), frutta e verdura ogni giorno, e legumi spesso.",
                "ESPGHAN (2017): niente sale né zucchero aggiunti; succhi di frutta e bevande zuccherate vanno evitati."],
   "tips": ["Il latte (materno o formula) resta l'alimento principale per buona parte del primo anno.",
            "Proponi più volte anche i cibi rifiutati: il gusto si costruisce con l'esposizione."]},
  {"title": "Можно и нельзя: 6–12 месяцев",
   "summary": "Что давать во время прикорма, что ограничить и чего избегать — и почему.",
   "keywords": ["что можно есть", "рекомендуемые продукты", "запрещённые продукты", "чего избегать", "прикорм", "продукты", "список продуктов", "первый год"],
   "research": ["ВОЗ (2023) рекомендует продукты животного происхождения каждый день (мясо, рыба или яйца), фрукты и овощи каждый день и часто — бобовые.",
                "ESPGHAN (2017): без добавленной соли и сахара; соков и сладких напитков следует избегать."],
   "tips": ["Молоко (грудное или смесь) остаётся основной едой большую часть первого года.",
            "Снова предлагайте продукты, от которых ребёнок отказался: вкус формируется со временем."]},
  [
   G("si", "A9", ("Carne, pesce, uova ben cotte, legumi", "Danno ferro e proteine proprio quando le riserve di ferro del bambino calano, verso i 6 mesi."),
                  ("Мясо, рыба, хорошо проваренные яйца, бобовые", "Дают железо и белок как раз тогда, когда запасы железа к 6 месяцам снижаются.")),
   G("si", "A9", ("Verdura e frutta ogni giorno, anche dal gusto amaro", "L'OMS le raccomanda quotidianamente; assaggi ripetuti aiutano ad accettarle."),
                  ("Овощи и фрукты каждый день, в том числе горьковатые", "ВОЗ рекомендует их ежедневно; повторные пробы помогают их принять.")),
   G("si", "A13", ("Uovo ben cotto e arachidi in crema liscia o farina", "Introdurli presto e regolarmente riduce il rischio di allergia, secondo le linee guida EAACI."),
                   ("Хорошо проваренное яйцо и арахис в виде гладкой пасты или муки", "Раннее и регулярное введение снижает риск аллергии (рекомендации EAACI).")),
   G("si", "F1", ("Acqua, nel bicchiere o nella tazza", "È la bevanda giusta oltre al latte; succhi e bibite non servono."),
                  ("Вода из стаканчика или чашки", "Правильный напиток помимо молока; соки и газировка не нужны.")),
   G("limita", "F15", ("Spinaci, bietole e altre verdure a foglia", "Possono contenere molti nitrati: porzioni moderate, in frigo subito dopo la cottura, niente spinaci durante una gastroenterite."),
                       ("Шпинат, мангольд и другая листовая зелень", "Могут содержать много нитратов: умеренные порции, сразу в холодильник после варки, не давать шпинат при кишечной инфекции.")),
   G("limita", "F5", ("Pesci grandi predatori (pesce spada, squalo, luccio) e tonno", "Accumulano mercurio. L'EFSA consiglia di limitare queste specie; gli altri pesci vanno benissimo."),
                     ("Крупные хищные рыбы (меч-рыба, акула, щука) и тунец", "Накапливают ртуть. EFSA советует ограничивать эти виды; другая рыба подходит отлично.")),
   G("no", "A17", ("Miele, anche nei biscotti o sul ciuccio", "Può contenere spore del botulino, pericolose sotto i 12 mesi."),
                   ("Мёд, в том числе в печенье или на пустышке", "Может содержать споры ботулизма, опасные до 12 месяцев."), 0, 12, True),
   G("no", "A10", ("Sale e zucchero aggiunti", "I reni sono immaturi e il gusto si abitua al dolce e al salato: ESPGHAN li sconsiglia nel primo anno."),
                   ("Добавленные соль и сахар", "Почки незрелые, а вкус привыкает к сладкому и солёному: ESPGHAN не рекомендует их на первом году.")),
   G("no", "F1", ("Succhi di frutta e bevande zuccherate", "Zuccheri senza fibre e rischio di carie; l'AAP sconsiglia il succo prima dei 12 mesi."),
                  ("Фруктовые соки и сладкие напитки", "Сахар без клетчатки и риск кариеса; AAP не рекомендует сок до 12 месяцев."), 0, 12, True),
   G("no", "A10", ("Latte vaccino come bevanda principale", "Poco ferro e troppe proteine: ESPGHAN indica di non usarlo come bevanda principale prima dei 12 mesi (piccole quantità nelle pappe vanno bene)."),
                   ("Коровье молоко как основной напиток", "Мало железа и слишком много белка: ESPGHAN не советует использовать его как основной напиток до 12 месяцев (немного в блюдах можно)."), 0, 12, True),
   G("no", "F4", ("Bevande vegetali (riso, mandorla, avena…) al posto del latte", "Non sono adatte: quelle di riso contengono arsenico; sotto l'anno solo latte materno o formula."),
                  ("Растительные напитки (рисовый, миндальный, овсяный…) вместо молока", "Не подходят: рисовые содержат мышьяк; до года — только грудное молоко или смесь.")),
   G("no", "F6", ("Uova, carne e pesce crudi o poco cotti; latte crudo e formaggi a latte crudo", "Rischio di Salmonella, Listeria ed E. coli, che nei bimbi sotto i 5 anni può causare gravi complicazioni ai reni."),
                  ("Сырые или недоваренные яйца, мясо и рыба; сырое молоко и сыры из него", "Риск сальмонеллы, листерии и кишечной палочки, которая у детей до 5 лет может вызвать тяжёлые осложнения на почки.")),
   G("no", "A16", ("Frutta secca intera, uva e pomodorini interi, pezzi duri", "Rischio di soffocamento: tagliare per il lungo in quattro, schiacciare o macinare."),
                   ("Цельные орехи, целый виноград и черри, твёрдые кусочки", "Риск удушья: резать вдоль на четыре части, разминать или измельчать.")),
   G("no", "F10b", ("Tè, tisane e caffè", "Riducono l'assorbimento del ferro (il tè nero fino all'80–90%) e contengono caffeina."),
                   ("Чай, травяные чаи и кофе", "Снижают усвоение железа (чёрный чай — до 80–90%) и содержат кофеин."))
  ]))

# ---------------- CIBI 1–3 ANNI ----------------
FOOD.append(card("cibi-1-3", "alimentazione", 12, 36,
  ["A9", "A16", "F1", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F13", "F13b", "F14"],
  {"title": "Cibi sì e cibi no: 1–3 anni",
   "summary": "Dal primo compleanno si mangia quasi come la famiglia, con qualche attenzione in più su sale, zuccheri, bevande e sicurezza.",
   "keywords": ["cosa può mangiare", "cibi consigliati", "cibi da evitare", "alimentazione 2 anni", "merenda", "succo di frutta", "latte di mucca", "salumi", "dolci"],
   "research": ["L'OMS (2023) raccomanda latte animale tra 12 e 23 mesi e sconsiglia i latti di crescita.",
                "ESPGHAN (2017): gli zuccheri liberi dovrebbero essere meno del 5% delle calorie dai 2 anni, e ancora meno sotto i 2."],
   "tips": ["Porta in tavola gli stessi cibi della famiglia, preparati con poco sale.",
            "Frutta intera al posto di succhi e merendine."]},
  {"title": "Можно и нельзя: 1–3 года",
   "summary": "С первого дня рождения ребёнок ест почти как семья, но с вниманием к соли, сахару, напиткам и безопасности.",
   "keywords": ["что можно есть", "рекомендуемые продукты", "чего избегать", "питание в 2 года", "перекус", "сок", "коровье молоко", "колбаса", "сладкое"],
   "research": ["ВОЗ (2023) рекомендует животное молоко с 12 до 23 месяцев и не рекомендует «детские молочки».",
                "ESPGHAN (2017): свободные сахара — меньше 5% калорий с 2 лет и ещё меньше до 2 лет."],
   "tips": ["Давайте те же блюда, что ест семья, с небольшим количеством соли.",
            "Цельные фрукты вместо соков и сладких перекусов."]},
  [
   G("si", "F14", ("Frutta, verdura, legumi e cereali integrali", "Le linee guida italiane (CREA) consigliano più frutta, verdura, legumi e cereali integrali per tutta la famiglia."),
                   ("Фрукты, овощи, бобовые и цельные злаки", "Итальянские рекомендации (CREA) советуют больше фруктов, овощей, бобовых и цельных злаков всей семье.")),
   G("si", "A9", ("Latte vaccino intero e yogurt bianco", "L'OMS indica il latte animale dopo i 12 mesi; i latti di crescita non servono."),
                  ("Цельное коровье молоко и натуральный йогурт", "ВОЗ рекомендует животное молоко после 12 месяцев; «детские молочки» не нужны.")),
   G("si", "F5", ("Pesce, 1–4 porzioni a settimana", "L'EFSA lega i benefici del pesce a 1–4 porzioni a settimana, scegliendo soprattutto specie povere di mercurio."),
                  ("Рыба 1–4 раза в неделю", "EFSA связывает пользу рыбы с 1–4 порциями в неделю, преимущественно видов с низким содержанием ртути.")),
   G("si", "F14", ("Acqua come bevanda abituale", "È la bevanda di riferimento delle linee guida CREA."),
                  ("Вода как основной напиток", "Основной напиток по рекомендациям CREA.")),
   G("limita", "F1", ("Succo di frutta 100%", "Al massimo circa 120 ml al giorno (AAP), mai nel biberon o nella tazza da sorseggiare tutto il giorno."),
                     ("100% фруктовый сок", "Не больше примерно 120 мл в день (AAP), никогда в бутылочке или поильнике на весь день.")),
   G("limita", "F8", ("Sale e cibi molto salati (formaggi stagionati, dadi, snack)", "Per 1–3 anni l'EFSA indica circa 1,1 g di sodio al giorno (circa 2,8 g di sale) da tutti i cibi: il sale aggiunto serve poco."),
                     ("Соль и очень солёное (выдержанные сыры, бульонные кубики, снеки)", "Для 1–3 лет EFSA указывает около 1,1 г натрия в день (около 2,8 г соли) из всех продуктов: добавленная соль почти не нужна.")),
   G("limita", "F13", ("Salumi, würstel e carni lavorate", "Molto sale e nitriti; la IARC classifica la carne lavorata come cancerogena per l'uomo."),
                      ("Колбасы, сосиски и мясные полуфабрикаты", "Много соли и нитритов; МАИР относит переработанное мясо к канцерогенам для человека.")),
   G("limita", "F9", ("Dolci, biscotti, merendine e cereali zuccherati", "ESPGHAN: zuccheri liberi sotto il 5% delle calorie, e ancora meno prima dei 2 anni."),
                     ("Сладости, печенье, кексы и сладкие хлопья", "ESPGHAN: свободных сахаров меньше 5% калорий, а до 2 лет ещё меньше.")),
   G("limita", "F5", ("Pesci grandi predatori e tonno", "Accumulano mercurio: meglio limitarli e variare con altri pesci."),
                     ("Крупные хищные рыбы и тунец", "Накапливают ртуть: лучше ограничивать и чередовать с другой рыбой.")),
   G("no", "F9", ("Bibite zuccherate, tè freddo, succhi con zucchero", "Zuccheri liquidi senza sazietà: vanno sostituiti con acqua o latte."),
                  ("Сладкие газировки, холодный чай, соки с сахаром", "Жидкий сахар без сытости: заменяйте водой или молоком.")),
   G("no", "F10", ("Caffè, bevande con caffeina ed energy drink", "Per i bambini piccoli l'EFSA non ha fissato un livello sicuro di caffeina."),
                   ("Кофе, напитки с кофеином и энергетики", "Для маленьких детей EFSA не установила безопасный уровень кофеина.")),
   G("no", "F4", ("Bevande di riso", "Possono contenere arsenico: ESPGHAN le sconsiglia nei bambini piccoli."),
                  ("Рисовые напитки", "Могут содержать мышьяк: ESPGHAN не рекомендует их маленьким детям.")),
   G("no", "F7", ("Bevande vegetali al posto del latte (mandorla, avena, cocco…)", "Poche proteine e nutrienti: non sono un sostituto adatto. Se serve un'alternativa, chiedi al pediatra (la soia arricchita è la più indicata)."),
                  ("Растительные напитки вместо молока (миндальный, овсяный, кокосовый…)", "Мало белка и питательных веществ: неподходящая замена. Если нужна альтернатива, спросите педиатра (лучше всего обогащённый соевый).")),
   G("no", "F6", ("Latte crudo, formaggi a latte crudo, uova o carne poco cotte", "Rischio di infezioni gravi; l'ISS sconsiglia il latte crudo sotto i 5 anni."),
                  ("Сырое молоко, сыры из сырого молока, недоваренные яйца или мясо", "Риск тяжёлых инфекций; ISS не рекомендует сырое молоко до 5 лет.")),
   G("no", "A16", ("Frutta secca intera, caramelle dure, pop corn, gomme; uva e würstel non tagliati", "Rischio di soffocamento fino a 4–5 anni: tagliare per il lungo, macinare o evitare."),
                   ("Цельные орехи, леденцы, попкорн, жвачка; неразрезанные виноград и сосиски", "Риск удушья до 4–5 лет: резать вдоль, измельчать или избегать."))
  ]))

# ---------------- CIBI 3–6 ANNI ----------------
FOOD.append(card("cibi-3-6", "alimentazione", 36, 72,
  ["F14", "F1", "F5", "F6", "F8", "F9", "F10", "F13", "A16"],
  {"title": "Cibi sì e cibi no: 3–6 anni",
   "summary": "In età prescolare la base è la stessa dieta sana della famiglia; attenzione a bevande zuccherate, sale e cibi a rischio di soffocamento.",
   "keywords": ["cosa può mangiare", "cibi consigliati", "cibi da evitare", "alimentazione 4 anni", "merenda scuola", "dolci", "patatine", "succo", "frutta secca"],
   "research": ["Le linee guida CREA (2018) consigliano per tutti più frutta, verdura, legumi e cereali integrali, acqua in abbondanza, e meno zuccheri e sale.",
                "OMS e ESPGHAN: zuccheri liberi il più bassi possibile, idealmente sotto il 5% delle calorie."],
   "tips": ["Coinvolgilo nella spesa e in cucina: assaggia più volentieri ciò che ha preparato.",
            "Merende semplici: frutta, yogurt bianco, pane, verdure da sgranocchiare."]},
  {"title": "Можно и нельзя: 3–6 лет",
   "summary": "В дошкольном возрасте основа — то же здоровое питание, что и у семьи; внимание к сладким напиткам, соли и продуктам с риском удушья.",
   "keywords": ["что можно есть", "рекомендуемые продукты", "чего избегать", "питание в 4 года", "перекус в садик", "сладкое", "чипсы", "сок", "орехи"],
   "research": ["Рекомендации CREA (2018): всем больше фруктов, овощей, бобовых и цельных злаков, много воды, меньше сахара и соли.",
                "ВОЗ и ESPGHAN: свободных сахаров как можно меньше, в идеале меньше 5% калорий."],
   "tips": ["Привлекайте ребёнка к покупкам и готовке: он охотнее пробует то, что приготовил сам.",
            "Простые перекусы: фрукты, натуральный йогурт, хлеб, овощи «похрустеть»."]},
  [
   G("si", "F14", ("Frutta e verdura a ogni pasto, legumi più volte a settimana", "Base di una dieta sana secondo le linee guida CREA."),
                   ("Фрукты и овощи при каждом приёме пищи, бобовые несколько раз в неделю", "Основа здорового питания по рекомендациям CREA.")),
   G("si", "F14", ("Acqua", "La bevanda di tutti i giorni, anche a scuola e durante il gioco."),
                   ("Вода", "Ежедневный напиток — и в саду, и во время игр.")),
   G("si", "F5", ("Pesce 1–4 volte a settimana, variando le specie", "Benefici per la crescita con un consumo regolare (EFSA)."),
                  ("Рыба 1–4 раза в неделю, разных видов", "Польза для роста при регулярном употреблении (EFSA).")),
   G("limita", "F1", ("Succo di frutta 100%", "Al massimo 120–180 ml al giorno a 4–6 anni (AAP); meglio la frutta intera."),
                     ("100% фруктовый сок", "Не больше 120–180 мл в день в 4–6 лет (AAP); лучше цельные фрукты.")),
   G("limita", "F8", ("Sale, snack salati e patatine", "A 4–6 anni l'EFSA indica circa 1,3 g di sodio al giorno (circa 3,3 g di sale) da tutti i cibi."),
                     ("Соль, солёные снеки и чипсы", "В 4–6 лет EFSA указывает около 1,3 г натрия в день (около 3,3 г соли) из всех продуктов.")),
   G("limita", "F9", ("Dolci, merendine, gelati, cereali zuccherati", "Zuccheri liberi sotto il 5% delle calorie (ESPGHAN): meglio nei pasti che come spuntino continuo."),
                     ("Сладости, кексы, мороженое, сладкие хлопья", "Свободных сахаров меньше 5% калорий (ESPGHAN): лучше во время еды, а не как постоянный перекус.")),
   G("limita", "F13", ("Salumi, würstel e carni lavorate", "Sale e nitriti; carne lavorata cancerogena secondo la IARC."),
                      ("Колбасы, сосиски и переработанное мясо", "Соль и нитриты; переработанное мясо — канцероген по МАИР.")),
   G("limita", "F5", ("Pesce spada, squalo, tonno", "Specie ricche di mercurio: occasionalmente, non ogni settimana."),
                     ("Меч-рыба, акула, тунец", "Виды с большим содержанием ртути: изредка, не каждую неделю.")),
   G("no", "F9", ("Bibite zuccherate e succhi con zucchero aggiunto", "Zucchero liquido: aumenta il rischio di carie e di eccesso di peso."),
                  ("Сладкие газировки и соки с добавленным сахаром", "Жидкий сахар: повышает риск кариеса и лишнего веса.")),
   G("no", "F10", ("Energy drink, caffè e bevande con caffeina", "L'EFSA indica per i bambini un limite di 3 mg di caffeina per kg di peso al giorno: per un bambino piccolo basta poco per superarlo."),
                   ("Энергетики, кофе и напитки с кофеином", "EFSA указывает для детей предел 3 мг кофеина на кг веса в день: маленькому ребёнку легко его превысить.")),
   G("no", "F6", ("Latte crudo e formaggi a latte crudo", "L'ISS li sconsiglia sotto i 5 anni per il rischio di infezioni gravi ai reni (SEU)."),
                  ("Сырое молоко и сыры из сырого молока", "ISS не рекомендует их до 5 лет из-за риска тяжёлой инфекции с поражением почек (ГУС)."), 36, 60, True),
   G("no", "A16", ("Frutta secca intera, caramelle dure, pop corn, gomme", "Rischio di soffocamento fino a 4–5 anni: meglio macinati o in crema."),
                   ("Цельные орехи, леденцы, попкорн, жвачка", "Риск удушья до 4–5 лет: лучше измельчённые или в виде пасты."), 36, 60, True),
   G("si", "A16", ("Frutta secca intera, seduti e sorvegliati", "Dopo i 5 anni si può introdurre, sempre a tavola, mai mentre corre o gioca."),
                   ("Цельные орехи — сидя и под присмотром", "После 5 лет можно давать, но только за столом, а не на бегу или во время игры."), 60, 72, True)
  ]))

TOYS = []

# ---------------- GIOCHI 0–12 MESI ----------------
TOYS.append(card("giochi-0-12", "gioco", 0, 12,
  ["B27", "T1", "T2", "T6", "T6b", "T6c", "T8", "T12", "A3", "T3", "T4"],
  {"title": "Giochi sì e giochi no: 0–12 mesi",
   "summary": "Nel primo anno il gioco migliore sei tu: facce, voci, cucù e oggetti sicuri da toccare e mettere in bocca. Alcuni oggetti sono pericolosi o inutili.",
   "keywords": ["giochi neonato", "giocattoli", "che giochi comprare", "girello", "giostrina", "palestrina", "sonaglio", "giochi da evitare", "giochi primo anno"],
   "research": ["L'AAP (Yogman 2018) indica per il primo anno giochi di sguardi e sorrisi, cucù e oggetti sicuri da esplorare anche con la bocca.",
                "L'AAP (Healey 2019) ricorda che i giocattoli servono soprattutto a giocare insieme: quelli elettronici da soli non danno l'interazione di cui il bambino ha bisogno."],
   "tips": ["Controlla l'etichetta CE e l'avviso \"non adatto a bambini sotto i 36 mesi\".",
            "Pochi giochi alla volta, da ruotare, valgono più di tanti tutti insieme."]},
  {"title": "Игрушки: можно и нельзя, 0–12 месяцев",
   "summary": "На первом году лучшая игрушка — вы: лица, голос, «ку-ку» и безопасные предметы, которые можно трогать и брать в рот. Некоторые вещи опасны или бесполезны.",
   "keywords": ["игрушки для новорождённого", "игрушки", "какие игрушки купить", "ходунки", "мобиль", "развивающий коврик", "погремушка", "опасные игрушки", "игрушки первого года"],
   "research": ["AAP (Yogman, 2018): на первом году — игры взглядами и улыбками, «ку-ку» и безопасные предметы, которые можно исследовать и ртом.",
                "AAP (Healey, 2019): игрушки нужны прежде всего для совместной игры; электронные сами по себе не дают нужного ребёнку общения."],
   "tips": ["Проверяйте маркировку CE и предупреждение «не для детей младше 36 месяцев».",
            "Несколько игрушек, которые меняются по очереди, лучше, чем много сразу."]},
  [
   G("si", "B27", ("Cucù, canzoncine, facce e smorfie", "Il gioco di scambio con l'adulto è la base dello sviluppo sociale e del linguaggio (AAP)."),
                  ("«Ку-ку», песенки, рожицы", "Игра-общение со взрослым — основа социального и речевого развития (AAP).")),
   G("si", "B27", ("Sonagli, anelli, oggetti morbidi da afferrare e mordere", "A questa età si esplora con mani e bocca: servono oggetti grandi, robusti e lavabili."),
                  ("Погремушки, кольца, мягкие предметы, чтобы хватать и грызть", "В этом возрасте мир исследуют руками и ртом: нужны крупные, прочные, моющиеся предметы.")),
   G("si", "T12", ("Libri cartonati", "In uno studio (Sosa 2016) con i libri gli adulti parlavano di più ai bambini che con i giochi elettronici."),
                   ("Картонные книжки", "В исследовании (Sosa, 2016) с книгами взрослые говорили с детьми больше, чем с электронными игрушками.")),
   G("si", "A3", ("Tempo libero sul tappeto, a pancia in giù", "L'OMS consiglia almeno 30 minuti al giorno a pancia in giù per i bimbi che non si spostano ancora."),
                 ("Свободное время на коврике, на животе", "ВОЗ советует не меньше 30 минут в день на животе для детей, которые ещё не ползают.")),
   G("limita", "T12", ("Giochi elettronici con luci e suoni", "Con questi giochi i genitori parlano meno e ci sono meno scambi (Sosa 2016)."),
                      ("Электронные игрушки со светом и звуками", "С ними родители меньше разговаривают и меньше обмениваются репликами (Sosa, 2016).")),
   G("no", "T6", ("Girello", "Non aiuta a camminare, può ritardare lo sviluppo motorio e causa cadute dalle scale: l'AAP ne chiede il divieto."),
                 ("Ходунки", "Не помогают научиться ходить, могут задерживать моторное развитие и приводят к падениям с лестниц: AAP призывает их запретить.")),
   G("no", "T8", ("Giostrine e palestrine tese sul lettino, dopo i 5 mesi", "Rischio di strangolamento: vanno tolte quando il bimbo si spinge su mani e ginocchia o a 5 mesi."),
                 ("Мобили и растяжки над кроваткой после 5 месяцев", "Риск удушения: убрать, когда малыш встаёт на четвереньки, или в 5 месяцев."), 4, 12),
   G("no", "T2", ("Giochi con piccole parti, cordini lunghi, giocattoli per bimbi più grandi", "Rischio di soffocamento e strangolamento: la normativa UE li vieta sotto i 36 mesi."),
                 ("Игрушки с мелкими деталями, длинными шнурками, игрушки для старших детей", "Риск удушья и удушения: законодательство ЕС запрещает их детям до 36 месяцев.")),
   G("no", "T3", ("Oggetti con batterie a bottone accessibili, magneti", "Se ingeriti possono causare lesioni gravissime in poche ore."),
                 ("Предметы с доступными батарейками-таблетками, магниты", "При проглатывании могут вызвать тяжелейшие повреждения за несколько часов.")),
   G("no", "T4", ("Palloncini sgonfi o scoppiati", "Secondo la CPSC sono la prima causa di morte per soffocamento tra i prodotti per bambini."),
                 ("Ненадутые или лопнувшие воздушные шарики", "По данным CPSC, это главная причина смерти от удушья среди детских товаров."))
  ]))

# ---------------- GIOCHI 1–3 ANNI ----------------
TOYS.append(card("giochi-1-3", "gioco", 12, 36,
  ["B27", "T1", "T2", "T3", "T3b", "T4", "T7", "T10", "T12", "B25"],
  {"title": "Giochi sì e giochi no: 1–3 anni",
   "summary": "Costruzioni, incastri, giochi di finzione e tanto movimento. Pochi giochi semplici e un adulto presente valgono più di tanti giochi elettronici.",
   "keywords": ["giochi 2 anni", "giocattoli", "che giochi comprare", "costruzioni", "puzzle", "far finta", "tablet", "giochi da evitare", "perline", "calamite"],
   "research": ["L'AAP (Yogman 2018) consiglia per 1–3 anni cubi, contenitori, cucchiai di legno, puzzle e occasioni di far finta.",
                "In uno studio (Dauch 2018) bimbi di 18–30 mesi con 4 giochi giocavano più a lungo e in modi più vari rispetto a quando ne avevano 16."],
   "tips": ["Tieni a disposizione pochi giochi e ruotali ogni tanto.",
            "Siediti a terra e segui il suo gioco: commenta, imita, proponi."]},
  {"title": "Игрушки: можно и нельзя, 1–3 года",
   "summary": "Конструкторы, сортеры, сюжетные игры и много движения. Несколько простых игрушек и взрослый рядом лучше множества электронных.",
   "keywords": ["игрушки в 2 года", "игрушки", "какие игрушки купить", "конструктор", "пазлы", "игра понарошку", "планшет", "опасные игрушки", "бусины", "магниты"],
   "research": ["AAP (Yogman, 2018) советует в 1–3 года кубики, контейнеры, деревянные ложки, пазлы и возможность играть понарошку.",
                "В исследовании (Dauch, 2018) дети 18–30 месяцев с 4 игрушками играли дольше и разнообразнее, чем с 16."],
   "tips": ["Держите в доступе немного игрушек и иногда меняйте их.",
            "Сядьте на пол и следуйте за его игрой: комментируйте, повторяйте, предлагайте."]},
  [
   G("si", "B27", ("Cubi, incastri, contenitori, puzzle semplici", "Allenano mani, pensiero e pazienza; l'AAP li indica proprio per questa età."),
                  ("Кубики, сортеры, контейнеры, простые пазлы", "Развивают руки, мышление и терпение; AAP рекомендует их именно в этом возрасте.")),
   G("si", "B27", ("Giochi di finzione: cucina, bambole, telefono finto", "Il gioco simbolico (una banana diventa un telefono) sviluppa linguaggio e immaginazione."),
                  ("Игры понарошку: кухня, куклы, игрушечный телефон", "Символическая игра (банан становится телефоном) развивает речь и воображение.")),
   G("si", "B27", ("Palla, spingere e tirare, giochi di movimento", "Correre, arrampicarsi e la lotta per gioco crescono con il camminare e fanno bene."),
                  ("Мяч, каталки, подвижные игры", "Бег, лазание и игровая возня развиваются вместе с ходьбой и полезны.")),
   G("si", "T12", ("Libri da sfogliare insieme", "Con i libri gli adulti usano più parole e più specifiche (Sosa 2016)."),
                   ("Книжки, чтобы листать вместе", "С книгами взрослые используют больше слов, и более точных (Sosa, 2016).")),
   G("limita", "T10", ("Troppi giocattoli tutti insieme", "Con meno giochi i bambini giocano più a lungo con ciascuno (Dauch 2018)."),
                      ("Слишком много игрушек сразу", "С меньшим количеством игрушек дети дольше играют с каждой (Dauch, 2018).")),
   G("limita", "T1", ("Giochi elettronici e app \"educative\"", "Molte promesse educative non sono dimostrate; non sostituiscono il gioco con l'adulto (AAP)."),
                     ("Электронные игрушки и «развивающие» приложения", "Многие обещания пользы не доказаны; они не заменяют игру со взрослым (AAP).")),
   G("no", "B25", ("Tablet e telefono per giocare da solo sotto i 2 anni", "L'AAP sconsiglia i media digitali sotto i 18 mesi, salvo le videochiamate."),
                  ("Планшет и телефон для самостоятельной игры до 2 лет", "AAP не рекомендует цифровые медиа до 18 месяцев, кроме видеозвонков."), 12, 24, True),
   G("no", "T2", ("Giochi con piccole parti (avviso \"non adatto sotto i 36 mesi\")", "Rischio di soffocamento: per legge non sono per questa età."),
                 ("Игрушки с мелкими деталями (пометка «не для детей до 36 месяцев»)", "Риск удушья: по закону не для этого возраста.")),
   G("no", "T3b", ("Calamite piccole e potenti, giochi magnetici con pezzi staccabili", "Se ne ingerisce più di una possono attrarsi attraverso l'intestino e causare lesioni gravi."),
                  ("Маленькие сильные магниты, магнитные игрушки со съёмными деталями", "Если проглотить несколько, они притягиваются через стенки кишечника и вызывают тяжёлые повреждения.")),
   G("no", "T7", ("Perline d'acqua (water beads)", "Se ingerite si gonfiano e possono bloccare l'intestino."),
                 ("Гидрогелевые шарики (орбизы)", "При проглатывании набухают и могут закупорить кишечник.")),
   G("no", "T4", ("Palloncini sgonfi o scoppiati", "Prima causa di morte per soffocamento tra i prodotti per bambini (CPSC); sotto gli 8 anni solo con un adulto."),
                 ("Ненадутые или лопнувшие шарики", "Главная причина смерти от удушья среди детских товаров (CPSC); до 8 лет — только со взрослым."))
  ]))

# ---------------- GIOCHI 3–6 ANNI ----------------
TOYS.append(card("giochi-3-6", "gioco", 36, 72,
  ["B27", "T9", "T11", "T1", "T5", "T3b", "T7", "T4", "D12"],
  {"title": "Giochi sì e giochi no: 3–6 anni",
   "summary": "Spazio a fantasia, giochi con gli amici, all'aperto e un po' di avventura. Alcuni giochi però restano pericolosi a questa età.",
   "keywords": ["giochi 4 anni", "giochi 5 anni", "giocattoli", "che giochi comprare", "trampolino", "giochi all'aperto", "giochi da tavolo", "videogiochi", "giochi da evitare"],
   "research": ["L'AAP (Yogman 2018) consiglia tra 4 e 6 anni tempo e spazio per inventare scene e ruoli, giocare con gli amici e all'aperto.",
                "Una revisione sistematica (Brussoni 2015) conclude, pur con prove di bassa qualità, che il gioco all'aperto con un po' di rischio favorisce la salute dei bambini."],
   "tips": ["Lascia del tempo non organizzato: la noia fa nascere giochi nuovi.",
            "Nel \"gioco guidato\" tu prepari l'occasione e lui guida: è un ottimo modo per imparare giocando."]},
  {"title": "Игрушки и игры: можно и нельзя, 3–6 лет",
   "summary": "Простор для фантазии, игр с друзьями, на улице и немного приключений. Но некоторые игры в этом возрасте остаются опасными.",
   "keywords": ["игры в 4 года", "игры в 5 лет", "игрушки", "какие игрушки купить", "батут", "игры на улице", "настольные игры", "видеоигры", "опасные игрушки"],
   "research": ["AAP (Yogman, 2018) советует в 4–6 лет время и место, чтобы придумывать сцены и роли, играть с друзьями и на улице.",
                "Систематический обзор (Brussoni, 2015) при доказательствах низкого качества заключает, что игра на улице с долей риска полезна для здоровья детей."],
   "tips": ["Оставляйте неорганизованное время: из скуки рождаются новые игры.",
            "В «направляемой игре» вы создаёте возможность, а ведёт ребёнок — отличный способ учиться играя."]},
  [
   G("si", "B27", ("Travestimenti, pupazzi, teatrini, giochi di ruolo", "Inventare scene e ruoli sviluppa linguaggio, regole sociali e autocontrollo (AAP)."),
                  ("Переодевания, куклы, кукольный театр, ролевые игры", "Придумывать сцены и роли — значит развивать речь, социальные правила и самоконтроль (AAP).")),
   G("si", "T11", ("Gioco all'aperto: correre, arrampicarsi, esplorare", "Favorisce attività fisica, abilità sociali e comportamento (Brussoni 2015)."),
                   ("Игры на улице: бегать, лазать, исследовать", "Способствуют физической активности, социальным навыкам и поведению (Brussoni, 2015).")),
   G("si", "T9", ("Giochi da tavolo semplici, costruzioni, disegno e lavoretti", "Allenano attenzione, turni, regole e manualità; con l'adulto diventano \"gioco guidato\"."),
                 ("Простые настольные игры, конструкторы, рисование и поделки", "Тренируют внимание, очерёдность, правила и моторику; со взрослым — «направляемая игра».")),
   G("si", "B27", ("Giocare con altri bambini", "L'AAP consiglia di programmare tempo con gli amici: si impara a condividere e negoziare."),
                  ("Игры с другими детьми", "AAP советует планировать время с друзьями: так учатся делиться и договариваться.")),
   G("limita", "D12", ("Videogiochi e app", "Solo contenuti adatti all'età, con regole chiare su tempi e luoghi e mai nell'ora prima di dormire (AAP)."),
                      ("Видеоигры и приложения", "Только по возрасту, с понятными правилами времени и места и никогда за час до сна (AAP).")),
   G("no", "T5", ("Trampolino elastico in giardino", "L'AAP lo sconsiglia fortemente; sotto i 6 anni il rischio di fratture è più alto. Se si usa: un bambino alla volta, niente capriole, adulto che guarda."),
                 ("Батут во дворе", "AAP настоятельно не рекомендует; до 6 лет выше риск переломов. Если всё же используется: по одному, без сальто, взрослый внимательно следит.")),
   G("no", "T3b", ("Calamite potenti e piccole (anche nei set da costruzione per grandi)", "L'ingestione di più calamite può causare perforazioni intestinali."),
                  ("Сильные маленькие магниты (в том числе в конструкторах для старших)", "Проглатывание нескольких магнитов может вызвать перфорацию кишечника.")),
   G("no", "T7", ("Perline d'acqua (water beads)", "Una volta ingerite si gonfiano e possono causare un'occlusione intestinale."),
                 ("Гидрогелевые шарики (орбизы)", "Проглоченные, они набухают и могут вызвать кишечную непроходимость.")),
   G("no", "T4", ("Palloncini sgonfi senza un adulto", "Sotto gli 8 anni solo con supervisione; raccogli subito i pezzi di quelli scoppiati (CPSC)."),
                 ("Ненадутые шарики без взрослого", "До 8 лет только под присмотром; сразу собирайте кусочки лопнувших (CPSC)."))
  ]))

for cat, new in (("alimentazione", FOOD), ("gioco", TOYS)):
    p = f"content/cards/{cat}.json"
    lst = json.load(open(p))
    ids = {c["id"] for c in new}
    lst = [c for c in lst if c["id"] not in ids] + new
    json.dump(lst, open(p, "w"), ensure_ascii=False, indent=2)
print("ok", len(FOOD), len(TOYS))
