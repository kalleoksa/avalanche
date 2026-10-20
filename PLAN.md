# Plan: calculator math & content fixes

Status: research done, no code changed yet. Step 1 blocks step 2.

## 1. Verify against book screenshots (owner: Kalle)

- [ ] Is "frequented slope" (×2) 2nd class or 3rd class? Decides whether it still counts in wet snow (app currently drops it).
- [ ] What does the book say for level 4 (High)? Allowed with conditions, or out of scope?
- [ ] Any factor for solo travel?
- [ ] Source of "4×2×3=24" in the level-5 text (code allows max 4 × 8 × 3 = 96).
- [ ] "Avoid northern half": book says WNW–N–ESE (180°) or WNW–N–ENE (135°, current)?

## 2. Calculator fixes (confirmed bugs)

- [ ] T1: add ×1 option "Steepest section ≥40°" (source: >39° = no reduction).
- [ ] T3: add ×1 option "Large group without spacing" (+ solo, per step 1).
  - Today min divisor = 2×1×2 = 4 → Moderate (V=4) always passes.
- [ ] Level 3: fail if T1 = ×1 (Munter: first-class factor mandatory at Considerable).
- [ ] Level 5: always fail, regardless of O (today 32/96 = 0.33 shows "✓ Acceptable").
- [ ] Level 4: handle per book (step 1).
- [ ] Northern half aspects per step 1 (EN + FI).
- [ ] Move factor values out of `en`/`fi` into one shared data table.
- [ ] Extract pure `calc()` + a few Vitest cases covering the above edge cases.

## Already verified correct (no change)

- V = 2 / 4 / 8 / 16 / 32; O = V / (T1×T2×T3); acceptable if O ≤ 1.
- T1: <40° ×2, ~35° ×3, <35° (30–34°) ×4.
- T2 sector ×2/×3/×4; frequented ×2; all aspects dangerous → sector = 1 only.
- T3: large group + spacing ×2, small group ×2, small group + spacing ×3.
- Wet snow invalidates T2.

## 3. Content fixes

- [ ] Author name is Werner **Munter** (no umlaut) — README + app text.
- [ ] "Spooky Moderate": "most fatalities at this level" is wrong (Considerable has most).
- [ ] FI: 1000 vertical feet ≠ "tuhat pystymetriä" (~300 m).
- [ ] FI: "10 astetta" → 10°F ≈ 5–6°C.
- [ ] FI: new-snow flag says 24h *before* storm; EN says within 24h of.
- [ ] FI: duplicate "Aikataulu" (also duplicate React key).
- [ ] FI: missing tips (Mindset 3, Practical 1); fix "Don't sluff your exit", "Nousta"→"Nouse", "vyöryalttiiilla", leftover English.
- [ ] Pole-angle technique: EN and FI describe different methods; EN item 1 is physically unclear. Consider a diagram.
- [ ] EN T1 description repeats "Above 40°".
- [ ] T3 spacing definition: add ≥10 m on ascent.

## 4. Field usability

- [ ] Offline support (vite-plugin-pwa + manifest).
- [ ] Persist lang / flags / inputs in localStorage; add reset.
- [ ] Contrast & font size (≥14px, ≥4.5:1).
- [ ] 3×3 checkboxes: make interactive or use bullets.
- [ ] Scroll to top on tab change.
- [ ] Show red-flag count in calculator result; disclaimer in-app.

## 5. Housekeeping

- [ ] CI: `npm ci`, Node 22/24 (20 is EOL).
- [ ] Move remaining `lang === "en" ? …` strings into `T`.

## 6. Weather feature (planned)

Goal: use data to suggest red flags and inputs, not to show a general weather widget. The app stays a static site with no backend.

### Constraints

- GitHub Pages only, so calls go from the browser. Only keyless APIs with CORS work.
- MET Norway needs a User-Agent header, which browsers can't set → skip.
- FMI avalanche forecast has no API → deep link only. Scraping would need a backend.
- Field use: cache the last fetch and show its age. Depends on offline support (section 4).
- Open-Meteo free tier is non-commercial only. OK for a personal app; revisit if monetized.

