# What's Your Number?

A responsive financial-freedom kiosk game for **Signet Bank's Investment Festival 2026** (a rebuild of the earlier fixed-stage kiosk). A visitor enters their freedom target, age, retirement age and country; the app shows the monthly "freedom income" that money buys, compares it to the regional average salary, drops them onto a live leaderboard, and offers a GDPR-safe way to book a chat with a banker. Built with React 18 + Vite + framer-motion and bundled into a single self-contained `index.html`.

## Quick start

```bash
npm install
npm run dev      # local dev server (Vite) with hot reload
npm run build    # production build -> dist/index.html (everything inlined)
npm run preview  # serve the built file to sanity-check it
```

`npm run build` produces **one file**, `dist/index.html`, with all JS, CSS, fonts and the logo inlined (via `vite-plugin-singlefile`, see `vite.config.js`). That single file is the whole deployable. See `docs/DEPLOY.md` to go live.

## Backend: local demo vs. Supabase (automatic switch)

There is one backend interface with two implementations, picked at runtime in `src/lib/backend.js`:

- **No keys set -> local backend.** Uses `localStorage`, runs fully offline, and seeds a believable leaderboard so the first player is not alone. Perfect for development and demos. Leads are accepted but not stored anywhere.
- **Keys set -> Supabase backend.** A real shared leaderboard across every device plus lead capture. The browser talks **only** through `SECURITY DEFINER` RPCs, so it can write a lead but can never read an email back out.

The switch is driven entirely by `src/lib/supabase.js`: it reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. If either is blank, `getSupabase()` returns `null` and the app falls back to local automatically. Copy `.env.example` to `.env` and fill the two values to go live; leave them blank to run the demo.

## Regional figures (refresh annually)

Average salaries and life expectancy for EE / LV / LT live in `src/data/regional.json`, tagged `"as_of": "2024"`. Each figure carries its own source, URL and confidence note inside the `sources` block of that file (Statistics Estonia, CSP Latvia, Sodra, Eurostat). **These are 2024-vintage and should be refreshed every year** before the festival; Baltic wages moved roughly 9-11% in 2024 alone, so stale numbers drift fast. Update the values and the `as_of` field together. The assumed conservative real (after-inflation) return is also there as `realReturn` (3%).

## The honest "to age X / make it last" calc

The maths lives in `src/lib/calc.js`. The earlier kiosk implied the headline income lasted "for life", which is not true. This version is honest:

- **To age X (deplete).** The default headline. The pot is drawn down from the retirement age and, still earning the real return, reaches zero at life expectancy. The UI always surfaces that real end age (`perMonthToAge`).
- **Make it last (forever).** A toggle that shows `sustainableMonthly` instead, a real perpetuity that draws only the return and never touches principal, so it lasts indefinitely.

Both figures derive from the same target, so the salary comparison stays consistent with whichever mode is on stage.

## Fonts

Fonts are **self-hosted** via `@fontsource` and imported in `src/main.jsx`: **Space Grotesk** (UI / display) and **Spectral** (serif body). They are Baltic-complete, licensed substitutes that replace the unlicensed trial fonts in the original (**Space Grotesk in place of Termina, Spectral in place of Domaine Text**). They are referenced as CSS variables in `src/styles/tokens.css`. If Signet holds licenses for Termina and Domaine, swap the `@fontsource` imports for the licensed faces and point `--font-display` / `--font-body` at them; nothing else needs to change.

## What still needs Signet

- [ ] **Set the Supabase keys** in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) so the leaderboard and lead capture go live. Until then it runs the local demo backend.
- [ ] **Set the real booking URL** in `src/components/Result.jsx` (the "book appointment" CTA, currently a placeholder pointing at `https://signetbank.com`, marked with a `TODO(Signet)`).
- [ ] **Confirm the regional figures** in `src/data/regional.json` are current for the festival year (salaries, life expectancy, `as_of`).
- [ ] (Optional) **Swap the fonts back** to licensed Termina / Domaine if Signet has the licenses.
