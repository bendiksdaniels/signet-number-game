# What's Your Number? — Project Handoff

A responsive rebuild of Signet Bank's "What's Your Number?" financial-freedom
kiosk game (Investment Festival 2026). This doc is a full state snapshot so the
chat can be compacted and work resumed without losing context.

_Last updated: 2026-06-19._

## Where everything lives
- **Source:** `~/Desktop/Side project/Desig_proejects/signet_number_game`
- **Live site (open on phone):** https://bendiksdaniels.github.io/signet-number-game/
- **Repo (public):** https://github.com/bendiksdaniels/signet-number-game
  — pushing to `main` auto-builds + redeploys via GitHub Actions (`.github/workflows/deploy.yml`), live in ~1 min.
- **Desktop launcher:** `~/Desktop/Signet Number Game/` — double-click `Launch Signet Game.command` (serves the built file locally; `Update from source.command` rebuilds it).

## Stack & how to run
- React 18 + Vite + framer-motion. Builds to ONE self-contained `dist/index.html` (vite-plugin-singlefile).
- Self-hosted fonts via `@fontsource`: **Space Grotesk** (UI/display) + **Spectral** (serif). The original used unlicensed *trial* fonts (Termina/Domaine) — replaced for licensing + Baltic glyph coverage.
- `npm run dev` → localhost:5173. `npm run build` → `dist/index.html`. `git push` → live.
- Backend: thin adapter (`src/lib/backend.js`) with a **local (localStorage)** fallback and a **Supabase** mode. No keys set yet, so it runs local. To go live shared: run `backend/supabase_schema.sql` in a Supabase project, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (see `docs/DEPLOY.md`). The schema is GDPR-safe (browser only calls SECURITY DEFINER rpcs, never reads emails).

## Architecture / key files
- `src/App.jsx` — state machine (attract → amount → about → result), the **fixed-canvas sliding wizard** for input steps (landscape) and the **result** (fills viewport, slides in). `useMediaQuery` gates the landscape scaler; portrait = stacked + scroll.
- `src/components/` — `Attract`, `StepAmount` (keypad+presets), `StepAbout` (name/age/retire/country), `Result` (two-panel centerpiece), `Afford` (the "what your number buys" breakdown), `Leaderboard`, `LeadCapture`, `charts` (SalaryBars), `FitToScreen` (scale-to-fit: fixed-canvas mode for wizard, content-fit for nothing now), `ui` (AnimatedNumber, Logo, LangToggle, StepDots, slide variants).
- `src/lib/` — `calc.js` (the maths), `backend.js`, `supabase.js`, `hooks.js` (useInterval, useIdleReset, useMediaQuery), `format.js`.
- `src/i18n.js` — full ET/EN copy + `useT()`. Both languages must always work.
- `src/data/regional.json` — net salary + life expectancy + realReturn (sourced, 2024/2026). `src/data/lifestyle.json` — capitals, lifestyle tiers, utilities, investment tax (sourced).
- `src/styles/tokens.css` (design tokens, ported from the live build) + `global.css`.

## Key decisions already made (the journey)
- **Responsive:** input steps use ONE fixed canvas (1366×1000) scaled to the viewport, so scale is constant across steps (no jumping) with horizontal carousel slides. Result FILLS the width (two panels stretch; no scaling → no dark void on wide screens) and slides in.
- **Zoom locked** (`user-scalable=no`) for kiosk; result letterbox is dark (never white).
- **Honest calc:** money is planned to a fixed **age 90** (standard planning horizon), NOT average life expectancy — so retiring at 80 works and there's no morbid "die at 77". The "to age 90" label was then removed per request; a reality note remains: _"the average person in {country} only lives to {77/80/78}, so you'll most likely never spend it all."_ A "make it last / spend it down" toggle shows perpetual vs depleting income.
- **Realistic affordability:** gross monthly drawdown → **investment income tax** → **rent + utilities** → what's free is shown as **€100 dinners out a week** + **€2,000 one-week holidays a year**.
- **All figures sourced** (Numbeo, PwC/EY, national stats): salaries EE 1560 / LV 1221 / LT 1407; life exp 79.5 / 76.7 / 77.5; utilities 285 / 319 / 199; invest tax 22% / 20% / 15%.
- Numbers are whole (rounded at source). No em dashes in copy. Booking CTA is a placeholder → `https://signetbank.com` (TODO real URL in `Result.jsx`).

## IN PROGRESS — lifestyle tiers (downgrade to still afford travel)
**Goal:** offer cheaper lifestyle tiers so a smaller number can downgrade the home and still travel. Three tiers per capital, most→least expensive: **luxury district → city centre → suburbs**.

**DONE:**
- `src/lib/calc.js`: `lifestyle(gross, country, data, tier='luxury')` now reads `data[country].tiers[tier].rent`; added `bestTier(gross, country, data)` (highest tier with ≥1 holiday/yr) and `export const TIERS = ['luxury','central','suburb']`.
- `src/data/lifestyle.json`: restructured to `tiers` with sourced 1-bed rents — EE 1300/716/523, LV 1200/528/355, LT 1350/766/567 (Numbeo 2026). Luxury tier keeps its prestige `district` name (Kadriorg / Klusais centrs / Senamiestis).
- The app still BUILDS and works on the default `luxury` tier (the new fields/returns are back-compatible). Live site does NOT have these changes yet (uncommitted).

**TODO (next steps to finish + ship):**
1. `Result.jsx`: `const [tier, setTier] = useState(() => bestTier(result.monthly, result.country, lifestyleData))`; compute `const life = lifestyle(shownMonthly, result.country, lifestyleData, tier)`; pass `tier` + `setTier` to `<Afford>`.
2. `Afford.jsx`: add a 3-button tier selector (segmented, like the deplete/forever toggle) calling `setTier`; show the place as luxury→`life.district`, central/suburb→i18n label. Bar + meals + holidays already recompute from `life`.
3. `i18n.js` (et + en): add `tierLuxury` / `tierCentral` / `tierSuburb` and place labels `placeCentral` ("city centre"/"kesklinn") + `placeSuburb` ("suburbs"/"äärelinn").
4. `global.css`: style `.afford__tiers` (compact segmented buttons).
5. Build, verify (e.g. €500k LV should default to **central** with ~4 holidays/yr; luxury shows 0; toggling tiers changes rent→free→holidays), then `git add -A && git commit && git push` (auto-deploys).

## Gotchas / verification notes
- **Verify via playwright `browser_evaluate`**, driving with keyboard events for the amount (`KeyboardEvent('keydown',{key})`) and the native value setter for the name input. Synthetic `.click()` does NOT fire framer-motion buttons (presets/country) — use the real `browser_click` tool or keyboard.
- **Screenshots hang** on the page's animation loop; check layout via geometry (`getBoundingClientRect`) instead, or inject `*{animation:none!important;transition:none!important}` first.
- **StrictMode (dev only)** makes the result's mount-slide get stuck off-screen; the **production build is fine** (verified by serving `dist/` via `python3 -m http.server` and on the live URL).
- Test data "Daniel"/"D" rows accumulate in localStorage on the leaderboard — harmless demo artifact.
