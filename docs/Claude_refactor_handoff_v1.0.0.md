# Claude-handoff — gedrag-neutrale refactor van v1.0.0

## Vergelijking

- Referentie: `main` en tag `v1.0.0`
- Referentiecommit: `c8438febbf48efad00c09b883b6930a3eb4c0f70`
- Te auditen branch: `refactor/post-v1.0-prep`
- Scope: uitsluitend bronstructuur en onderhoudbaarheid; geen nieuwe productfunctionaliteit

## Wat is veranderd?

De ene inline stylesheet is naar `assets/css/app.css` verplaatst. Het ene inline script is, in oorspronkelijke volgorde, opgesplitst in elf bestanden met één herkenbare verantwoordelijkheid. Woordenboekdata en de vertaalengine zijn daarbij ook van het algemene fundament gescheiden. `index.html` laadt deze statische bestanden rechtstreeks; er is geen bundler, transpiler, framework, package dependency of backend toegevoegd.

De vroegere gegenereerde `split-preview/` en het tijdelijke `assets/js/app.js` zijn niet langer onderdeel van de branchroot. De rootstructuur zelf is nu de refactor.

## Sterkste equivalentiebewijs

De elf JavaScriptbestanden worden zonder extra tekens samengevoegd tot exact deze v1.0.0-hash:

```text
2897bfe7eda16d93c872d49f4dc8256f99549defe1927688903009f2a98483e7
```

De CSS blijft exact:

```text
262e12b5356f5a50c63aa7cd7249b3c5c8b101d8954f076de1360efbc222b896
```

Wanneer de externe assets weer inline in de refactor-HTML worden geplaatst, ontstaat byte-voor-byte de golden v1.0.0-single-filebron:

```text
7045421500a5497ca403699a2297c2ad8fa3e53f81f053300e8abdd84630cf3f
```

Dit controleert `tests/test_refactor_structure.js` automatisch.

## Lokale testuitslag vóór push

```text
9 refactor-structure tests passed
64 regression tests passed
```

Dezelfde suites slagen ook wanneer ze vanuit `/tmp` worden gestart. Via een lokale HTTP-server zijn `index.html`, de stylesheet en alle elf scripts afzonderlijk met HTTP 200 opgehaald en byte-voor-byte met de bronbestanden vergeleken: 13/13 groen.

De structuurtests controleren ook:

- exact elf scripts en hun vaste volgorde;
- geen inline CSS of JavaScript;
- geen achtergebleven root-`app.js`;
- parseerbare samengevoegde JavaScript;
- één expliciete eigenaar voor opslag en bootstrap;
- 154 unieke statische HTML-id's;
- alle 50 inline handlers verwijzen naar bestaande functies of browserfuncties.
- de GitHub Actions-workflow voert `npm test` bij iedere push en pull request uit.

## Gevraagde onafhankelijke browsercontrole

Vergelijk de refactorbranch rechtstreeks met `main` en controleer minimaal:

1. geen 404-, MIME- of laadvolgordefouten voor de twaalf externe assets;
2. geen console- of page errors tijdens initialisatie;
3. bestaande localStorage-state uit v1.0.0 blijft laden en opslaan onder schema 50;
4. NL ↔ EN, reset, wizardnavigatie en herladen;
5. expliciete klikselectie in de pizzapicker; hover/focus verandert het commitdoel niet;
6. 24 → 20 en 4 → 8 → 4 via echte input/blur;
7. AVPN zet 405 °C; andere presets behouden de gekozen steentemperatuur;
8. deadlineplanning, live temperatuurmetingen, sausaggregatie, ingrediëntenmodal, kopiëren en print;
9. viewports 320, 390, 430, 760, 1024 en 1280 px zonder nieuwe overflow of overlap;
10. onderhoudbaarheid van modulegrenzen, namen, documentatie en testcontracten.

## Bewust niet gewijzigd

- berekeningen, recepten, catalogus, vertalingen en zichtbare tekst;
- `APP_VERSION='1.0.0'`;
- `SAVE_KEY='pizzaCalcV50'` en `SAVE_VERSION=50`;
- AVPN-productregels;
- de resterende LOW-toegankelijkheidsbevinding rond zeven lange labels;
- `main`, de tag en de gepubliceerde v1.0.0-release.

## Beoordelingsvraag

Is deze branch functioneel equivalent aan `main`, worden alle assets betrouwbaar in de browser geladen en zijn de gekozen modulegrenzen en ontwikkelcontracten voldoende duidelijk en onderhoudbaar voor vervolgwerk aan v1.1.0?
