/* ============================================================
   SILPONIX DEMO — ESHOP.JS
   E-shop: products, cart, checkout
   ============================================================ */

(function () {
    'use strict';

    /* ==================== PRODUCT DATA ==================== */
    var PRODUCTS = [
        { id: 1, name: 'Hondata K-Pro4', name_en: 'Hondata K-Pro4', category: 'ecu', price: 22542, desc: 'Kompletní řídicí jednotka pro Honda K-series motory. Plný přístup k mapám.', desc_en: 'Complete ECU for Honda K-series engines. Full map access and datalogging.', badge: 'bestseller', stock: 5, img: '/img/products/kpro.png',
            desc_long: 'Hondata K-Pro4 je nejpokročilejší standalone ECU pro Honda K-series motory. Umožňuje kompletní přístup ke všem mapám motoru — palivové, zapalovací, VTEC, knock a další. Podporuje datalogging v reálném čase, launch control, boost control (pro turbo aplikace), traction control a dual-map switching. Ideální pro závodní i upravené silniční vozy.',
            desc_long_en: 'Hondata K-Pro4 is the most advanced standalone ECU for Honda K-series engines. Provides full access to all engine maps — fuel, ignition, VTEC, knock and more. Supports real-time datalogging, launch control, boost control (for turbo applications), traction control and dual-map switching. Ideal for racing and modified street cars.',
            specs: [['Typ', 'Standalone ECU'], ['Kompatibilita', 'Honda K20A, K20Z, K24A'], ['Připojení', 'USB + Bluetooth'], ['Software', 'KManager (PC)'], ['Datalogging', 'Ano, real-time'], ['Launch control', 'Ano'], ['Boost control', 'Ano (turbo)'], ['Trakční kontrola', 'Ano'], ['Hmotnost', '280 g'], ['Záruka', '2 roky']],
            specs_en: [['Type', 'Standalone ECU'], ['Compatibility', 'Honda K20A, K20Z, K24A'], ['Connection', 'USB + Bluetooth'], ['Software', 'KManager (PC)'], ['Datalogging', 'Yes, real-time'], ['Launch control', 'Yes'], ['Boost control', 'Yes (turbo)'], ['Traction control', 'Yes'], ['Weight', '280 g'], ['Warranty', '2 years']] },
        { id: 2, name: 'Hondata S300 V3', name_en: 'Hondata S300 V3', category: 'ecu', price: 18990, desc: 'Plug-in ECU pro OBD1 Honda. Datalogging, launch control, boost control.', desc_en: 'Plug-in ECU for OBD1 Honda. Datalogging, launch control, boost control.', badge: '', stock: 3, img: '/img/products/ecu-obd1.png',
            desc_long: 'Hondata S300 V3 je plug-in ECU deska, která se instaluje přímo do originální OBD1 řídící jednotky Honda. Nabízí plnou kontrolu nad palivovými a zapalovacími mapami, datalogging s rozlišením 1 ms, launch control, boost control pro turbo aplikace a možnost přepínání mezi dvěma sadami map. Ověřené řešení pro závodní Honda Civic, CRX, Integra s B-series a H-series motory.',
            desc_long_en: 'Hondata S300 V3 is a plug-in ECU board that installs directly into the original Honda OBD1 ECU. Offers full fuel and ignition map control, 1ms resolution datalogging, launch control, boost control for turbo applications and dual-map switching. Proven solution for racing Honda Civic, CRX, Integra with B-series and H-series engines.',
            specs: [['Typ', 'Plug-in ECU deska'], ['Kompatibilita', 'OBD1 Honda (P28, P72, P30)'], ['Připojení', 'USB'], ['Software', 'SManager (PC)'], ['Datalogging', 'Ano, 1 ms rozlišení'], ['Launch control', 'Ano'], ['Boost control', 'Ano'], ['Dual-map', 'Ano'], ['Hmotnost', '95 g'], ['Záruka', '2 roky']],
            specs_en: [['Type', 'Plug-in ECU board'], ['Compatibility', 'OBD1 Honda (P28, P72, P30)'], ['Connection', 'USB'], ['Software', 'SManager (PC)'], ['Datalogging', 'Yes, 1ms resolution'], ['Launch control', 'Yes'], ['Boost control', 'Yes'], ['Dual-map', 'Yes'], ['Weight', '95 g'], ['Warranty', '2 years']] },
        { id: 3, name: 'Hondata FlashPro', name_en: 'Hondata FlashPro', category: 'ecu', price: 15750, desc: 'Flash tuning pro Honda Civic Si, Accord, CR-Z. OBD2 diagnostika.', desc_en: 'Flash tuning for Honda Civic Si, Accord, CR-Z. OBD2 diagnostics.', badge: 'new', stock: 8, img: '/img/products/kryt-ecu.png',
            desc_long: 'Hondata FlashPro je flash tuning zařízení pro moderní Honda vozy s OBD2. Připojuje se přímo k diagnostickému portu a umožňuje nahrávání kompletních kalibrací do originální řídící jednotky. Podporuje real-time datalogging, diagnostiku chybových kódů, a úpravu všech palivových a zapalovacích map. Kompatibilní s Civic Si (8. a 9. generace), Accord a CR-Z.',
            desc_long_en: 'Hondata FlashPro is a flash tuning device for modern Honda vehicles with OBD2. Connects directly to the diagnostic port and allows uploading complete calibrations to the factory ECU. Supports real-time datalogging, error code diagnostics, and modification of all fuel and ignition maps. Compatible with Civic Si (8th and 9th gen), Accord and CR-Z.',
            specs: [['Typ', 'Flash tuner (OBD2)'], ['Kompatibilita', 'Civic Si, Accord, CR-Z'], ['Připojení', 'USB + OBD2'], ['Software', 'FlashProManager (PC)'], ['Datalogging', 'Ano'], ['Diagnostika', 'OBD2 chybové kódy'], ['Hmotnost', '150 g'], ['Záruka', '2 roky']],
            specs_en: [['Type', 'Flash tuner (OBD2)'], ['Compatibility', 'Civic Si, Accord, CR-Z'], ['Connection', 'USB + OBD2'], ['Software', 'FlashProManager (PC)'], ['Datalogging', 'Yes'], ['Diagnostics', 'OBD2 error codes'], ['Weight', '150 g'], ['Warranty', '2 years']] },
        { id: 4, name: 'Kabeláž pro K-swap', name_en: 'K-swap wiring harness', category: 'ecu', price: 8490, desc: 'Kompletní kabeláž pro swap K-series motoru do starších Honda Civic.', desc_en: 'Complete wiring harness for K-series engine swap into older Honda Civic.', badge: '', stock: 4, img: '/img/products/civky-uchyt.png',
            desc_long: 'Kompletní kabelový svazek určený pro swap K-series motoru (K20, K24) do starších Honda Civic (EG, EK) a CRX. Obsahuje všechny potřebné konektory, reléové moduly a pojistkovou skříňku. Kabeláž je navržena pro použití s Hondata K-Pro a je plug-and-play — minimální nutnost vlastního zapojení.',
            desc_long_en: 'Complete wiring harness for K-series engine swap (K20, K24) into older Honda Civic (EG, EK) and CRX. Includes all necessary connectors, relay modules and fuse box. Designed for use with Hondata K-Pro and is plug-and-play — minimal custom wiring needed.',
            specs: [['Použití', 'K-swap do EG/EK/CRX'], ['Motor', 'K20A, K20Z, K24A'], ['ECU', 'Hondata K-Pro kompatibilní'], ['Konektory', 'OEM Honda kvalita'], ['Délka', '2.4 m hlavní svazek'], ['Pojistky', 'Ano, integrované'], ['Hmotnost', '1.8 kg'], ['Instalace', 'Plug-and-play']],
            specs_en: [['Usage', 'K-swap into EG/EK/CRX'], ['Engine', 'K20A, K20Z, K24A'], ['ECU', 'Hondata K-Pro compatible'], ['Connectors', 'OEM Honda quality'], ['Length', '2.4 m main harness'], ['Fuses', 'Yes, integrated'], ['Weight', '1.8 kg'], ['Installation', 'Plug-and-play']] },
        { id: 5, name: 'Set silentbloků Civic EG', name_en: 'Bushing set Civic EG', category: 'silentbloky', price: 3890, desc: 'Kompletní sada PU silentbloků pro Honda Civic EG (92–95). Shore 80A.', desc_en: 'Complete PU bushing set for Honda Civic EG (92–95). Shore 80A.', badge: 'bestseller', stock: 15, img: '/img/products/silentblok-14h.png',
            desc_long: 'Kompletní sada polyuretanových silentbloků Silponix pro Honda Civic 5. generace (EG, 1992–1995). Nahrazuje všechny originální gumové silentbloky v podvozku — přední ramena, zadní náprava, stabilizátor, řazení. Tvrdost Shore 80A zajišťuje výrazné zlepšení přesnosti řízení a odezvy podvozku při zachování přijatelného komfortu pro silniční provoz.',
            desc_long_en: 'Complete Silponix polyurethane bushing set for Honda Civic 5th gen (EG, 1992–1995). Replaces all original rubber bushings in the chassis — front arms, rear axle, anti-roll bar, gear linkage. Shore 80A hardness provides significant improvement in steering precision and chassis response while maintaining acceptable comfort for road use.',
            specs: [['Materiál', 'Polyuretan (PU)'], ['Tvrdost', 'Shore 80A'], ['Kompatibilita', 'Honda Civic EG (1992–1995)'], ['Obsah sady', '22 kusů + mazivo'], ['Pozice', 'Přední ramena, zadní náprava, stabilizátor'], ['Barva', 'Červená'], ['Životnost', '3–5× delší než guma'], ['Hmotnost sady', '1.2 kg']],
            specs_en: [['Material', 'Polyurethane (PU)'], ['Hardness', 'Shore 80A'], ['Compatibility', 'Honda Civic EG (1992–1995)'], ['Set contents', '22 pieces + grease'], ['Positions', 'Front arms, rear axle, anti-roll bar'], ['Colour', 'Red'], ['Lifespan', '3–5× longer than rubber'], ['Set weight', '1.2 kg']] },
        { id: 6, name: 'Set silentbloků Civic EK', name_en: 'Bushing set Civic EK', category: 'silentbloky', price: 3890, desc: 'Kompletní sada PU silentbloků pro Honda Civic EK (96–00). Shore 80A.', desc_en: 'Complete PU bushing set for Honda Civic EK (96–00). Shore 80A.', badge: '', stock: 12, img: '/img/products/silentblok-106h.png',
            desc_long: 'Kompletní sada polyuretanových silentbloků Silponix pro Honda Civic 6. generace (EK, 1996–2000). Přesně pasuje na EK3, EK4, EK9 (Type R) i EJ modely. Zajišťuje přímější odezvu řízení, lepší kontrolu v zatáčkách a eliminuje prokluz typický pro opotřebené gumové silentbloky.',
            desc_long_en: 'Complete Silponix polyurethane bushing set for Honda Civic 6th gen (EK, 1996–2000). Fits EK3, EK4, EK9 (Type R) and EJ models precisely. Provides more direct steering response, better cornering control and eliminates the slop typical of worn rubber bushings.',
            specs: [['Materiál', 'Polyuretan (PU)'], ['Tvrdost', 'Shore 80A'], ['Kompatibilita', 'Honda Civic EK (1996–2000)'], ['Obsah sady', '24 kusů + mazivo'], ['Pozice', 'Přední ramena, zadní náprava, stabilizátor, řazení'], ['Barva', 'Červená'], ['Životnost', '3–5× delší než guma'], ['Hmotnost sady', '1.4 kg']],
            specs_en: [['Material', 'Polyurethane (PU)'], ['Hardness', 'Shore 80A'], ['Compatibility', 'Honda Civic EK (1996–2000)'], ['Set contents', '24 pieces + grease'], ['Positions', 'Front arms, rear axle, anti-roll bar, gear linkage'], ['Colour', 'Red'], ['Lifespan', '3–5× longer than rubber'], ['Set weight', '1.4 kg']] },
        { id: 7, name: 'Silentblok zadní nápravy ITR', name_en: 'Rear axle bushing ITR', category: 'silentbloky', price: 1290, desc: 'Polyuretanový silentblok zadní nápravy pro Integra Type R DC2.', desc_en: 'Polyurethane rear axle bushing for Integra Type R DC2.', badge: '', stock: 20, img: '/img/products/silentblok-212h.png',
            desc_long: 'Vysoce odolný polyuretanový silentblok zadní nápravy vyvinutý speciálně pro Honda Integra Type R (DC2). Eliminuje vůle v zadní nápravě a výrazně zlepšuje stabilitu v zatáčkách. Dodáván včetně montážního maziva.',
            desc_long_en: 'Highly durable polyurethane rear axle bushing developed specifically for Honda Integra Type R (DC2). Eliminates play in the rear axle and significantly improves cornering stability. Supplied with assembly grease.',
            specs: [['Materiál', 'Polyuretan (PU)'], ['Tvrdost', 'Shore 80A'], ['Kompatibilita', 'Honda Integra Type R DC2'], ['Pozice', 'Zadní náprava'], ['Balení', '2 ks + mazivo'], ['Barva', 'Červená'], ['Hmotnost', '180 g']],
            specs_en: [['Material', 'Polyurethane (PU)'], ['Hardness', 'Shore 80A'], ['Compatibility', 'Honda Integra Type R DC2'], ['Position', 'Rear axle'], ['Package', '2 pcs + grease'], ['Colour', 'Red'], ['Weight', '180 g']] },
        { id: 8, name: 'Silentblok předního ramene', name_en: 'Front arm bushing', category: 'silentbloky', price: 890, desc: 'PU silentblok předního spodního ramene. Civic EG/EK, Integra DC2.', desc_en: 'PU front lower arm bushing. Civic EG/EK, Integra DC2.', badge: '', stock: 25, img: '/img/products/vazelina.jpg',
            desc_long: 'Polyuretanový silentblok předního spodního ramene vlastní výroby Silponix. Přesná náhrada originálního dílu s výrazně delší životností a lepší odezvou řízení. Vhodný pro Honda Civic EG, EK, Integra DC2 a CR-V RD1.',
            desc_long_en: 'Polyurethane front lower arm bushing manufactured by Silponix. Exact replacement for the original part with significantly longer lifespan and better steering response. Suitable for Honda Civic EG, EK, Integra DC2 and CR-V RD1.',
            specs: [['Materiál', 'Polyuretan (PU)'], ['Tvrdost', 'Shore 80A'], ['Kompatibilita', 'Civic EG/EK, Integra DC2, CR-V RD1'], ['Pozice', 'Přední spodní rameno'], ['Balení', '2 ks + mazivo'], ['Barva', 'Červená'], ['Hmotnost', '120 g']],
            specs_en: [['Material', 'Polyurethane (PU)'], ['Hardness', 'Shore 80A'], ['Compatibility', 'Civic EG/EK, Integra DC2, CR-V RD1'], ['Position', 'Front lower arm'], ['Package', '2 pcs + grease'], ['Colour', 'Red'], ['Weight', '120 g']] },
        { id: 9, name: 'Dvouřadá řemenice B-series RED', name_en: 'Dual pulley B-series RED', category: 'motor', price: 5324, desc: 'SET červená dvouřadá řemenice pro Honda B-series. Eloxovaný hliník.', desc_en: 'SET red dual pulley for Honda B-series. Anodised aluminium.', badge: 'bestseller', stock: 6, img: '/img/products/remenice-red.png',
            desc_long: 'SET dvouřadých řemenic v červeném eloxovaném provedení pro Honda B-series motory (B16, B18). Obsahuje klikovou řemenici a řemenici vodního čerpadla. CNC obráběný hliník 6061-T6 s tvrdým eloxem. Odlehčený design snižuje moment setrvačnosti a zlepšuje odezvu motoru.',
            desc_long_en: 'SET of dual pulleys in red anodised finish for Honda B-series engines (B16, B18). Includes crank pulley and water pump pulley. CNC machined 6061-T6 aluminium with hard anodising. Lightweight design reduces moment of inertia and improves engine response.',
            specs: [['Materiál', 'Hliník 6061-T6'], ['Povrch', 'Červený tvrdý elox'], ['Kompatibilita', 'Honda B16A, B16B, B18C'], ['Obsah sady', 'Kliková + vodní čerpadlo'], ['Typ', 'Dvouřadá (2 drážky)'], ['Úspora hmotnosti', '~40 % vs. OEM'], ['Hmotnost sady', '680 g'], ['Výroba', 'CNC obrábění']],
            specs_en: [['Material', 'Aluminium 6061-T6'], ['Finish', 'Red hard anodised'], ['Compatibility', 'Honda B16A, B16B, B18C'], ['Set contents', 'Crank + water pump pulley'], ['Type', 'Dual (2 grooves)'], ['Weight saving', '~40% vs. OEM'], ['Set weight', '680 g'], ['Manufacturing', 'CNC machined']] },
        { id: 10, name: 'Jednořadá řemenice B-series', name_en: 'Single pulley B-series', category: 'motor', price: 2904, desc: 'Odlehčená jednořadá řemenice pro B16/B18. CNC obráběný hliník.', desc_en: 'Lightweight single pulley for B16/B18. CNC machined aluminium.', badge: '', stock: 8, img: '/img/products/remenice-red.png',
            desc_long: 'Odlehčená jednořadá kliková řemenice pro závodní aplikace bez klimatizace a posilovače. Maximální úspora hmotnosti pro závodní B-series motory. CNC obráběný hliník s tvrdým eloxem.',
            desc_long_en: 'Lightweight single groove crank pulley for race applications without A/C and power steering. Maximum weight saving for racing B-series engines. CNC machined aluminium with hard anodising.',
            specs: [['Materiál', 'Hliník 6061-T6'], ['Kompatibilita', 'Honda B16A, B16B, B18C'], ['Typ', 'Jednořadá (1 drážka)'], ['Použití', 'Závodní (bez A/C, bez posilovače)'], ['Úspora hmotnosti', '~60 % vs. OEM'], ['Hmotnost', '220 g'], ['Výroba', 'CNC obrábění']],
            specs_en: [['Material', 'Aluminium 6061-T6'], ['Compatibility', 'Honda B16A, B16B, B18C'], ['Type', 'Single (1 groove)'], ['Usage', 'Racing (no A/C, no power steering)'], ['Weight saving', '~60% vs. OEM'], ['Weight', '220 g'], ['Manufacturing', 'CNC machined']] },
        { id: 11, name: 'Dvouřadá řemenice B-series GOLD', name_en: 'Dual pulley B-series GOLD', category: 'motor', price: 3630, desc: 'SET zlatá dvouřadá řemenice pro Honda B-series. Eloxovaný hliník.', desc_en: 'SET gold dual pulley for Honda B-series. Anodised aluminium.', badge: 'new', stock: 4, img: '/img/products/remenice-red.png',
            desc_long: 'SET dvouřadých řemenic ve zlatém eloxovaném provedení pro Honda B-series motory. Identická specifikace jako RED varianta — CNC hliník 6061-T6, dvouřadá kliková + vodní čerpadlo. Zlatý tvrdý elox pro odlišný vzhled v motorovém prostoru.',
            desc_long_en: 'SET of dual pulleys in gold anodised finish for Honda B-series engines. Same specs as RED variant — CNC aluminium 6061-T6, dual crank + water pump. Gold hard anodising for a distinctive engine bay look.',
            specs: [['Materiál', 'Hliník 6061-T6'], ['Povrch', 'Zlatý tvrdý elox'], ['Kompatibilita', 'Honda B16A, B16B, B18C'], ['Obsah sady', 'Kliková + vodní čerpadlo'], ['Typ', 'Dvouřadá (2 drážky)'], ['Úspora hmotnosti', '~40 % vs. OEM'], ['Hmotnost sady', '680 g'], ['Výroba', 'CNC obrábění']],
            specs_en: [['Material', 'Aluminium 6061-T6'], ['Finish', 'Gold hard anodised'], ['Compatibility', 'Honda B16A, B16B, B18C'], ['Set contents', 'Crank + water pump pulley'], ['Type', 'Dual (2 grooves)'], ['Weight saving', '~40% vs. OEM'], ['Set weight', '680 g'], ['Manufacturing', 'CNC machined']] },
        { id: 12, name: 'Nerezový úchyt cívek CPR', name_en: 'Stainless coil bracket CPR', category: 'motor', price: 1029, desc: 'Nerezový úchyt zapalovacích cívek CPR Modul pro K-series motory.', desc_en: 'Stainless steel CPR ignition coil bracket for K-series engines.', badge: '', stock: 10, img: '/img/products/civky-uchyt.png',
            desc_long: 'Nerezový úchyt zapalovacích cívek CPR Modul vyrobený z leštěné nerezové oceli. Umožňuje montáž coil-pack zapalování na Honda K-series motory s přesunem cívek mimo ventilové víko. Zlepšuje přístup k motoru a estetiku motorového prostoru.',
            desc_long_en: 'Stainless steel CPR Module ignition coil bracket made from polished stainless steel. Allows mounting coil-pack ignition on Honda K-series engines with relocation off the valve cover. Improves engine access and engine bay aesthetics.',
            specs: [['Materiál', 'Nerezová ocel AISI 304'], ['Kompatibilita', 'Honda K20, K24'], ['Povrch', 'Leštěný nerez'], ['Obsah', 'Úchyt + montážní šrouby'], ['Hmotnost', '340 g'], ['Výroba', 'Laserový řez + ohyb']],
            specs_en: [['Material', 'Stainless steel AISI 304'], ['Compatibility', 'Honda K20, K24'], ['Finish', 'Polished stainless'], ['Contents', 'Bracket + mounting screws'], ['Weight', '340 g'], ['Manufacturing', 'Laser cut + bent']] },
        { id: 13, name: 'Vzpěra předního stabilizátoru', name_en: 'Front anti-roll bar link', category: 'podvozek', price: 460, desc: 'Vzpěra předního stabilizátoru 14-H. Zesílená verze pro motorsport.', desc_en: 'Front anti-roll bar link 14-H. Reinforced motorsport version.', badge: '', stock: 30, img: '/img/products/silentblok-14h.png',
            desc_long: 'Zesílená vzpěra předního stabilizátoru Silponix 14-H pro motorsport aplikace. Vyšší tuhost než originální díl zajišťuje přesnější přenos sil ze stabilizátoru do těhlice. Vhodná pro Honda Civic EG, EK, Integra DC2 a další modely s kompatibilním podvozkem.',
            desc_long_en: 'Reinforced Silponix 14-H front anti-roll bar link for motorsport applications. Higher stiffness than the original part ensures more precise force transfer from the anti-roll bar to the hub carrier. Suitable for Honda Civic EG, EK, Integra DC2 and other models with compatible chassis.',
            specs: [['Materiál', 'Ocel, zesílená'], ['Kompatibilita', 'Civic EG/EK, Integra DC2, CRX'], ['Pozice', 'Přední stabilizátor'], ['Balení', '1 ks'], ['Hmotnost', '185 g'], ['Typ', '14-H motorsport']],
            specs_en: [['Material', 'Steel, reinforced'], ['Compatibility', 'Civic EG/EK, Integra DC2, CRX'], ['Position', 'Front anti-roll bar'], ['Package', '1 pc'], ['Weight', '185 g'], ['Type', '14-H motorsport']] },
        { id: 14, name: 'Čep spodní 555 Japan', name_en: 'Lower ball joint 555 Japan', category: 'podvozek', price: 760, desc: 'Kulový čep spodního ramene 555 Japan. Civic, CRX, Integra, CR-V.', desc_en: 'Lower arm ball joint 555 Japan. Civic, CRX, Integra, CR-V.', badge: '', stock: 20, img: '/img/products/cep-spodni.jpg',
            desc_long: 'Prémiový kulový čep spodního ramene od japonského výrobce 555 (Sankei). OEM kvalita garantující přesné rozměry a dlouhou životnost. Přímá náhrada za originální díl bez nutnosti úprav. Vhodný pro Honda Civic (EG, EK, ES, EU), CRX, Integra (DC2, DC5), CR-V a Accord.',
            desc_long_en: 'Premium lower arm ball joint from Japanese manufacturer 555 (Sankei). OEM quality guaranteeing precise dimensions and long lifespan. Direct replacement for the original part with no modifications needed. Suitable for Honda Civic (EG, EK, ES, EU), CRX, Integra (DC2, DC5), CR-V and Accord.',
            specs: [['Výrobce', '555 (Sankei), Japonsko'], ['Kvalita', 'OEM ekvivalent'], ['Kompatibilita', 'Civic EG/EK/ES, CRX, Integra, CR-V'], ['Pozice', 'Spodní rameno'], ['Balení', '1 ks'], ['Materiál', 'Kalená ocel + gumový kryt'], ['Hmotnost', '420 g']],
            specs_en: [['Manufacturer', '555 (Sankei), Japan'], ['Quality', 'OEM equivalent'], ['Compatibility', 'Civic EG/EK/ES, CRX, Integra, CR-V'], ['Position', 'Lower arm'], ['Package', '1 pc'], ['Material', 'Hardened steel + rubber boot'], ['Weight', '420 g']] },
        { id: 15, name: 'Rohová výztuha nosníků', name_en: 'Corner brace reinforcement', category: 'podvozek', price: 726, desc: 'Rohová výztuha předních nosníků C5G, C6G, CRX. Pár (levá + pravá).', desc_en: 'Front rail corner brace C5G, C6G, CRX. Pair (left + right).', badge: 'new', stock: 8, img: '/img/products/rohova-vyztuha.jpg',
            desc_long: 'Rohová výztuha předních nosníků vlastní výroby Silponix. Zpevňuje kritické místo karoserie v oblasti uchycení předních ramen, které u sportovně využívaných Honda často praská. Dodávána jako pár (levá + pravá). Vyžaduje svaření k nosníkům.',
            desc_long_en: 'Front rail corner brace manufactured by Silponix. Reinforces the critical area of the body where front arm mounts are located, which frequently cracks on spiritedly driven Hondas. Supplied as a pair (left + right). Requires welding to the rails.',
            specs: [['Materiál', 'Ocelový plech 2 mm'], ['Kompatibilita', 'Civic EG (C5G), EK (C6G), CRX'], ['Balení', 'Pár (L + R)'], ['Montáž', 'Svařování'], ['Hmotnost', '480 g/pár'], ['Výroba', 'Laserový řez Silponix']],
            specs_en: [['Material', 'Steel sheet 2 mm'], ['Compatibility', 'Civic EG (C5G), EK (C6G), CRX'], ['Package', 'Pair (L + R)'], ['Installation', 'Welding'], ['Weight', '480 g/pair'], ['Manufacturing', 'Laser cut by Silponix']] },
        { id: 16, name: 'Silentblok stabilizátoru', name_en: 'Anti-roll bar bushing', category: 'podvozek', price: 350, desc: 'PU silentblok předního stabilizátoru. Průměr 22/24/26 mm.', desc_en: 'PU front anti-roll bar bushing. Diameter 22/24/26 mm.', badge: '', stock: 40, img: '/img/products/silentblok-106h.png',
            desc_long: 'Polyuretanový silentblok předního stabilizátoru vlastní výroby Silponix. Dostupný ve třech průměrech pro různé tloušťky stabilizátorů. Eliminuje vůle a zajišťuje okamžitou odezvu stabilizátoru. Při objednávce uveďte průměr stabilizátoru.',
            desc_long_en: 'Polyurethane front anti-roll bar bushing manufactured by Silponix. Available in three diameters for various anti-roll bar thicknesses. Eliminates play and ensures immediate anti-roll bar response. Specify anti-roll bar diameter when ordering.',
            specs: [['Materiál', 'Polyuretan (PU)'], ['Tvrdost', 'Shore 80A'], ['Průměry', '22 / 24 / 26 mm'], ['Kompatibilita', 'Civic, Integra, CRX, Accord'], ['Balení', '2 ks + mazivo'], ['Barva', 'Červená'], ['Hmotnost', '60 g/pár']],
            specs_en: [['Material', 'Polyurethane (PU)'], ['Hardness', 'Shore 80A'], ['Diameters', '22 / 24 / 26 mm'], ['Compatibility', 'Civic, Integra, CRX, Accord'], ['Package', '2 pcs + grease'], ['Colour', 'Red'], ['Weight', '60 g/pair']] },
        { id: 17, name: 'Zámek kapoty NEREZ', name_en: 'Bonnet lock STAINLESS', category: 'karoserie', price: 593, desc: 'Nerezový závodní zámek kapoty. Set obsahuje 2 kusy + příslušenství.', desc_en: 'Stainless steel racing bonnet lock. Set includes 2 pcs + hardware.', badge: '', stock: 15, img: '/img/products/zamek-kapoty.png',
            desc_long: 'Závodní zámek kapoty z nerezové oceli. Spolehlivé zajištění kapoty při vysokých rychlostech na trati. Set obsahuje 2 kompletní zámky s kontra-díly, šrouby a podložky. Univerzální montáž — vhodný pro většinu vozidel.',
            desc_long_en: 'Racing bonnet lock made from stainless steel. Reliable bonnet securing at high speeds on track. Set includes 2 complete locks with counter-parts, screws and washers. Universal mounting — suitable for most vehicles.',
            specs: [['Materiál', 'Nerezová ocel'], ['Balení', '2 ks + kontra-díly + šrouby'], ['Montáž', 'Univerzální (vrtání)'], ['Použití', 'Závodní, trackday'], ['Hmotnost', '320 g/set']],
            specs_en: [['Material', 'Stainless steel'], ['Package', '2 pcs + counter-parts + screws'], ['Installation', 'Universal (drilling)'], ['Usage', 'Racing, trackday'], ['Weight', '320 g/set']] },
        { id: 18, name: 'Čep kapoty NEREZ set', name_en: 'Bonnet pin set STAINLESS', category: 'karoserie', price: 890, desc: 'Nerezové čepy kapoty se závlačkami. Závodní provedení, set 2 ks.', desc_en: 'Stainless steel bonnet pins with clips. Race-spec, set of 2.', badge: '', stock: 10, img: '/img/products/zamek-alu.jpg',
            desc_long: 'Nerezové závodní čepy kapoty se závlačkami. Klasické závodní řešení zajištění kapoty — rychlé otevření i zavření. Set obsahuje 2 čepy, 2 závlačky a montážní podložky. Leštěný povrch nerezové oceli.',
            desc_long_en: 'Stainless steel racing bonnet pins with clips. Classic racing bonnet securing solution — quick to open and close. Set includes 2 pins, 2 clips and mounting plates. Polished stainless steel finish.',
            specs: [['Materiál', 'Nerezová ocel leštěná'], ['Balení', '2 čepy + 2 závlačky + podložky'], ['Průměr čepu', '6 mm'], ['Montáž', 'Univerzální'], ['Hmotnost', '280 g/set']],
            specs_en: [['Material', 'Polished stainless steel'], ['Package', '2 pins + 2 clips + plates'], ['Pin diameter', '6 mm'], ['Installation', 'Universal'], ['Weight', '280 g/set']] },
        { id: 19, name: 'Svorka výfuku 2.5" nerez', name_en: 'Exhaust clamp 2.5" stainless', category: 'karoserie', price: 320, desc: 'Nerezová svorka výfuku 63,5 mm (2.5"). V-band provedení.', desc_en: 'Stainless steel exhaust clamp 63.5 mm (2.5"). V-band type.', badge: '', stock: 25, img: '/img/products/flexi-vyfuk.jpg',
            desc_long: 'V-band svorka výfuku z nerezové oceli pro trubku 63,5 mm (2.5"). Umožňuje rychlé a bezpečné spojení výfukových dílů bez svařování. Odolná vůči korozi a vysokým teplotám.',
            desc_long_en: 'Stainless steel V-band exhaust clamp for 63.5 mm (2.5") pipe. Allows quick and secure connection of exhaust parts without welding. Resistant to corrosion and high temperatures.',
            specs: [['Materiál', 'Nerezová ocel'], ['Průměr', '63.5 mm (2.5")'], ['Typ', 'V-band'], ['Teplotní odolnost', 'Do 800 °C'], ['Hmotnost', '180 g']],
            specs_en: [['Material', 'Stainless steel'], ['Diameter', '63.5 mm (2.5")'], ['Type', 'V-band'], ['Temperature rating', 'Up to 800°C'], ['Weight', '180 g']] },
        { id: 20, name: 'Flexi hadice výfuku 2.5"', name_en: 'Exhaust flexi pipe 2.5"', category: 'karoserie', price: 650, desc: 'Nerezová flexibilní hadice výfuku 63,5 mm. Délka 200 mm.', desc_en: 'Stainless steel flexible exhaust pipe 63.5 mm. Length 200 mm.', badge: '', stock: 12, img: '/img/products/flexi-vyfuk.jpg',
            desc_long: 'Nerezová flexibilní hadice výfuku pro tlumení vibrací motoru a kompenzaci pohybu výfukového systému. Vnitřní průměr 63,5 mm, celková délka 200 mm. Dvojitý oplet pro maximální životnost.',
            desc_long_en: 'Stainless steel flexible exhaust pipe for damping engine vibrations and compensating exhaust system movement. Inner diameter 63.5 mm, total length 200 mm. Double braid for maximum lifespan.',
            specs: [['Materiál', 'Nerezová ocel'], ['Vnitřní průměr', '63.5 mm (2.5")'], ['Délka', '200 mm'], ['Konstrukce', 'Dvojitý oplet'], ['Teplotní odolnost', 'Do 600 °C'], ['Hmotnost', '450 g']],
            specs_en: [['Material', 'Stainless steel'], ['Inner diameter', '63.5 mm (2.5")'], ['Length', '200 mm'], ['Construction', 'Double braid'], ['Temperature rating', 'Up to 600°C'], ['Weight', '450 g']] },
        { id: 21, name: 'Banner Running Bull AGM', name_en: 'Banner Running Bull AGM', category: 'baterie', price: 4590, desc: 'AGM baterie Banner Running Bull 70Ah. Start-Stop technologie.', desc_en: 'AGM battery Banner Running Bull 70Ah. Start-Stop technology.', badge: '', stock: 5, img: '/img/products/banner-baterie.jpg',
            desc_long: 'Prémiová AGM baterie Banner Running Bull s kapacitou 70Ah a startovacím proudem 760A. Technologie AGM (Absorbed Glass Mat) zajišťuje vyšší odolnost vůči vibracím, hlubšímu vybíjení a delší životnost. Ideální pro vozy se Start-Stop systémem i závodní aplikace.',
            desc_long_en: 'Premium AGM battery Banner Running Bull with 70Ah capacity and 760A cranking power. AGM (Absorbed Glass Mat) technology provides higher vibration resistance, deeper discharge tolerance and longer lifespan. Ideal for Start-Stop vehicles and racing applications.',
            specs: [['Technologie', 'AGM'], ['Kapacita', '70 Ah'], ['Startovací proud', '760 A (EN)'], ['Napětí', '12 V'], ['Rozměry', '278 × 175 × 190 mm'], ['Hmotnost', '19.5 kg'], ['Start-Stop', 'Ano'], ['Záruka', '2 roky']],
            specs_en: [['Technology', 'AGM'], ['Capacity', '70 Ah'], ['Cranking power', '760 A (EN)'], ['Voltage', '12 V'], ['Dimensions', '278 × 175 × 190 mm'], ['Weight', '19.5 kg'], ['Start-Stop', 'Yes'], ['Warranty', '2 years']] },
        { id: 22, name: 'Exide Start-Stop AGM', name_en: 'Exide Start-Stop AGM', category: 'baterie', price: 3890, desc: 'AGM baterie Exide 60Ah. Ideální pro motorsport i běžný provoz.', desc_en: 'AGM battery Exide 60Ah. Ideal for motorsport and daily driving.', badge: '', stock: 4, img: '/img/products/banner-professional.jpg',
            desc_long: 'AGM baterie Exide s kapacitou 60Ah a startovacím proudem 680A. Vhodná pro vozidla se Start-Stop systémem, vozy s vysokou spotřebou elektřiny i závodní aplikace. Odolná vůči hlubokému vybíjení a vibracím.',
            desc_long_en: 'AGM battery Exide with 60Ah capacity and 680A cranking power. Suitable for Start-Stop vehicles, cars with high electrical demand and racing applications. Resistant to deep discharge and vibrations.',
            specs: [['Technologie', 'AGM'], ['Kapacita', '60 Ah'], ['Startovací proud', '680 A (EN)'], ['Napětí', '12 V'], ['Rozměry', '242 × 175 × 190 mm'], ['Hmotnost', '17.2 kg'], ['Start-Stop', 'Ano'], ['Záruka', '2 roky']],
            specs_en: [['Technology', 'AGM'], ['Capacity', '60 Ah'], ['Cranking power', '680 A (EN)'], ['Voltage', '12 V'], ['Dimensions', '242 × 175 × 190 mm'], ['Weight', '17.2 kg'], ['Start-Stop', 'Yes'], ['Warranty', '2 years']] },
        { id: 23, name: 'Varta Silver Dynamic', name_en: 'Varta Silver Dynamic', category: 'baterie', price: 3290, desc: 'Varta Silver Dynamic 74Ah. Vysoký startovací proud pro spolehlivý start.', desc_en: 'Varta Silver Dynamic 74Ah. High cranking power for reliable starts.', badge: 'sale', stock: 7, img: '/img/products/varta.png',
            desc_long: 'Varta Silver Dynamic — prémiová baterie s kapacitou 74Ah a startovacím proudem 750A. Technologie PowerFrame zajišťuje o 70 % lepší tok energie a vyšší odolnost proti korozi. Ideální pro vozy s vyšším počtem elektrických spotřebičů.',
            desc_long_en: 'Varta Silver Dynamic — premium battery with 74Ah capacity and 750A cranking power. PowerFrame technology provides 70% better energy flow and higher corrosion resistance. Ideal for vehicles with multiple electrical consumers.',
            specs: [['Technologie', 'PowerFrame'], ['Kapacita', '74 Ah'], ['Startovací proud', '750 A (EN)'], ['Napětí', '12 V'], ['Rozměry', '278 × 175 × 175 mm'], ['Hmotnost', '18.4 kg'], ['Záruka', '2 roky']],
            specs_en: [['Technology', 'PowerFrame'], ['Capacity', '74 Ah'], ['Cranking power', '750 A (EN)'], ['Voltage', '12 V'], ['Dimensions', '278 × 175 × 175 mm'], ['Weight', '18.4 kg'], ['Warranty', '2 years']] },
        { id: 24, name: 'Banner Starting Bull', name_en: 'Banner Starting Bull', category: 'baterie', price: 2190, desc: 'Banner Starting Bull 44Ah. Lehká baterie pro závodní aplikace.', desc_en: 'Banner Starting Bull 44Ah. Lightweight battery for racing applications.', badge: '', stock: 10, img: '/img/products/banner-baterie.jpg',
            desc_long: 'Banner Starting Bull — kompaktní a lehká baterie s kapacitou 44Ah. Ideální volba pro závodní vozy, kde je důležitá nízká hmotnost. Spolehlivý start i při nízkých teplotách díky startovacímu proudu 360A.',
            desc_long_en: 'Banner Starting Bull — compact and lightweight battery with 44Ah capacity. Ideal choice for racing cars where low weight is important. Reliable starting even at low temperatures thanks to 360A cranking power.',
            specs: [['Technologie', 'Klasická (Ca/Ca)'], ['Kapacita', '44 Ah'], ['Startovací proud', '360 A (EN)'], ['Napětí', '12 V'], ['Rozměry', '210 × 175 × 175 mm'], ['Hmotnost', '11.8 kg'], ['Záruka', '2 roky']],
            specs_en: [['Technology', 'Conventional (Ca/Ca)'], ['Capacity', '44 Ah'], ['Cranking power', '360 A (EN)'], ['Voltage', '12 V'], ['Dimensions', '210 × 175 × 175 mm'], ['Weight', '11.8 kg'], ['Warranty', '2 years']] },
        { id: 25, name: 'Test produkt', name_en: 'Test product', category: 'motor', price: 0, desc: 'Testovací produkt za 0 Kč pro ověření objednávkového procesu.', desc_en: 'Test product at 0 CZK for testing the order process.', badge: 'new', stock: 99, img: '/img/products/remenice-red.png', specs: [], specs_en: [] }
    ];

    var CATEGORIES = {
        all: 'Všechny produkty',
        ecu: 'ECU & Elektronika',
        silentbloky: 'Silentbloky PU',
        motor: 'Motor & Převodovky',
        podvozek: 'Podvozek & Brzdy',
        karoserie: 'Karoserie & Výfuky',
        baterie: 'Baterie'
    };

    var CATEGORIES_EN = {
        all: 'All products',
        ecu: 'ECU & Electronics',
        silentbloky: 'PU Bushings',
        motor: 'Engine & Transmission',
        podvozek: 'Suspension & Brakes',
        karoserie: 'Body & Exhaust',
        baterie: 'Batteries'
    };

    var FREE_SHIPPING_THRESHOLD = 20000;
    var SHIPPING_COST = 149;

    /* ==================== CART STATE ==================== */
    function getCart() {
        try { return JSON.parse(localStorage.getItem('silponix-cart')) || []; }
        catch (e) { return []; }
    }

    function saveCart(cart) {
        localStorage.setItem('silponix-cart', JSON.stringify(cart));
        updateCartCount();
    }

    function addToCart(productId) {
        var cart = getCart();
        var product = PRODUCTS.find(function (p) { return p.id === productId; });
        if (!product) return;

        var existing = cart.find(function (item) { return item.id === productId; });
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ id: productId, qty: 1 });
        }
        saveCart(cart);
        showAddedNotification(product.name);
    }

    function removeFromCart(productId) {
        var cart = getCart().filter(function (item) { return item.id !== productId; });
        saveCart(cart);
    }

    function updateCartQty(productId, delta) {
        var cart = getCart();
        var item = cart.find(function (i) { return i.id === productId; });
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(function (i) { return i.id !== productId; });
        }
        saveCart(cart);
    }

    function getCartTotal() {
        var cart = getCart();
        var subtotal = 0;
        cart.forEach(function (item) {
            var product = PRODUCTS.find(function (p) { return p.id === item.id; });
            if (product) subtotal += product.price * item.qty;
        });
        return subtotal;
    }

    function updateCartCount() {
        var cartCountEls = document.querySelectorAll('#cartCount');
        var cart = getCart();
        var count = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
        cartCountEls.forEach(function (el) {
            if (count > 0) {
                el.textContent = count;
                el.hidden = false;
            } else {
                el.hidden = true;
            }
        });
    }

    function formatPrice(price) {
        return price.toLocaleString('cs-CZ') + '\u00a0Kč';
    }

    function showAddedNotification(name) {
        var notif = document.createElement('div');
        notif.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#141414;border:1px solid #262626;color:#f5f5f5;padding:1rem 1.5rem;border-radius:12px;font-size:0.9375rem;font-weight:500;z-index:500;box-shadow:0 10px 25px rgba(0,0,0,0.3);display:flex;align-items:center;gap:0.75rem;transition:all 0.3s ease;transform:translateY(20px);opacity:0;';
        notif.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' + name + ' ' + ((typeof getCurrentLang === 'function' && getCurrentLang() === 'en') ? 'added to cart' : 'přidáno do košíku');
        document.body.appendChild(notif);
        requestAnimationFrame(function () {
            notif.style.transform = 'translateY(0)';
            notif.style.opacity = '1';
        });
        setTimeout(function () {
            notif.style.transform = 'translateY(20px)';
            notif.style.opacity = '0';
            setTimeout(function () { notif.remove(); }, 300);
        }, 2500);
    }

    /* ==================== PRODUCT RENDERING ==================== */
    function createProductCard(product) {
        var lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'cs';
        var name = (lang === 'en' && product.name_en) ? product.name_en : product.name;
        var inStock = product.stock > 0;
        var stockClass = inStock ? 'in-stock' : 'out-of-stock';
        var stockLabel = inStock
            ? (window.t ? window.t('products.in_stock') || 'Skladem' : 'Skladem')
            : (window.t ? window.t('products.out_of_stock') || 'Vyprodáno' : 'Vyprodáno');

        var badge = '';
        if (product.badge === 'bestseller') badge = '<span class="product-badge product-badge--bestseller">Bestseller</span>';
        else if (product.badge === 'new') badge = '<span class="product-badge product-badge--new">' + (lang === 'en' ? 'New' : 'Nové') + '</span>';

        var quickViewLabel = lang === 'en' ? 'Quick view' : 'Rychlý náhled';

        var card = document.createElement('div');
        card.className = 'product-card lit-card';
        card.setAttribute('data-product-id', product.id);
        card.innerHTML =
            '<div class="product-card-img-wrap">' +
                '<img src="' + (product.img || '') + '" alt="' + name + '" loading="lazy" class="product-card-img">' +
                badge +
                '<div class="product-card-overlay">' +
                    '<button class="btn btn-primary btn-sm quick-view-btn" data-id="' + product.id + '" aria-label="' + quickViewLabel + ' ' + name + '">' +
                        quickViewLabel +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="product-card-body">' +
                '<p class="product-card-category">' + (product.category || '') + '</p>' +
                '<h3 class="product-name">' + name + '</h3>' +
                '<div class="product-card-footer">' +
                    '<span class="product-price">' + (product.price ? product.price.toLocaleString('cs-CZ') + '\u00a0K\u010d' : '') + '</span>' +
                    '<span class="product-stock ' + stockClass + '">' + stockLabel + '</span>' +
                '</div>' +
                '<button class="btn btn-primary btn-sm add-to-cart-btn" data-product-id="' + product.id + '" ' + (!inStock ? 'disabled' : '') + '>' +
                    (inStock ? (lang === 'en' ? 'Add to cart' : 'Koupit') : stockLabel) +
                '</button>' +
            '</div>';
        // Inject Silponix Ignition scan-line overlay (used by hover sweep effect)
        var scan = document.createElement('span');
        scan.className = 'ig-scan';
        scan.setAttribute('aria-hidden', 'true');
        card.insertBefore(scan, card.firstChild);
        return card;
    }

    /* ==================== FEATURED PRODUCTS (Homepage) ==================== */
    var featuredGrid = document.getElementById('featuredProducts');
    if (featuredGrid) {
        var featured = PRODUCTS.filter(function (p) { return p.id !== 25; }).slice(0, 8);
        featured.forEach(function (p) { featuredGrid.appendChild(createProductCard(p)); });
    }

    /* ==================== SKELETON LOADING ==================== */
    function showSkeletons(count) {
        var grid = document.getElementById('productsGrid');
        if (!grid) return;
        var html = '';
        for (var i = 0; i < (count || 8); i++) {
            html += '<div class="product-skeleton" aria-hidden="true">' +
                '<div class="product-skeleton-img skeleton"></div>' +
                '<div class="product-skeleton-body">' +
                    '<div class="product-skeleton-line skeleton short"></div>' +
                    '<div class="product-skeleton-line skeleton medium"></div>' +
                    '<div class="product-skeleton-line skeleton"></div>' +
                    '<div class="product-skeleton-btn skeleton"></div>' +
                '</div>' +
            '</div>';
        }
        grid.innerHTML = html;
    }

    /* ==================== FLY TO CART ==================== */
    function flyToCart(triggerEl) {
        var cartIcon = document.getElementById('navbarCart');
        if (!cartIcon || !triggerEl) return;
        var srcRect = triggerEl.getBoundingClientRect();
        var dstRect = cartIcon.getBoundingClientRect();
        var dot = document.createElement('div');
        dot.className = 'fly-to-cart';
        dot.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
        dot.style.left = (srcRect.left + srcRect.width / 2 - 20) + 'px';
        dot.style.top = (srcRect.top + srcRect.height / 2 - 20) + 'px';
        document.body.appendChild(dot);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                dot.classList.add('animate');
                dot.style.left = (dstRect.left + dstRect.width / 2 - 20) + 'px';
                dot.style.top = (dstRect.top + dstRect.height / 2 - 20) + 'px';
            });
        });
        setTimeout(function () {
            dot.remove();
            cartIcon.classList.add('cart-pulse');
            cartIcon.addEventListener('animationend', function () {
                cartIcon.classList.remove('cart-pulse');
            }, { once: true });
        }, 700);
    }

    /* ==================== E-SHOP PAGE ==================== */
    var productsGrid = document.getElementById('productsGrid');
    var categoryBtns = document.querySelectorAll('.category-btn');
    var searchInput = document.getElementById('searchInput');
    var sortSelect = document.getElementById('sortSelect');
    var priceFilterBtn = document.getElementById('priceFilterBtn');
    var eshopResults = document.getElementById('eshopResults');
    var eshopEmpty = document.getElementById('eshopEmpty');
    var resetFiltersBtn = document.getElementById('resetFilters');

    var currentCategory = 'all';
    var currentSearch = '';
    var currentSort = 'default';
    var priceMin = 0;
    var priceMax = Infinity;

    function filterAndRender() {
        if (!productsGrid) return;

        var filtered = PRODUCTS.filter(function (p) {
            if (currentCategory !== 'all' && p.category !== currentCategory) return false;
            if (currentSearch && p.name.toLowerCase().indexOf(currentSearch.toLowerCase()) === -1 &&
                p.desc.toLowerCase().indexOf(currentSearch.toLowerCase()) === -1) return false;
            if (p.price < priceMin || p.price > priceMax) return false;
            return true;
        });

        // Sort
        if (currentSort === 'price-asc') filtered.sort(function (a, b) { return a.price - b.price; });
        if (currentSort === 'price-desc') filtered.sort(function (a, b) { return b.price - a.price; });
        if (currentSort === 'name-asc') filtered.sort(function (a, b) { return a.name.localeCompare(b.name, 'cs'); });
        if (currentSort === 'name-desc') filtered.sort(function (a, b) { return b.name.localeCompare(a.name, 'cs'); });

        // Show skeleton shimmer briefly before rendering actual products
        showSkeletons(8);
        setTimeout(function () {
            productsGrid.innerHTML = '';
            filtered.forEach(function (p) { productsGrid.appendChild(createProductCard(p)); });

            if (eshopResults) {
                eshopResults.textContent = filtered.length + ' produkt' + (filtered.length === 1 ? '' : filtered.length < 5 ? 'y' : 'ů');
            }
            if (eshopEmpty) eshopEmpty.hidden = filtered.length > 0;
        }, 200);
    }

    // URL param category
    if (productsGrid) {
        var params = new URLSearchParams(window.location.search);
        var katParam = params.get('kat');
        if (katParam && CATEGORIES[katParam]) {
            currentCategory = katParam;
            categoryBtns.forEach(function (btn) {
                btn.classList.toggle('active', btn.getAttribute('data-category') === katParam);
            });
        }
        filterAndRender();
    }

    // Category buttons
    categoryBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            currentCategory = this.getAttribute('data-category');
            categoryBtns.forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            filterAndRender();
        });
    });

    // Search
    if (searchInput) {
        var searchTimer;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimer);
            var val = this.value;
            searchTimer = setTimeout(function () {
                currentSearch = val;
                filterAndRender();
            }, 300);
        });
    }

    // Sort
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            currentSort = this.value;
            filterAndRender();
        });
    }

    // Price filter
    if (priceFilterBtn) {
        priceFilterBtn.addEventListener('click', function () {
            var minInput = document.getElementById('priceMin');
            var maxInput = document.getElementById('priceMax');
            priceMin = minInput && minInput.value ? parseInt(minInput.value) : 0;
            priceMax = maxInput && maxInput.value ? parseInt(maxInput.value) : Infinity;
            filterAndRender();
        });
    }

    // Reset filters
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function () {
            currentCategory = 'all';
            currentSearch = '';
            currentSort = 'default';
            priceMin = 0;
            priceMax = Infinity;
            categoryBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-category') === 'all'); });
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'default';
            var minInput = document.getElementById('priceMin');
            var maxInput = document.getElementById('priceMax');
            if (minInput) minInput.value = '';
            if (maxInput) maxInput.value = '';
            filterAndRender();
        });
    }

    // Add to cart delegation
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.add-to-cart-btn');
        if (btn) {
            var productId = parseInt(btn.getAttribute('data-product-id'));
            addToCart(productId);
            flyToCart(btn);
        }
    });

    /* ==================== PRODUCT DETAIL PAGE ==================== */
    var productDetailEl = document.getElementById('productDetail');
    if (productDetailEl) {
        var params = new URLSearchParams(window.location.search);
        var pid = parseInt(params.get('id'));
        var product = PRODUCTS.find(function (p) { return p.id === pid; });
        var lang = (typeof getCurrentLang === 'function') ? getCurrentLang() : 'cs';

        if (product) {
            var pName = (lang === 'en' && product.name_en) ? product.name_en : product.name;
            var pDesc = (lang === 'en' && product.desc_en) ? product.desc_en : product.desc;
            var pDescLong = (lang === 'en' && product.desc_long_en) ? product.desc_long_en : (product.desc_long || pDesc);
            var catLabel = (lang === 'en' ? CATEGORIES_EN[product.category] : CATEGORIES[product.category]) || product.category;
            var specs = (lang === 'en' && product.specs_en) ? product.specs_en : (product.specs || []);

            // Breadcrumb
            var breadcrumbEl = document.getElementById('productBreadcrumb');
            if (breadcrumbEl) {
                breadcrumbEl.innerHTML =
                    '<a href="/">' + (lang === 'en' ? 'Home' : 'Domů') + '</a>' +
                    '<span>/</span>' +
                    '<a href="/shop.html">' + (lang === 'en' ? 'Shop' : 'E-shop') + '</a>' +
                    '<span>/</span>' +
                    '<a href="/shop.html?kat=' + product.category + '">' + catLabel + '</a>' +
                    '<span>/</span>' +
                    '<span>' + pName + '</span>';
            }

            // Page title
            document.title = pName + ' | Silponix';

            // Build specs table HTML
            var specsHTML = '';
            if (specs && specs.length > 0) {
                specsHTML = '<div class="product-specs"><h3>' + (lang === 'en' ? 'Specifications' : 'Specifikace') + '</h3><table>';
                specs.forEach(function (row) {
                    specsHTML += '<tr><th>' + row[0] + '</th><td>' + row[1] + '</td></tr>';
                });
                specsHTML += '</table></div>';
            }

            productDetailEl.innerHTML =
                '<div class="product-detail-img">' +
                    (product.img ? '<img src="' + product.img + '" alt="' + pName + '">' : '') +
                '</div>' +
                '<div class="product-detail-info">' +
                    '<span class="product-detail-category">' + catLabel + '</span>' +
                    '<h1 class="product-detail-title">' + pName + '</h1>' +
                    '<div class="product-detail-price">' + formatPrice(product.price) + '</div>' +
                    '<p class="product-detail-desc">' + pDescLong + '</p>' +
                    '<div class="product-detail-stock">' +
                        '<span class="stock-dot"></span> ' +
                        (lang === 'en' ? 'In stock' : 'Skladem') + ' (' + product.stock + ' ' + (lang === 'en' ? 'pcs' : 'ks') + ')' +
                    '</div>' +
                    '<button class="btn btn-primary btn-lg add-to-cart-btn" data-product-id="' + product.id + '">' +
                        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> ' +
                        (lang === 'en' ? 'Add to cart' : 'Přidat do košíku') +
                    '</button>' +
                    specsHTML +
                '</div>';

            // Related products
            var relatedGrid = document.getElementById('relatedProducts');
            if (relatedGrid) {
                var related = PRODUCTS.filter(function (p) { return p.category === product.category && p.id !== product.id; }).slice(0, 4);
                if (related.length === 0) related = PRODUCTS.filter(function (p) { return p.id !== product.id; }).slice(0, 4);
                related.forEach(function (p) { relatedGrid.appendChild(createProductCard(p)); });
            }
        } else {
            productDetailEl.innerHTML = '<p style="text-align:center;padding:3rem;color:var(--text-muted);">' + (lang === 'en' ? 'Product not found.' : 'Produkt nebyl nalezen.') + '</p>';
        }
    }

    /* ==================== CART PAGE ==================== */
    var cartItemsEl = document.getElementById('cartItems');
    var cartEmptyEl = document.getElementById('cartEmpty');
    var cartSummaryEl = document.getElementById('cartSummary');
    var cartSubtotalEl = document.getElementById('cartSubtotal');
    var cartShippingEl = document.getElementById('cartShipping');
    var cartTotalEl = document.getElementById('cartTotal');
    var checkoutBtn = document.getElementById('checkoutBtn');
    var checkoutSuccess = document.getElementById('checkoutSuccess');
    var checkoutForm = document.getElementById('checkoutForm');

    function renderCart() {
        if (!cartItemsEl) return;

        var cart = getCart();

        if (cart.length === 0) {
            cartItemsEl.innerHTML = '';
            if (cartEmptyEl) cartEmptyEl.hidden = false;
            if (cartSummaryEl) cartSummaryEl.hidden = true;
            return;
        }

        if (cartEmptyEl) cartEmptyEl.hidden = true;
        if (cartSummaryEl) cartSummaryEl.hidden = false;

        cartItemsEl.innerHTML = '';
        cart.forEach(function (item) {
            var product = PRODUCTS.find(function (p) { return p.id === item.id; });
            if (!product) return;

            var row = document.createElement('div');
            row.className = 'cart-item';
            row.innerHTML =
                '<div class="cart-item-img">' + (product.img ? '<img src="' + product.img + '" alt="' + product.name + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">' : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>') + '</div>' +
                '<div class="cart-item-info"><h4>' + product.name + '</h4><p>' + formatPrice(product.price) + ' / ks</p></div>' +
                '<div class="cart-item-qty">' +
                    '<button class="cart-qty-minus" data-id="' + product.id + '" aria-label="Méně">&minus;</button>' +
                    '<span>' + item.qty + '</span>' +
                    '<button class="cart-qty-plus" data-id="' + product.id + '" aria-label="Více">+</button>' +
                '</div>' +
                '<span class="cart-item-price">' + formatPrice(product.price * item.qty) + '</span>';
            cartItemsEl.appendChild(row);
        });

        // Summary
        var subtotal = getCartTotal();
        var shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        var total = subtotal + shipping;

        if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(subtotal);
        if (cartShippingEl) cartShippingEl.textContent = shipping === 0 ? ((typeof getCurrentLang === 'function' && getCurrentLang() === 'en') ? 'Free' : 'Zdarma') : formatPrice(shipping);
        if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);
    }

    // Cart qty buttons
    if (cartItemsEl) {
        cartItemsEl.addEventListener('click', function (e) {
            var minus = e.target.closest('.cart-qty-minus');
            var plus = e.target.closest('.cart-qty-plus');
            if (minus) { updateCartQty(parseInt(minus.getAttribute('data-id')), -1); renderCart(); }
            if (plus) { updateCartQty(parseInt(plus.getAttribute('data-id')), 1); renderCart(); }
        });
    }

    // Checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            var cart = getCart();
            if (cart.length === 0) return;

            // Validate required fields
            var fields = document.querySelectorAll('#checkoutForm input[required]');
            var allValid = true;
            fields.forEach(function (f) {
                if (!f.value.trim()) {
                    f.style.borderColor = '#ef4444';
                    allValid = false;
                } else {
                    f.style.borderColor = '';
                }
            });

            if (!allValid) return;

            // Demo checkout
            localStorage.removeItem('silponix-cart');
            updateCartCount();
            if (checkoutForm) checkoutForm.hidden = true;
            if (checkoutSuccess) checkoutSuccess.hidden = false;
            if (cartItemsEl) cartItemsEl.innerHTML = '';

            // Update summary to show zeros
            if (cartSubtotalEl) cartSubtotalEl.textContent = '0 Kč';
            if (cartShippingEl) cartShippingEl.textContent = '—';
            if (cartTotalEl) cartTotalEl.textContent = '0 Kč';
        });
    }

    // Initial cart render
    renderCart();
    updateCartCount();

    // Expose for admin and quick-view modal
    window.SILPONIX_PRODUCTS = PRODUCTS;
    window.SILPONIX_addToCart = addToCart;

    // Try loading products from API (override hardcoded on success)
    fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.products && data.products.length) {
            // Merge API products — keep hardcoded fallback for any missing fields
            data.products.forEach(function(apiP) {
                var existing = PRODUCTS.find(function(p) { return p.id === apiP.id; });
                if (existing) {
                    Object.keys(apiP).forEach(function(k) { if (apiP[k] !== undefined) existing[k] = apiP[k]; });
                } else {
                    PRODUCTS.push(apiP);
                }
            });
            window.SILPONIX_PRODUCTS = PRODUCTS;
            filterAndRender();
        }
    })
    .catch(function() { /* keep hardcoded products */ });

    // Re-render on language change
    window.addEventListener('langchange', function() {
        filterAndRender();
        renderCart();
    });

})();

