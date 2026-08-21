# 🍕 Pizzadeegcalculator

[![Version](https://img.shields.io/badge/version-v1.0.0_release_candidate-ee6b49)](https://github.com/hound83/pizza-dough-calculator/tree/v50-golden-candidate)
[![Tests](https://img.shields.io/badge/regression_tests-64%2F64_passing-76c990)](tests/test_v50.js)
[![App](https://img.shields.io/badge/app-single_file_HTML-f0b45a)](index.html)
[![Languages](https://img.shields.io/badge/interface-NL_%7C_EN-7eaadc)](#taal-privacy-en-opslag)

Een uitgebreide, Nederlandstalige én Engelstalige calculator voor pizzadeeg, fermentatie, saus, toppings en een compleet praktisch stappenplan.

De calculator werkt als één zelfvoorzienend `index.html`-bestand: geen installatie, geen backend en geen buildstap. Daardoor is hij direct lokaal te openen en eenvoudig via GitHub Pages te publiceren.

**[Open de live calculator](https://hound83.github.io/pizza-dough-calculator/)** · [Bekijk de v1.0.0-releasecandidate](https://github.com/hound83/pizza-dough-calculator/tree/v50-golden-candidate)

> De openbare GitHub Pages-versie volgt de inhoud van `main`. De historische auditbranch heet nog `v50-golden-candidate`; na een groene heraudit wordt deze kandidaat als **v1.0.0** uitgebracht.

## Wat kan de calculator?

De app heeft drie huidige gebruiksmodi:

| Modus | Inhoud |
|---|---|
| **Alleen deeg** | Deegberekening, fermentatie, gistadvies, kneden en bakadvies |
| **Deeg + saus** | Alles van Alleen deeg, plus een losse sausberekening |
| **Volledige pizza’s** | Deeg, saus, recept per bol, toppings, boodschappenlijst en compleet stappenplan |

Belangrijkste mogelijkheden:

- rekenen vanuit diameter of gewenst bolgewicht;
- maximaal 24 pizza’s van 20 tot 40 cm;
- zeven deegpresets plus volledig eigen instellingen;
- vijf deegstijlen: Napolitaans, AVPN-middenprofiel, Canotto, New York en dun/krokant;
- hydratatie, zout, olie en IDY-, ADY- of verse gist;
- hybride, koude of volledige kamertemperatuurfermentatie;
- rekening houden met kamer-, koelkast- en einddeegtemperatuur;
- praktisch water- en DDT-advies voor handmatig kneden, KitchenAid, Kenwood en spiraalkneders;
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

1. Kies op het beginscherm hoeveel onderdelen je nodig hebt.
2. Selecteer een preset of vul je eigen deegwaarden in.
3. Kies diameter of bolgewicht als leidende maat.
4. Stel fermentatie, temperaturen en eventueel een gewenste baktijd in.
5. Voeg in de modus Volledige pizza’s per deegbol een pizzarecept toe.
6. Volg daarna het berekende stappenplan van mengen tot bakken.

Alle berekeningen worden direct bijgewerkt. Ingevoerde waarden en voortgang worden lokaal in de browser bewaard, zodat een refresh je recept niet wist.

## Wetenschappelijk geïnformeerd, praktisch bedoeld

De calculator combineert bakkerspercentages, tijd, temperatuur, gistsoort, deegmassa en bloemsterkte in één praktisch thuismodel. De AVPN-preset gebruikt gepubliceerde AVPN-kaders voor onder andere deeg, tijd en gistbereik. Andere onderdelen gebruiken onderbouwde relaties uit deeg- en gistliteratuur, aangevuld met expliciet herkenbare praktische thuiskalibraties.

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

Open daarna `index.html`, of start eventueel een eenvoudige lokale webserver:

```bash
python -m http.server 8000
```

Ga vervolgens naar `http://localhost:8000`.

## Publiceren met GitHub Pages

Omdat de complete app al `index.html` heet, is geen buildconfiguratie nodig:

1. open in GitHub **Settings → Pages**;
2. kies **Deploy from a branch**;
3. selecteer `main` en de map `/ (root)`;
4. sla de instelling op.

Na publicatie staat de pagina normaal op:

```text
https://<gebruikersnaam>.github.io/<repositorynaam>/
```

## Tests

De snelle regressiesuite gebruikt alleen Node.js en heeft geen extra packages nodig:

```bash
node tests/test_v50.js
```

Huidige uitslag:

```text
64 regression tests passed
```

De suite controleert onder meer:

- receptberekeningen en numerieke grenzen;
- meer dan 1.500 fermentatie-/solvercombinaties;
- invoer per toetsaanslag, lege velden en browserachtige focus/blur-semantiek;
- migratie en opslag van oudere calculatorversies;
- behoud van recepten en stapvinkjes bij wijziging van het pizza-aantal;
- alle 92 pizzarecepten in Nederlands en Engels;
- pickerselectie, zoeken, filters, customizations en commitgedrag;
- AVPN-waarschuwingen en het volledige tweetalige AVPN-infoblok;
- sausaggregatie, boodschappenhoeveelheden en kopieerbare uitvoer;
- render-smokes over talen, modi en deegstijlen.

Naast deze snelle suite wordt de golden candidate onafhankelijk in een echte Chromium-browser gecontroleerd op toetsenbordbediening, native events, herladen en mobiele viewports van 320 tot 1280 px.

## Versienummering

Vanaf de eerste golden release gebruikt het project semantic versioning:

| Voorbeeld | Betekenis |
|---|---|
| **v1.0.0** | Eerste golden functionele release |
| **v1.0.1** | Achterwaarts compatibele bugfix na v1.0.0 |
| **v1.1.0** | Nieuwe achterwaarts compatibele functionaliteit, zoals Basis/Uitgebreid |
| **v2.0.0** | Alleen nodig bij een werkelijk brekende wijziging |

Historische werknummers zoals v50 blijven waar nodig zichtbaar in opslagmigraties, testbestanden en auditdocumenten. Ze worden niet langer als publieke productversie doorgeteld.

## Projectstructuur

| Pad | Doel |
|---|---|
| [`index.html`](index.html) | Complete applicatie: HTML, CSS, JavaScript, data en recepten |
| [`tests/test_v50.js`](tests/test_v50.js) | Snelle Node/VM-regressiesuite |
| [`docs/`](docs/) | Audit-handoffs, wijzigingsonderbouwing en testinstructies |

De single-file-opzet is voor de v1.0.0-releasecandidate bewust behouden. Dat maakt downloaden, delen, lokaal openen en hosten via GitHub Pages uitzonderlijk eenvoudig. Een toekomstige gedrag-neutrale refactor mag de interne code opsplitsen, maar moet die eenvoudige publicatie-ervaring behouden.

## Status en roadmap

- **Nu:** v1.0.0-releasecandidate op de historische auditbranch `v50-golden-candidate`.
- **Volgende controle:** gerichte browser-heraudit en daarna, bij groen resultaat, v1.0.0 naar `main` en als release taggen.
- **Parallel voorbereid:** gedrag-neutrale opsplitsing van HTML, CSS en JavaScript op een aparte refactorbranch.
- **v1.1.0:** een duidelijke toggle tussen **Basis** en **Uitgebreid**, zonder twee verschillende rekenmodellen te creëren.

## Achtergrond

Dit begon als een eenvoudige persoonlijke deegcalculator en liep, zoals goede pizzaprojecten dat blijkbaar doen, enigszins uit de hand. 😄

Ontwikkeld door Michael, in iteratieve samenwerking met GPT/Codex en onafhankelijke crosschecks door Claude.
