# 🍕 Pizzadeegcalculator

[English](README.md) | [Nederlands](README.nl.md)

> `README.md` is de canonieke ontwikkelversie. Deze Nederlandse README houdt dezelfde inhoudelijke scope en structuur aan.

[![Versie](https://img.shields.io/badge/versie-v1.2.1-f0b45a)](https://github.com/hound83/pizza-dough-calculator/releases/tag/v1.2.1)
[![Tests](https://img.shields.io/badge/regressietests-89%2F89_groen-76c990)](tests/test_v50.js)
[![App](https://img.shields.io/badge/refactor-statische_HTML%2FCSS%2FJS-f0b45a)](docs/ARCHITECTURE.md)
[![Talen](https://img.shields.io/badge/interface-NL_%7C_EN-7eaadc)](#taal-privacy-en-opslag)

Een uitgebreide, Nederlandstalige én Engelstalige calculator voor pizzadeeg, fermentatie, saus, toppings en een compleet praktisch stappenplan.

De downloadbare applicatie blijft één zelfvoorzienend `index.html`-bestand. De repository bewaart de onderhoudbare HTML-, CSS- en JavaScriptbronnen onder `src/` en genereert daaruit zonder runtime-dependencies de standalone root-`index.html` voor GitHub Pages en lokaal gebruik.

**[Open de live calculator](https://hound83.github.io/pizza-dough-calculator/)** · [Bekijk de v1.2.1-release](https://github.com/hound83/pizza-dough-calculator/releases/tag/v1.2.1)

> Tag **v1.0.0** blijft de onveranderlijke golden gedragsbaseline. v1.2.1 is de huidige publieke release en behoudt opslagschema 51.

## Wat kan de calculator?

De app heeft drie huidige gebruiksmodi:

| Modus | Inhoud |
|---|---|
| **Alleen deeg** | Deegberekening, fermentatie, gistadvies, kneden en bakadvies |
| **Deeg + saus** | Alles van Alleen deeg, plus een losse sausberekening |
| **Volledige pizza’s** | Deeg, saus, recept per bol, toppings, boodschappenlijst en compleet stappenplan |

Los van die uitvoermodi biedt het beginscherm de weergavemodi **Basis** en **Uitgebreid**. Basis houdt de praktische invoer en resultaten zichtbaar, terwijl presets de technische deegwaarden beheren. Uitgebreid toont alle bestaande instellingen. Wisselen is verliesvrij; bestaande v1.0-gebruikers migreren naar Uitgebreid en nieuwe gebruikers starten in Basis.

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
- planning terugrekenen vanaf een gewenste bakdag en baktijd;
- afvinkbaar stappenplan, printweergave en kopieerbare recepten;
- optionele live temperatuurmetingen en een lokaal deeglogboek;
- volledige Nederlandse en Engelse interface.

## Zo gebruik je hem

1. Kies Basis of Uitgebreid en daarna hoeveel onderdelen je nodig hebt.
2. Selecteer een preset of vul je eigen deegwaarden in.
3. Kies diameter of bolgewicht als leidende maat.
4. Stel fermentatie, temperaturen en eventueel een gewenste baktijd in.
5. Voeg in de modus Volledige pizza’s per deegbol een pizzarecept toe.
6. Volg daarna het berekende stappenplan van mengen tot bakken.

Alle berekeningen worden direct bijgewerkt. Ingevoerde waarden en voortgang worden lokaal in de browser bewaard, zodat een refresh je recept niet wist.

## Wetenschappelijk geïnformeerd, praktisch bedoeld

De calculator combineert bakkerspercentages, tijd, temperatuur, gistsoort, deegmassa en bloemsterkte in één praktisch thuismodel. v1.2 modelleert de werkelijke thermische volgorde: hoofdwater en bloem, mengwarmte, een koude autolyse of hydratatierust op kamertemperatuur, reservewater en latere ingrediënten op kamertemperatuur, en daarna route-afhankelijke kneedwarmte. Het benodigde hoofdwater wordt opgelost binnen 1–45 °C; een doel dat daarbinnen niet haalbaar is wordt eerlijk als zodanig gemeld. De gekalibreerde kern richt zich op normale keukens van 15–30 °C; het bredere invoerbereik van 10–35 °C blijft bruikbaar met een vertrouwenswaarschuwing.

De AVPN-preset gebruikt gepubliceerde AVPN-kaders voor onder andere deeg, tijd en gistbereik. Andere onderdelen gebruiken onderbouwde relaties uit deeg- en gistliteratuur, aangevuld met expliciet gedocumenteerde praktische thuiskalibraties. De effectieve mixerconstanten zijn modeltermen voor de referentiebatch, geen universele metingen voor iedere machine.

Dit is bewust **geen gevalideerd laboratoriummodel** en ook geen officiële AVPN-calculator. Zie adviezen als een goed onderbouwd vertrekpunt en beoordeel altijd het daadwerkelijke deeg: volume, spanning, luchtigheid, temperatuur en rijpheid blijven belangrijker dan alleen de klok.

## Taal, privacy en opslag

- De interface kan direct wisselen tussen Nederlands en Engels.
- Er is geen account of server nodig.
- Receptinstellingen, voortgang en het deeglogboek worden alleen via `localStorage` in je eigen browser bewaard.
- De app verstuurt geen recept- of logboekgegevens naar een backend.
- `Reset` wist de lokaal opgeslagen calculatorstate; de taalkeuze blijft behouden.

## Lokaal draaien

De eenvoudigste manier is `index.html` downloaden en rechtstreeks in een moderne browser openen.

Je kunt de repository ook klonen:

```bash
git clone https://github.com/hound83/pizza-dough-calculator.git
cd pizza-dough-calculator
```

Open daarna `index.html`, of start bij voorkeur een eenvoudige lokale webserver:

```bash
python -m http.server 8000
```

Ga vervolgens naar `http://localhost:8000`.

## Publiceren met GitHub Pages

Omdat de complete publicatie al `index.html` heet, is geen productiebuildconfiguratie nodig:

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

Huidige uitslag:

```text
15 refactor-structure tests passed
89 bundle regression tests passed
89 source regression tests passed
41 Chromium browser/layout tests passed
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

De structuurtest controleert daarnaast de elf vaste modulegrenzen, scriptvolgorde, unieke HTML-id's, inline-handlercontracten, één eigenaar voor opslag/bootstrap, bundle-actualiteit, exacte reconstructie van de huidige featurebundle, de onveranderlijke historische releasehashes en de uitgebrachte v1.2.1-baseline. Playwright opent beide publicaties op 320, 390, 430, 760, 1024 en 1280 px en controleert foutloos laden en horizontale passing. Gerichte browsertests bewaken ook de tweetalige tekst voor hoofd- en reservewater, koud kraanwater versus ijswater, routecorrecte waarschuwingen voor heet water, beide ingeklapte en gegroepeerde sausoverride-oppervlakken en toetsenbordbediening. De telefoontests beschermen de schermvullende receptenlijst met één paneel, bewust zoekfocusgedrag, filterscrollen, navigatie van receptenlijst naar aanpassen en het klik-versus-hover-selectiecontract. Chromium bedient bovendien de praktische percentagevelden echt met ArrowUp en ArrowDown.

Gebruik bij wijzigingen aan de modulaire broncode deze commando's:

```bash
npm run bundle        # genereer root-index.html opnieuw vanuit src/
npm run check:bundle  # faal wanneer de gecommitteerde bundle achterloopt
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
| **v2.0.0** | Alleen nodig bij een werkelijk brekende wijziging |

Historische werknummers zoals v50 blijven waar nodig zichtbaar in opslagmigraties, testbestanden en auditdocumenten. Ze worden niet langer als publieke productversie doorgeteld.

## Projectstructuur

| Pad | Doel |
|---|---|
| [`index.html`](index.html) | Gegenereerde standalone publicatie voor Pages en lokaal gebruik |
| [`src/index.html`](src/index.html) | Semantische bron-HTML en de vaste laadvolgorde van de statische assets |
| [`src/assets/css/app.css`](src/assets/css/app.css) | Volledige presentatie en responsive layout |
| [`src/assets/js/`](src/assets/js/) | Elf geordende modules per verantwoordelijkheid |
| [`tools/bundle.js`](tools/bundle.js) | Dependencyvrije standalone bundler en driftcontrole |
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

De standalone root-`index.html` blijft de downloadbare en rechtstreeks gepubliceerde calculator. De modulaire `src/` geeft ontwikkelaars kleinere bestanden, expliciete verantwoordelijkheden en automatische bescherming tegen een achterlopende bundle of onbedoelde gedragswijzigingen.

## Status en roadmap

- **Release:** v1.2.1 is de huidige release; tag v1.0.0 blijft de onveranderlijke historische golden baseline.
- **Huidige architectuur:** statische bron-HTML, CSS en elf JavaScriptmodules genereren de geteste standalone publicatie voor GitHub Pages.
- **Audit:** Claude keurde v1.2.1 in de definitieve heraudit goed na de Marinara-fideliteitscorrectie en beide browserdekkingsaanvullingen; alle 15 + 89 + 89 + 41 controles slaagden onafhankelijk.
- **Kleine follow-up:** voor zeven uitgebreide veldlabels blijft een niet-blokkerende toegankelijkheidsverbetering mogelijk.
- **v1.1.0:** een duidelijke toggle tussen **Basis** en **Uitgebreid**, zonder twee verschillende rekenmodellen te creëren.
- **v1.1.1:** een persoonlijk standaardrecept van 30 cm, praktische percentagebediening, gecorrigeerde tweetalige enkelvoud/meervoud-teksten en consistente weergave van deegbolgewicht.
- **v1.2.0:** een op warmtecapaciteit gebaseerd gefaseerd DDT-model, aparte autolyse/directe routes, expliciet hoofd- versus reservewater, eerlijke haalbaarheidsmelding en normale-keukenbegeleiding.
- **v1.2.1:** herstelde NL/EN-teksten, gededupliceerde Marinara-knoflook/-oregano met behoud van de aparte 5 g afwerk-EVOO, en een schonere ingeklapte sausoverride met behoud van alle zeven saustypes.
- **v1.3.0 hierna:** anonieme feedback blijft gescheiden en vereist vóór release productieconfiguratie van Turnstile/Worker en een echte end-to-end-issuetest.

## Achtergrond

Dit begon als een eenvoudige persoonlijke deegcalculator en liep, zoals goede pizzaprojecten dat blijkbaar doen, enigszins uit de hand. 😄

Ontwikkeld door Michael, in iteratieve samenwerking met GPT/Codex en onafhankelijke crosschecks door Claude.
