# Uitvoering gedrag-neutrale refactor na v1.0.0

## Doel

De uitgebrachte v1.0.0 blijft één zelfvoorzienend `index.html`-bestand. Deze branch bewaart de onderhoudbare opsplitsing onder `src/` en genereert daaruit dezelfde standalone rootpublicatie, zonder functies, formules, opslag of gebruikersgedrag te veranderen.

De publieke productversie is na een groene audit **v1.0.0** geworden. De historische naam v50 blijft alleen bestaan waar die technisch nodig is voor audits, tests en backwards-compatible `localStorage`-migratie.

## Waarom deze afzonderlijke branch?

De functionele release en de architectuurwijziging zijn bewust niet vermengd. Daardoor blijft bij iedere vergelijking duidelijk of een verschil uit productlogica of alleen uit de bestandsstructuur komt. De v1.0.0-single-filebron en zijn drie golden hashes vormen de vaste referentie voor deze branch.

## Gerealiseerde structuur

```text
src/index.html                     semantische HTML en vaste scriptvolgorde
src/assets/css/app.css             exact geëxtraheerde stylesheet
src/assets/js/                     elf scripts per verantwoordelijkheid
index.html                         gegenereerde standalone publicatie voor Pages en lokaal gebruik
tools/bundle.js                    dependencyvrije bundler en driftcontrole
tests/test_refactor_structure.js   architectuur- en golden-equivalentietest
tests/test_v50.js                  64 functionele regressietests
docs/ARCHITECTURE.md               eigenaarschap en wijzigingsregels
package.json                       reproduceerbaar npm test zonder dependencies
```

## Commando's

Standalone publicatie bouwen of controleren:

```bash
npm run bundle
npm run check:bundle
```

Alle architectuur- en functionele tests uitvoeren:

```bash
npm test
```

## Status

Variant A uit de onafhankelijke audit is gekozen: modulaire bronnen onder `src/`, een gecommitteerde standalone root-`index.html` en automatische driftcontrole. Samengevoegde CSS en JavaScript blijven byte-voor-byte gelijk aan v1.0.0; de rootbundle is exact de golden single-filebron. `split-preview/` is daardoor niet langer nodig en de oorspronkelijke één-bestand-publicatieregel blijft intact.

## Nieuwe feedback verwerken

Wanneer na v1.0.0 nog een bevinding komt:

1. analyseer en repareer die eerst op een aparte bugfixbranch vanaf `main`;
2. test de ongesplitste versie en commit de fix daar;
3. merge of cherry-pick de fix in `refactor/post-v1.0-prep` binnen de bezittende module;
4. voer `npm test` uit;
5. herhaal de gerichte browsertest op de refactorroot.

Een inhoudelijke fix op `main` moet in de refactor over de relevante modules worden verdeeld. De golden-hashtest faalt dan bewust totdat de nieuwe functionele baseline en reden zijn vastgelegd.

## Volgende architectuurstappen

1. laat Claude de refactor in een echte Chromium-browser vergelijken met `main`;
2. sluit eventuele laadvolgorde-, hosting- of onderhoudbaarheidsbevindingen op deze branch;
3. behoud productversie 1.0.0 zolang gedrag volledig equivalent blijft;
4. overweeg ES-modules en het verwijderen van inline handlers pas in een aparte, opnieuw geaudite architectuurstap;
5. bouw Basis/Uitgebreid vervolgens als nieuwe functionaliteit in **v1.1.0**.

De moduleverantwoordelijkheden en wijzigingsregels staan in `docs/ARCHITECTURE.md`; de gerichte onafhankelijke auditopdracht staat in `docs/Claude_refactor_handoff_v1.0.0.md`.
