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

## Sources

- Munter 1996 table: https://www.oocities.org/yosemite/trails/Trails/1996/3x3.html
- Bergundsteigen 4/01: https://info.skitourenguru.ch/download/articles/35-36%20(reduktionsmethode).pdf
- Skitourenguru: https://info.skitourenguru.ch/index.php/reduktionsmethoden
- ScienceDirect review: https://www.sciencedirect.com/science/article/pii/S0165232X19301788
- PisteHors: https://pistehors.com/news/ski/comments/avalanche-risk-reduction-methods/index.html
- Nortind: http://www.nortind.no/images/stories/Nortind/arbeidsbok/tre_x_tre.pdf
