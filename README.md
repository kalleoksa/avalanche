# Avalanche Reduction Method

A field reference app for backcountry avalanche risk assessment, based on Werner Münter's Reduction Method and the 3×3 decision-making framework.

## Features

- **3×3 matrix** — Planning / Check / Execution checklist (Münter / Vapaalasku)
- **Red flags** — Pre-departure checklist (Jeremy Jones, *The Art of Shralpinism*)
- **Calculator** — O = V / (T1 × T2 × T3) with contextual warnings
  - Spooky moderate warning (V=2)
  - Wet snow warning (T2 invalid)
  - All-aspects-dangerous option (T2 sector)
  - Red flag hints carried into calculator
- **Tips** — Beacon protocol, slope assessment, mindset (Jeremy Jones)
- **EN/FI** language toggle

## Sources

- Werner Münter, *3×3 Reduction Method* (Brooks-Range Mountaineering, 2007)
- Werner Münter / *Vapaalasku — Tieto, Taito, Turvallisuus* (Kustannus Oy Vapaalasku)
- Jeremy Jones, *The Art of Shralpinism*
- Ylläs Ski Resort avalanche bulletin format

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Disclaimer

This app is a decision-support tool, not a substitute for professional avalanche training. Always consult the local avalanche bulletin and exercise independent judgment. The publisher cannot guarantee the effectiveness of the information contained herein.
