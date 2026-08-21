# Bijdragen aan de calculator

## Voor je begint

- Lees `docs/ARCHITECTURE.md` en kies de module die eigenaar is van het gedrag.
- Houd functionele wijzigingen, architectuurwijzigingen en datawijzigingen in afzonderlijke commits.
- Verander opslagkey of schema alleen met een expliciet migratiepad en regressietest.
- Nieuwe interacties gebruiken `addEventListener`; voeg geen nieuwe inline handler toe.

## Kwaliteitsregels

- Schrijf voor een bug eerst een test die het probleem reproduceert.
- Houd berekeningen deterministisch en los van zichtbare formattering waar dat praktisch kan.
- Normaliseer invoer pas op het bestaande commitmoment; herschrijf geen actief numeriek veld tijdens typen.
- Voeg nieuwe vertaaldata toe aan `translations.js` en dynamische tweetalige tekst via de bestaande i18n-helpers.
- Plaats nieuwe catalogusdata in `catalog.js` en valideer verwijzingen met een invarianttest.
- Documenteer iedere bewuste afwijking van de v1.0.0-golden hashes.

## Verplichte controle

```bash
npm test
```

Bij wijzigingen aan layout, focus, native events, opslag of assetladen hoort aanvullend een echte browsertest. Controleer bij responsive wijzigingen minimaal 320, 390, 430, 760, 1024 en 1280 px.

## Reviewchecklist

- [ ] De wijziging staat in de bezittende module.
- [ ] Een gerichte regressietest dekt het nieuwe of gerepareerde gedrag.
- [ ] Alle architectuur- en functionele tests zijn groen.
- [ ] Opslagcompatibiliteit en AVPN-regels zijn intact of expliciet gemigreerd.
- [ ] Nederlands en Engels zijn beide gecontroleerd.
- [ ] Relevante toetsenbord- en mobiele scenario's zijn in een echte browser getest.
- [ ] README, architectuurdocument of audit-handoff is bijgewerkt wanneer de structuur veranderde.
