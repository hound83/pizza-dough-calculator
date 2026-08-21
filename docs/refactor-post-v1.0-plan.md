# Voorbereiding gedrag-neutrale opsplitsing na v1.0.0

## Doel

De huidige releasecandidate blijft tijdens de onafhankelijke browseraudit één zelfvoorzienend `index.html`-bestand. Deze branch bereidt parallel een mechanische opsplitsing voor zonder functies, formules, opslag of gebruikersgedrag te veranderen.

De publieke productversie wordt na een groene audit **v1.0.0**. De historische naam v50 blijft alleen bestaan waar die technisch nodig is voor audits, tests en backwards-compatible `localStorage`-migratie.

## Waarom deze tussenstap?

Een directe handmatige opsplitsing tijdens de audit zou iedere nieuwe v50-fix op twee sterk verschillende codevormen laten landen. Dat vergroot het risico op dubbele reparaties en mergeconflicten.

Daarom geldt tot de v1.0.0-promotie:

1. de monolithische root-`index.html` is de canonieke bron;
2. `split-preview/` wordt daar deterministisch uit gegenereerd;
3. een check faalt zodra de preview achterloopt op de bron;
4. dezelfde 64 regressietests draaien tegen beide varianten;
5. de split wordt pas na de browseraudit de rootstructuur.

## Voorbereide structuur

```text
index.html                         canonieke auditbron
split-preview/
  index.html                       gegenereerde HTML
  assets/css/app.css               exact geëxtraheerde stylesheet
  assets/js/app.js                 exact geëxtraheerde JavaScript
tools/split-single-file.js         deterministische generator en driftcheck
tests/test_split_equivalence.js    lossless roundtrip- en structuurtest
tests/test_v50.js                  draait op monolithische én splitvariant
package.json                       reproduceerbare commando's zonder dependencies
```

## Commando's

Preview opnieuw genereren:

```bash
npm run prepare:split
```

Controleren dat de preview exact bij de monolithische bron hoort:

```bash
npm run check:split
```

Alle tests tegen beide varianten uitvoeren:

```bash
npm test
```

## Claude-feedback verwerken

Wanneer tijdens de v50-audit nog een bevinding komt:

1. analyseer en repareer die eerst op `v50-golden-candidate`;
2. test de ongesplitste kandidaat en commit de fix daar;
3. merge die commit in `refactor/post-v1.0-prep`;
4. voer `npm run prepare:split` uit;
5. voer `npm test` uit;
6. herhaal de gerichte browsertest op de split-preview.

Omdat de refactorbranch de canonieke `index.html` nog niet uiteen heeft getrokken, hoort een inhoudelijke auditfix normaal zonder HTML/CSS/JS-splitconflict te mergen. Alleen de gegenereerde preview wordt daarna vernieuwd.

## Na de groene v1.0.0-audit

De uiteindelijke refactor volgt in afzonderlijke, controleerbare stappen:

1. productversie zichtbaar scheiden van opslag-/migratieversie;
2. de gegenereerde HTML/CSS/JS-structuur naar de root promoveren;
3. browser- en VM-regressies opnieuw uitvoeren;
4. pas daarna JavaScript per verantwoordelijkheid opdelen, bijvoorbeeld data, pure berekeningen, state/opslag, internationalisatie en UI;
5. Basis/Uitgebreid vervolgens als nieuwe functionaliteit in **v1.1.0** bouwen.

De mechanische extractie en de latere modulaire herstructurering blijven bewust aparte commits. Daardoor is bij een regressie exact zichtbaar in welke stap die is ontstaan.