// ==================== QUICK VIEW MODAL ====================
(function() {
    'use strict';
    var modal = document.getElementById('quickViewModal');
    if (!modal) return; // Only runs on shop.html

    var backdrop = document.getElementById('qvBackdrop');
    var closeBtn = document.getElementById('qvClose');

    function openModal(productId) {
        var product = window.SILPONIX_PRODUCTS && window.SILPONIX_PRODUCTS.find(function(p) { return p.id === productId; });
        if (!product) return;
        var lang = (window.getCurrentLang && window.getCurrentLang()) || 'cs';
        var name = (lang === 'en' && product.name_en) ? product.name_en : product.name;
        var desc = (lang === 'en' && product.desc_long_en) ? product.desc_long_en : (product.desc_long || product.desc || '');
        var specs = (lang === 'en' && product.specs_en) ? product.specs_en : (product.specs || []);

        document.getElementById('qvImage').src = product.img || '';
        document.getElementById('qvImage').alt = name;
        document.getElementById('qvCategory').textContent = product.category || '';
        document.getElementById('qvModalTitle').textContent = name;
        document.getElementById('qvDesc').textContent = desc;
        document.getElementById('qvPrice').textContent = product.price ? product.price.toLocaleString('cs-CZ') + '\u00a0K\u010d' : '';

        var specsHtml = specs.slice(0, 6).map(function(s) {
            return '<div class="quick-view-spec"><span class="quick-view-spec-label">' + s[0] + '</span><span class="quick-view-spec-value">' + s[1] + '</span></div>';
        }).join('');
        document.getElementById('qvSpecs').innerHTML = specsHtml;

        var addBtn = document.getElementById('qvAddToCart');
        addBtn.onclick = function() {
            if (typeof window.SILPONIX_addToCart === 'function') window.SILPONIX_addToCart(product.id);
            closeModal();
        };

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        setTimeout(function() { closeBtn.focus(); }, 50);
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    backdrop.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.quick-view-btn');
        if (btn) openModal(parseInt(btn.getAttribute('data-id'), 10));
    });
}());
