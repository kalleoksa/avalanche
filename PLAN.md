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

## 6. Weather & avalanche reports (required feature)

Goal: use data to suggest red flags and calculator inputs (V, wet snow), not to show a general weather widget. A backend is allowed.

### Architecture: scheduled GitHub Action, no server

- A Node script runs on a GitHub Actions cron and writes `data/latest.json`. The same workflow deploys it to Pages with the app.
  - Fetches: Open-Meteo (6 areas), FMI observations (XML parsed in Node), the avalanche level (Phase 3).
  - No server, secrets, database or cost.
- The client reads one JSON file from its own origin: no CORS, no per-client API limits, and offline caching is trivial with the service worker (section 4).
- Cron: every 3 h, Dec–Apr (`0 */3 * 12,1-4 *`). Off-season: daily, or off entirely.
- Gotchas:
  - Actions cron can run 15–60 min late.
  - GitHub disables scheduled workflows after 60 days without repo activity. Re-enable before each season.
- Upgrade path, only if on-demand freshness is needed: a Cloudflare Worker with the same script.
- MET Norway is now usable (the server can set a User-Agent), but Open-Meteo is enough. Keep MET as an optional second opinion.
- Open-Meteo free tier is non-commercial only. OK for a personal app; revisit if monetized.
- Show data age in the app and label values as model estimates.

### Phase 1 — Open-Meteo forecast for preset areas

- [ ] Area picker: the 6 FMI avalanche areas (Ruka, Luosto-Pyhä, Ylläs-Levi, Ounas-Pallas, Saariselkä, Kilpisjärvi), using fell-top coordinates.
- [ ] One GET per area with `models=best_match`. Fetch the past 72 h and the next 48 h:
  - snowfall
  - temperature (2 m and freezing level)
  - wind and gusts at 10 m
  - summit wind and temperature at 925 hPa (≈700–800 m, Lapland fell-top height); 850 hPa (≈1500 m) is too high
- [ ] Map data to existing red flags as **suggestions** the user confirms. Never auto-check.
  - New snow: 24 h / 72 h snowfall above a threshold.
  - Wind: sustained wind above the snow-transport threshold.
  - Rapid warming: 24 h temperature rise, or the first hours above 0 °C after snowfall.
- [ ] Calculator: suggest "wet snow" when it's above 0 °C or raining.
- [ ] Show the data source, model time and fetch time. Label values as model estimates (1 km doesn't resolve ridge wind loading).
- [ ] Client: cache `latest.json`; when offline, show it as stale with its age.

### Reference: tunturisaa.fi (checked Oct 2026)

Shows separate summit and valley forecasts for Lapland fells. Built after the Pallas accident (New Year 2024), where valley-level forecasts showed much lighter wind than on the fell top.
- SvelteKit front end; data from its own backend `tunturisaa-server.onrender.com/trpc` (tRPC: `getOverview`, `getMountain`, refetched every 15 min). Backend not reachable from here, so CORS and the method behind it are unverified.
- Source: FMI open data, HARMONIE-AROME. Per hour: `{ ts, smartSymbol, peak: {temperature, windSpeedMs, windDirectionDeg}, base: {…}, cloudLowerLimit, cloudLowerLimitHeight }`.
- Don't use it as a source: its terms allow personal, non-commercial use only and forbid copying; it runs on a free host.
- Copy the idea instead: show summit vs valley wind/temperature and the cloud base.
  - [ ] Open-Meteo: 925 hPa wind/temperature for the summit, 10 m for the valley, `cloud_cover_low` / cloud base if available.
  - [ ] Or FMI WFS `fmi::forecast::harmonie::hybrid::point::*` / `meps::hybrid::point::*` (model levels by height) in the cron script. Compare with Open-Meteo before picking one.

### Phase 2 — FMI observations

- [ ] Snow depth and its 24 h change at pinned `fmisid` stations near each area.
- [ ] Parse WFS `timevaluepair` in the cron script (Node XML parser), about 50 lines.
- Query by `fmisid`, not `place`: `place=kilpisjarvi` returns 400 "No locations found"; `fmisid=102016` works.

### Phase 3 — Avalanche danger level

Checked Oct 2026: no data feed found.
- None of the 151 FMI WFS stored queries is about avalanches.
- The forecast page's map is a server-drawn image (`cdn.fmi.fi/apps/avalanche-forecast/show-map.php?lang=fi|en`) with no JSON call behind it.
- The FMI warnings GeoServer (`/geoserver/alert/ows`) allows cross-origin requests (CORS `*`) but has no avalanche layer.
- `cdn.fmi.fi/apps/avalanche-forecast/` serves PNG only, all with CORS `*`: `show-map.php` (1200×1200 map, 6 areas, "Updated" timestamp) and `show-graph.php?location=<area>` (220×220 chart of levels 0–5 over 6 days). No JSON variant.
- EAWS feed `static.avalanche.report/eaws_bulletins/<date>/<date>-FI.{json,ratings.json,problems.json,raw.png}`: regions FI-01…FI-06 (FI-01 = Kilpisjärvi), GET has CORS `*`. Shapes: `{"maxDangerRatings": {"FI-01": n, "FI-01:am": n, …}}` and `{"avalancheProblems": {"FI-01": [...], …}}`.
- **EAWS FI ratings are broken:** every region is 0 in all of 2024–2026 sampled, while the archived `raw.png` for 2026-03-15 shows level 1 everywhere. 2023 had real values. The mirror only ingests FMI's PNG, so there's no reliable data source.

Safety rule: a scraped level only **pre-selects** V. The official image and link are always shown next to it, the user confirms, and V is never set silently. If parsing fails, isn't confident, or the data is older than today's forecast, show "unknown" plus the link.

Options in the cron script, best first:
- [ ] **A. Scrape the page HTML.** Check in season (Dec) whether `lumivyoryennuste` contains per-area level and text in markup. If yes: parse it, and reject the result when the "Updated" date isn't today.
- [ ] **B. Sample pixel colours.** Read the danger colour at fixed per-area coordinates in `show-graph.php?location=<area>` (simpler, 6 days) or in `show-map.php`.
  - Deterministic, no OCR.
  - Breaks silently if the layout changes. Guard against that: check the expected legend colours at known pixels, and output "unknown" when they don't match.
- [ ] **C. Fallback, always present:** link to ilmatieteenlaitos.fi/lumivyoryennuste and the `show-map.php` image with FMI attribution.
- [ ] Email avoin-data@ilmatieteenlaitos.fi to ask whether a feed exists or is planned. Mention the EAWS FI ratings stuck at 0 since 2024. An official feed replaces A/B.
- [ ] Check FMI's terms for scraping and reusing the page and images. robots.txt + ilmatieteenlaitos.fi terms of use.

### Verify before building

- [x] CORS headers on api.open-meteo.com and opendata.fmi.fi from a github.io origin. Both return `Access-Control-Allow-Origin` on GET and preflight (checked 2026-10-20).
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
