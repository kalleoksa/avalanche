# Avalanche app

Vite + React field app for Munter's reduction method, EN/FI. Deployed to GitHub Pages (`base: /avalanche/`).

- `PLAN.md` is the source of truth for open work and research. Read it first, and update it with findings.
- Safety rules for any data feature:
  - Data only suggests inputs; the user confirms.
  - Err to the safe side: higher wind, warmer temperature, "unknown" instead of guessing.
  - No uncited thresholds or numbers.
- Calculator logic lives in `src/App.jsx`. Change factor values only with a cited source (see PLAN.md §1–2).
- Network: weather and avalanche hosts must be in the cloud environment's allowlist; changes apply to new sessions only.
- Personal use only (for now): skip permission and polish work; safety rules still apply.
- Keep it simple: no new infrastructure beyond a GitHub Actions cron (PLAN.md §6).
