# 🍕 Pizzadeegcalculator

[English](README.md) | [Nederlands](README.nl.md)

> `README.md` is de canonieke ontwikkelversie. Deze Nederlandse README houdt dezelfde inhoudelijke scope en structuur aan.

[![Versie](https://img.shields.io/badge/versie-v1.4.0-f0b45a)](docs/V1_4_0_RELEASE_REVIEW.md)
[![Tests](https://img.shields.io/badge/regressietests-106_tests-76c990)](tests/test_v50.js)
[![App](https://img.shields.io/badge/refactor-statische_HTML%2FCSS%2FJS-f0b45a)](docs/ARCHITECTURE.md)
[![Talen](https://img.shields.io/badge/interface-NL_%7C_EN-7eaadc)](#taal-privacy-en-opslag)

Een uitgebreide, Nederlandstalige én Engelstalige calculator voor pizzadeeg, fermentatie, saus, toppings en een compleet praktisch stappenplan.

De downloadbare applicatie blijft één zelfvoorzienend `index.html`-bestand. De repository bewaart de onderhoudbare HTML-, CSS- en JavaScriptbronnen onder `src/` en genereert daaruit zonder runtime-dependencies de standalone root-`index.html` voor GitHub Pages en lokaal gebruik.

**[Open de live calculator](https://hound83.github.io/pizza-dough-calculator/)** · [Lees de v1.4.0-releasenotities](docs/V1_4_0_RELEASE_REVIEW.md)

> Tag **v1.0.0** blijft de onveranderlijke golden gedragsbaseline. v1.4.0 gebruikt opslagschema 52 en migreert bestaande schema-51-gegevens automatisch.

**Nieuw in v1.4.0:** vaste batches en bakdatums, werkelijke momenten, eigen deegrecepten en vergelijkingen, weegschaal- en koelkastadvies, mixerprofielen en gerichte deeghulp. De verbeterde 1.3-planning is inbegrepen, met dynamische weekdagen. Alle acht bevindingen uit Claude’s 1.4-review zijn verwerkt; mixtijden en modelconstanten blijven behouden. [Review en releasecontroles](docs/V1_4_0_RELEASE_REVIEW.md).

**Voor Claude/reviewers:** [begin hier](CLAUDE.md#v140-release-review). De [volledige oorspronkelijke review](docs/Pizza_Calculator_Volledige_Review_2026-09-21.md) en het actuele implementatieplan staan op deze branch; losse bijlagen zijn niet nodig.

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
- bewaar een lopende batch met echte momenten, hervat hem later en pas oveninstellingen aan zonder je deegrecept te wijzigen;
- sla eigen deegrecepten op, vergelijk en wissel ze uit via JSON;
- controleer weegschaalprecisie en koelkastruimte en leg mixerwaarnemingen vast;
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

Releasecontroles (zie de Actions-uitslag bij de PR voor de uitvoerstatus):

```text
15 refactor-structure tests
19 pure-core tests
106 bundle regression tests
106 source regression tests
89 Chromium browser/layout tests
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

De structuurtest controleert daarnaast de vijftien vaste modulegrenzen, scriptvolgorde, unieke HTML-id's, inline-handlercontracten, één eigenaar voor opslag/bootstrap, bundle-actualiteit, exacte reconstructie van de huidige featurebundle, de onveranderlijke historische releasehashes de historische v1.3.0- en v1.4.0-kandidaatbaselines en de afzonderlijke v1.4.0-releasebaseline. Playwright opent beide publicaties op 320, 390, 430, 760, 1024 en 1280 px en controleert foutloos laden en horizontale passing. Gerichte browsertests bewaken ook de tweetalige tekst voor hoofd- en reservewater, koud kraanwater versus ijswater, routecorrecte waarschuwingen voor heet water, beide ingeklapte en gegroepeerde sausoverride-oppervlakken en toetsenbordbediening. De telefoontests beschermen de schermvullende receptenlijst met één paneel, bewust zoekfocusgedrag, filterscrollen, navigatie van receptenlijst naar aanpassen en het klik-versus-hover-selectiecontract. Chromium bedient bovendien de praktische percentagevelden echt met ArrowUp en ArrowDown.

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
| **v1.4.0** | Batchregistratie, receptprofielen, praktische keukenhulpen en de verbeterde 1.3-planning |
| **v2.0.0** | Alleen nodig bij een werkelijk brekende wijziging |

Historische werknummers zoals v50 blijven waar nodig zichtbaar in opslagmigraties, testbestanden en auditdocumenten. Ze worden niet langer als publieke productversie doorgeteld.

## Projectstructuur

| Pad | Doel |
|---|---|
| [`index.html`](index.html) | Gegenereerde standalone publicatie voor Pages en lokaal gebruik |
| [`src/index.html`](src/index.html) | Semantische bron-HTML en de vaste laadvolgorde van de statische assets |
| [`src/assets/css/app.css`](src/assets/css/app.css) | Volledige presentatie en responsive layout |
| [`src/assets/js/`](src/assets/js/) | Vijftien geordende modules per verantwoordelijkheid |
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

- **Release:** v1.4.0; tag v1.0.0 en alle eerdere baselines blijven behouden.
- **Architectuur:** statische HTML, CSS en vijftien JavaScriptmodules genereren de standalone publicatie voor GitHub Pages.
- **Review:** Claude’s onafhankelijke 1.4-crosscheck en de reactie op alle acht bevindingen staan in [het releaseverslag](docs/V1_4_0_RELEASE_REVIEW.md).
- **Inbegrepen:** de verbeterde 1.3-planning, dynamische weekdagen, schema-52-migratie en alle zeven workshopuitbreidingen.
- **Volgende versie:** de zes besproken gebruiks- en keukenverbeteringen worden apart voorbereid; appontwikkeling is geparkeerd.
- **Feedback:** anonieme feedback/Cloudflare blijft afzonderlijk werk; PR #12 zit niet in deze release.

## Achtergrond

Dit begon als een eenvoudige persoonlijke deegcalculator en liep, zoals goede pizzaprojecten dat blijkbaar doen, enigszins uit de hand. 😄

Ontwikkeld door Michael, in iteratieve samenwerking met GPT/Codex en onafhankelijke crosschecks door Claude.
