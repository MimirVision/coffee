# ☕ Kaffeloggen

En PWA for kaffenerder: loggfør alle bønnene du har smakt – med bilder, karakter, smaksnoter og bryggeoppskrifter. Alt lagres lokalt på enheten (IndexedDB), og appen fungerer helt offline.

## Funksjoner

- **Bønnelogg** med bilder (flere per bønne, valgfritt forsidebilde), brenneri, opprinnelse, region, gård, varietet, prosess, høyde, brenningsgrad, brennedato, pris og vekt
- **Karakter med halve stjerner** – dra eller trykk, med haptisk respons og konfetti på 5 ★
- **Smakshjul** med 12 kategorier og ~90 smaksnoter, pluss egne
- **Smaksprofil** (syrlighet, sødme, fylde, bitterhet, ettersmak, kompleksitet) som radardiagram
- **Status**: Smakt / I lager / Ønskeliste, favoritter og «Kjøper igjen»
- **Lagerbeholdning**: gram igjen i posen trekkes automatisk fra når du logger brygg
- **Ferskhetsindikator** basert på brennedato (Hviler → Topp → Ok → Gammel)
- **Bryggelogg** per bønne (metode, dose, vann, ratio, kvern, temp, tid, karakter) – beste oppskrift fremheves
- **Bryggestasjon**: ratio-kalkulator og timer med trinnvise instruksjoner for V60, Chemex, AeroPress, French press, espresso m.m. Holder skjermen våken og vibrerer ved hvert trinn
- **Statistikk**: toppliste, smaksprofil for favorittene dine, karakterfordeling, land, prosess, brennerier, varieteter og en personlig innsikt
- **Søk, filtre og sortering**
- **Sikkerhetskopi**: eksport/import av JSON (inkl. bilder) og CSV-eksport til regneark
- Lys/mørk modus, deling, angre ved sletting

## Kjøre lokalt

Ingen byggesteg – bare statiske filer:

```bash
python3 -m http.server 8000
```

Åpne http://localhost:8000.

## Installere på telefonen

Appen må serveres over HTTPS for å kunne installeres, f.eks. via GitHub Pages (Settings → Pages → deploy fra branch). Åpne siden på mobilen og velg «Legg til på Hjem-skjerm» (iOS/Safari) eller «Installer app» (Android/Chrome).

> Dataene lever kun på enheten. Ta en sikkerhetskopi under **Mer → Eksporter backup** innimellom.
