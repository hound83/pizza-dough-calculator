# 🍕 Pizzadeegcalculator

[English](README.md) | [Nederlands](README.nl.md)

> `README.md` is de canonieke ontwikkelversie. Deze Nederlandse README houdt dezelfde inhoudelijke scope en structuur aan.

[![Versie](https://img.shields.io/badge/versie-v2.1.0-f0b45a)](docs/V2_1_0_RELEASE.md)
[![Tests](https://img.shields.io/badge/regressietests-108_tests-76c990)](tests/test_v50.js)
[![App](https://img.shields.io/badge/refactor-statische_HTML%2FCSS%2FJS-f0b45a)](docs/ARCHITECTURE.md)
[![Talen](https://img.shields.io/badge/interface-NL_%7C_EN-7eaadc)](#taal-privacy-en-opslag)

Een uitgebreide, Nederlandstalige én Engelstalige calculator voor pizzadeeg, fermentatie, saus, toppings en een compleet praktisch stappenplan.

De GitHub Pages-website is voortaan de officiële gebruiksversie. Een losse, downloadbare HTML-versie wordt niet meer aangeboden. De kleine root-`index.html` laadt de onderhoudbare CSS- en JavaScriptbestanden vanuit `src/`; er is geen framework of backend nodig.

**[Open de live calculator](https://hound83.github.io/pizza-dough-calculator/)** · [Lees de v2.1.0-releasenotities](docs/V2_1_0_RELEASE.md)

> **v2.1.0 — delen en herhalen.** Deel een deegrecept via een gecontroleerde link, vink boodschappen voor deeg/saus/toppings af, voeg zelf boodschappen met hoeveelheden toe en markeer avondsjablonen als favoriet. Schema 54 migreert schema 53 zonder opgeslagen avonden te verwijderen. Eerdere releasebaselines blijven ongewijzigd.

**Nieuw in v2:** vrij wisselen tussen Plan en Keuken, plannen rond beschikbaarheid, verdelen over aparte mixerbeurten, een bakvolgorde met echte in-/uithaaltijden, gerichte deeghulp en complete avondsjablonen plus privéback-ups. De versieweergave, dynamische weekdagen en eerdere verbeteringen blijven behouden. [Implementatie en review](docs/V2_0_0_IMPLEMENTATION_REVIEW.md).

**Voor Claude/reviewers:** [begin hier](CLAUDE.md#v200-release). De [volledige oorspronkelijke review](docs/Pizza_Calculator_Volledige_Review_2026-09-21.md) en het actuele implementatieplan staan op deze branch; losse bijlagen zijn niet nodig.

## Wat kan de calculator?

De app heeft drie huidige gebruiksmodi:

| Modus | Inhoud |
|---|---|
| **Alleen deeg** | Deegberekening, fermentatie, gistadvies, kneden en bakadvies |
| **Deeg + saus** | Alles van Alleen deeg, plus een losse sausberekening |
| **Volledige pizza’s** | Deeg, saus, recept per bol, toppings, boodschappenlijst en compleet stappenplan |

Los van die uitvoermodi biedt Plan de weergavemodi **Basis** en **Uitgebreid**. Basis houdt de praktische invoer en resultaten zichtbaar, terwijl presets de technische deegwaarden beheren. Uitgebreid toont alle bestaande instellingen. In Basis staan temperatuurmetingen optioneel ingeklapt; Uitgebreid toont ze direct. Zonder meting kun je verder en wisselen bewaart bestaande metingen. Wisselen is verliesvrij; bestaande v1.0-gebruikers migreren naar Uitgebreid en nieuwe gebruikers starten in Basis.

Belangrijkste mogelijkheden:

- rekenen vanuit diameter of gewenst bolgewicht;
- maximaal 24 pizza’s van 20 tot 40 cm;
- zeven deegpresets plus volledig eigen instellingen;
- vijf deegstijlen: Napolitaans, AVPN-middenprofiel, Canotto, New York en dun/krokant;
- hydratatie, zout, olie en IDY-, ADY- of verse gist;
- hybride, koude of volledige kamertemperatuurfermentatie;
- rekening houden met kamer-, koelkast- en einddeegtemperatuur;
- gefaseerd, op warmtecapaciteit gebaseerd hoofdwateradvies voor handmatig kneden, KitchenAid, Kenwood en spiraalkneders, met koude autolyse en directe hydratatierust als aparte routes;
- bloemkeuze met bekende of handmatig ingevoerde W-waarde;
- 92 pizzarecepten, zeven sausvarianten en zoeken/filteren op naam of ingrediënt;
- per deegbol een eigen recept, sausvariant, pizzastijl en toppingaanpassing;
- toppings automatisch schalen op basis van het pizza-oppervlak;
- gecombineerde sausberekening, ingrediëntenoverzicht en boodschappenhoeveelheden;
- afvinkbare boodschappen voor deeg, saus en toppings, handmatige producten met hoeveelheden en signalering bij gewijzigde hoeveelheden;
- links om alleen het deegrecept te delen en favoriete avondsjablonen om snel te herhalen;
- planning terugrekenen vanaf een gewenste bakdag en baktijd;
- afvinkbaar stappenplan, printweergave en kopieerbare recepten;
- optionele live temperatuurmetingen en een lokaal deeglogboek;
- bewaar een lopende batch met echte momenten, hervat hem later en pas oveninstellingen aan zonder je deegrecept te wijzigen;
- sla eigen deegrecepten op, vergelijk en wissel ze uit via JSON;
- controleer weegschaalprecisie en koelkastruimte en leg mixerwaarnemingen vast;
- volledige Nederlandse en Engelse interface.

## Zo gebruik je hem

1. Begin in Plan en kies wat je wilt maken. Basis/Uitgebreid blijft beschikbaar via de weergavekeuze.
2. Selecteer een preset of vul je eigen deegwaarden in.
3. Kies diameter of bolgewicht als leidende maat.
4. Stel fermentatie, temperaturen en eventueel een gewenste baktijd in.
5. Voeg in de modus Volledige pizza’s per deegbol een pizzarecept toe.
6. Open Keuken voor instructies of kies Start deeg om echte momenten, mixerbeurten en de bakvolgorde bij te houden.

Alle berekeningen worden direct bijgewerkt. Ingevoerde waarden en voortgang worden lokaal in de browser bewaard, zodat een refresh je recept niet wist.

## Wetenschappelijk geïnformeerd, praktisch bedoeld

De calculator combineert bakkerspercentages, tijd, temperatuur, gistsoort, deegmassa en bloemsterkte in één praktisch thuismodel. v1.2 modelleert de werkelijke thermische volgorde: hoofdwater en bloem, mengwarmte, een koude autolyse of hydratatierust op kamertemperatuur, reservewater en latere ingrediënten op kamertemperatuur, en daarna route-afhankelijke kneedwarmte. Het benodigde hoofdwater wordt opgelost binnen 1–45 °C; een doel dat daarbinnen niet haalbaar is wordt eerlijk als zodanig gemeld. De gekalibreerde kern richt zich op normale keukens van 15–30 °C; het bredere invoerbereik van 10–35 °C blijft bruikbaar met een vertrouwenswaarschuwing.

De AVPN-preset gebruikt gepubliceerde AVPN-kaders voor onder andere deeg, tijd en gistbereik. Andere onderdelen gebruiken onderbouwde relaties uit deeg- en gistliteratuur, aangevuld met expliciet gedocumenteerde praktische thuiskalibraties. De effectieve mixerconstanten zijn modeltermen voor de referentiebatch, geen universele metingen voor iedere machine.

Dit is bewust **geen gevalideerd laboratoriummodel** en ook geen officiële AVPN-calculator. Zie adviezen als een goed onderbouwd vertrekpunt en beoordeel altijd het daadwerkelijke deeg: volume, spanning, luchtigheid, temperatuur en rijpheid blijven belangrijker dan alleen de klok.

## Taal, privacy en opslag

- De interface kan direct wisselen tussen Nederlands en Engels.
- Er is geen account of backend nodig; gebruik de website.
- Recepten, avonden, voortgang en het deeglogboek blijven in je browser. Eén tabblad kan tegelijk opslaan; sluit dat tabblad en herlaad een ander om verder te gaan. Als vergrendeling of opslag ontbreekt, meldt de app dat opslaan niet lukt.
- Deelbare avondsjablonen bevatten geen privénamen of echte geschiedenis. Privéback-ups bevatten die wel en vragen bevestiging voor het vervangen van lokale gegevens; het zijn momentopnamen, geen synchronisatie.
- Deegreceptlinks plaatsen de instellingen in het URL-fragment, zonder toppings, namen, datums of bakgeschiedenis; de ontvanger ziet eerst een voorbeeld en moet laden bevestigen.
- Boodschappenvinkjes en eigen boodschappen horen bij het huidige plan of de actieve avond. Bij het herhalen van een favoriet beginnen de vinkjes opnieuw leeg.
- De app verstuurt geen recept- of logboekgegevens naar een backend.
- `Reset` wist de lokaal opgeslagen calculatorstate; de taalkeuze blijft behouden.

## Lokaal ontwikkelen

Voor normaal gebruik open je de [website](https://hound83.github.io/pizza-dough-calculator/). Alleen `index.html` downloaden is niet genoeg, omdat de site afzonderlijke bestanden laadt.

Ontwikkelaars kunnen de volledige repository klonen:

```bash
git clone https://github.com/hound83/pizza-dough-calculator.git
cd pizza-dough-calculator
```

Start vanuit de hoofdmap een eenvoudige lokale webserver:

```bash
python -m http.server 8000
```

Ga vervolgens naar `http://localhost:8000`.

## Publiceren met GitHub Pages

De gegenereerde root-`index.html` verwijst naar `src/assets/` op dezelfde site. GitHub Pages kan deze statische bestanden zonder aparte productiebouwservice publiceren:

1. open in GitHub **Settings → Pages**;
2. kies **Deploy from a branch**;
3. selecteer `main` en de map `/ (root)`;
4. sla de instelling op.

Na publicatie staat de pagina normaal op:

```text
https://<gebruikersnaam>.github.io/<repositorynaam>/
```

## Ontwikkelen en testen

De gepubliceerde applicatie heeft geen runtime-dependencies. Voor ontwikkeling is Node.js 20 of nieuwer nodig; Playwright is de enige ontwikkeldependency en verzorgt de echte Chromium-controles.

Installeer de reproduceerbare ontwikkelomgeving eenmalig:

```bash
npm ci
npx playwright install chromium
```

Voer daarna de complete suite uit:

```bash
npm test
```

Releasecontroles (zie de Actions-uitslag bij de PR voor de uitvoerstatus):

```text
15 refactor-structure tests
31 pure-core tests
108 website-entry regression tests
108 source regression tests
149 Chromium browser/layout tests (inclusief tien nieuwe v2.1-controles)
```

De suite controleert onder meer:

- receptberekeningen en numerieke grenzen;
- meer dan 1.500 fermentatieplanningscombinaties en een aparte normale-keukenmatrix met 1.920 DDT-gevallen;
- invoer per toetsaanslag, lege velden en browserachtige focus/blur-semantiek;
- migratie en opslag van oudere calculatorversies;
- behoud van recepten en stapvinkjes bij wijziging van het pizza-aantal;
- alle 92 pizzarecepten in Nederlands en Engels;
- pickerselectie, zoeken, filters, customizations en expliciet commitgedrag;
- AVPN-waarschuwingen en het volledige tweetalige AVPN-infoblok;
- sausaggregatie, boodschappenhoeveelheden en kopieerbare uitvoer;
- render-smokes over talen, modi en deegstijlen.

De structuurtest controleert de achttien vaste modulegrenzen, scriptvolgorde, unieke HTML-id's, inline-handlercontracten, één eigenaar voor opslag/bootstrap, actualiteit van de website-entry, verwijzingen naar assets, historische release- en kandidaat-hashes en reconstructie van de huidige modules in het geheugen. Playwright opent website- en bron-entry op 320, 390, 430, 760, 1024 en 1280 px en controleert laadfouten en horizontale passing. Gerichte browsertests beschermen de tweetalige adviezen, mobiele receptenlijst, toetsenbordbediening, deegreceptlinks, boodschappen, herhalen van favorieten en de migratie van schema 53. De oude v2.0.1-single-file-hash blijft vastgelegd als historische releasebaseline; nieuwe v2.1-code hoort daarmee niet identiek te zijn.

Gebruik bij wijzigingen aan de modulaire broncode deze commando's:

```bash
npm run bundle        # genereer website-index.html opnieuw vanuit src/
npm run check:bundle  # faal wanneer de gecommitteerde website-entry achterloopt
```

## Versienummering

Vanaf de eerste golden release gebruikt het project semantic versioning:

| Voorbeeld | Betekenis |
|---|---|
| **v1.0.0** | Eerste golden functionele release |
| **v1.0.1** | Achterwaarts compatibele bugfix na v1.0.0 |
| **v1.1.0** | Nieuwe achterwaarts compatibele functionaliteit, zoals Basis/Uitgebreid |
| **v1.1.1** | Achterwaarts compatibele gebruikscorrectie na v1.1.0 |
| **v1.2.0** | Gefaseerde, route-afhankelijke berekening van hoofdwater en einddeegtemperatuur |
| **v1.2.1** | Achterwaarts compatibele opschoning van vertalingen, receptdata en sauskeuze |
| **v1.4.0** | Batchregistratie, receptprofielen, praktische keukenhulpen en de verbeterde 1.3-planning |
| **v2.0.0** | Geïntegreerde Plan/Keuken-workflow, aparte mixerbeurten, bakvolgorde en schema-53-migratie |
| **v2.1.0** | Alleen deegrecept delen, afvinkbare boodschappen met handmatige hoeveelheden en favoriete avonden |

Historische werknummers zoals v50 blijven waar nodig zichtbaar in opslagmigraties, testbestanden en auditdocumenten. Ze worden niet langer als publieke productversie doorgeteld.

## Projectstructuur

| Pad | Doel |
|---|---|
| [`index.html`](index.html) | Gegenereerde website-entry voor GitHub Pages met losse assets |
| [`src/index.html`](src/index.html) | Semantische bron-HTML en de vaste laadvolgorde van de statische assets |
| [`src/assets/css/app.css`](src/assets/css/app.css) | Volledige presentatie en responsive layout |
| [`src/assets/js/`](src/assets/js/) | Achttien geordende modules per verantwoordelijkheid |
| [`tools/bundle.js`](tools/bundle.js) | Dependencyvrije websitegenerator, driftcontrole en reconstructie van historische hashes |
| [`tests/test_v50.js`](tests/test_v50.js) | Snelle Node/VM-regressiesuite |
| [`tests/test_refactor_structure.js`](tests/test_refactor_structure.js) | Architectuur-, integriteits- en golden-equivalentietests |
| [`tests/browser/refactor.spec.js`](tests/browser/refactor.spec.js) | Chromiumtests voor laden, responsive layout en pickerinteractie |
| [`playwright.config.js`](playwright.config.js) | Reproduceerbare browsertestconfiguratie voor lokaal gebruik en CI |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Modulegrenzen, afhankelijkheden en wijzigingsregels |
| [`docs/PRODUCT_GUARDRAILS.md`](docs/PRODUCT_GUARDRAILS.md) | Harde productafspraken die niet stilzwijgend mogen wijzigen |
| [`docs/V1.2.0_CALCULATION_MODEL.md`](docs/V1.2.0_CALCULATION_MODEL.md) | Goedgekeurde v1.2-rekengrenzen, constanten, uitkomsten en tests |
| [`docs/Claude_v1.2.1_patch_handoff.md`](docs/Claude_v1.2.1_patch_handoff.md) | Onafhankelijk auditverslag en bewijs voor de v1.2.1-release |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Kwaliteitsregels en reviewchecklist voor vervolgwerk |
| [`README.md`](README.md) | Canonieke Engelse projectdocumentatie |
| [`docs/`](docs/) | Audit-handoffs, wijzigingsonderbouwing en testinstructies |

De root-`index.html` bedient de website, maar is geen losse offline-editie meer. De modulaire `src/` blijft de bron van waarheid, met automatische controles tegen achterlopende publicatiebestanden en onbedoelde gedragswijzigingen.

## Status en roadmap

- **Huidige versie:** [v2.1.0 plannen, delen en boodschappen](docs/V2_1_0_RELEASE.md); tag v1.0.0 en alle eerdere baselines blijven behouden.
- **Architectuur:** GitHub Pages levert een statische website-entry en achttien onderhoudbare JavaScriptmodules; geen losse HTML-download meer.
- **Review:** beide onafhankelijke v2-crosschecks, verwerkte bevindingen en testresultaten staan gelinkt in [de releasenotities](docs/V2_0_0_RELEASE.md).
- **Inbegrepen:** eerdere pizza-avondfunctionaliteit plus deegreceptlinks, afvinkbare boodschappen in Plan en Keuken, handmatige producten en favorieten. Schema 54 behoudt de bestaande berekeningsafspraken.
- **Geparkeerd:** appontwikkeling en de drie voorgestelde onderzoeken naar het fysieke model.
- **Feedback:** anonieme feedback/Cloudflare blijft afzonderlijk werk; PR #12 zit niet in deze release.

## Achtergrond

Dit begon als een eenvoudige persoonlijke deegcalculator en liep, zoals goede pizzaprojecten dat blijkbaar doen, enigszins uit de hand. 😄

Ontwikkeld door Michael, in iteratieve samenwerking met GPT/Codex en onafhankelijke crosschecks door Claude.