### Phase 1 — Open-Meteo forecast for preset areas

- [ ] Area picker: the 6 FMI avalanche areas (Ruka, Luosto-Pyhä, Ylläs-Levi, Ounas-Pallas, Saariselkä, Kilpisjärvi), using fell-top coordinates.
- [ ] One GET per area with `models=best_match`. Fetch the past 72 h and the next 48 h:
  - snowfall
  - temperature (2 m and freezing level)
  - wind and gusts at 10 m
  - 850 hPa wind (ECMWF, via the same API)
- [ ] Map data to existing red flags as **suggestions** the user confirms. Never auto-check.
  - New snow: 24 h / 72 h snowfall above a threshold.
  - Wind: sustained wind above the snow-transport threshold.
  - Rapid warming: 24 h temperature rise, or the first hours above 0 °C after snowfall.
- [ ] Calculator: suggest "wet snow" when it's above 0 °C or raining.
- [ ] Show the data source, model time and fetch time. Label values as model estimates (1 km doesn't resolve ridge wind loading).
- [ ] Cache the response in localStorage; show it stale with its age when offline.

### Phase 2 — FMI observations

- [ ] Snow depth and its 24 h change at pinned `fmisid` stations near each area.
- [ ] Parse WFS `timevaluepair` with DOMParser in the browser, about 50 lines.

### Phase 3 — Danger level link

Checked Oct 2026: no data feed found.
- None of the 151 FMI WFS stored queries is about avalanches.
- The forecast page's map is a server-drawn image (`cdn.fmi.fi/apps/avalanche-forecast/show-map.php?lang=fi|en`) with no JSON call behind it.
- The FMI warnings GeoServer (`/geoserver/alert/ows`) allows cross-origin requests (CORS `*`) but has no avalanche layer.

- [ ] Link "Check the current level" to ilmatieteenlaitos.fi/lumivyoryennuste next to the V selector.
- [ ] Optional: embed the `show-map.php` image (an `<img>` needs no CORS). Unofficial, so it may change. Add a fallback to the link and attribution to FMI.
- [ ] Email avoin-data@ilmatieteenlaitos.fi to ask whether a feed exists or is planned.
- [ ] Not yet checked: what `cdn.fmi.fi` serves, and whether Finland publishes through the EAWS feeds (`static.avalanche.report`, EAWS regions on GitLab/GitHub). Needs these allowlisted: `cdn.fmi.fi`, `static.avalanche.report`, `gitlab.com`, `raw.githubusercontent.com`. Re-check in season (Dec–Apr).

### Verify before building

- [ ] CORS headers on api.open-meteo.com and opendata.fmi.fi from a github.io origin. Couldn't test from this environment.
- [ ] Red-flag thresholds (new snow cm, wind m/s, warming °C) from a citable source, e.g. SLF/EAWS critical new-snow amounts. Don't invent numbers.
- [ ] FMI station IDs near each of the 6 areas.

### Out of scope

- Norway and Sweden (NVE, Naturvårdsverket, SMHI): only if you tour there.
- ECMWF GRIB, HARMONIE downloads, radar overlays.
- Terrain and steepness maps.

## Sources

- Munter 1996 table: https://www.oocities.org/yosemite/trails/Trails/1996/3x3.html
- Bergundsteigen 4/01: https://info.skitourenguru.ch/download/articles/35-36%20(reduktionsmethode).pdf
- Skitourenguru: https://info.skitourenguru.ch/index.php/reduktionsmethoden
- ScienceDirect review: https://www.sciencedirect.com/science/article/pii/S0165232X19301788
- PisteHors: https://pistehors.com/news/ski/comments/avalanche-risk-reduction-methods/index.html
- Nortind: http://www.nortind.no/images/stories/Nortind/arbeidsbok/tre_x_tre.pdf
