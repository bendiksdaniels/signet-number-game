# Build contract — "What's Your Number?" (Signet rebuild)

You are polishing ONE screen of a working React app. The app already builds, runs,
and is clickable end-to-end with stub screens. Your job: replace a stub with the
real, polished, animated version, matching the original design and the established
aesthetic, WITHOUT breaking the shared contracts below.

## Aesthetic
Minimalist, premium, gold-on-dark (and cream on the result's right panel). Warm,
restrained, lots of negative space. Motion is purposeful, never decorative noise.
Match the ORIGINAL screenshots for layout, and `Attract.jsx` for the motion style.

- Original reference screenshots (Read them):
  - Intro:  /Users/danielsbendiks/sb_game_full.png
  - Step 1 (amount/keypad): /Users/danielsbendiks/sb_step1.png
  - Step 2 (about): /Users/danielsbendiks/sb_step2.png
  - Result (two-panel): /Users/danielsbendiks/sb_result.png
- Style reference (our new build, established aesthetic): src/components/Attract.jsx

## Hard rules
- React 18 + framer-motion ONLY. Do NOT add dependencies or external `<link>`/CDN
  (the app ships as one offline single-file build).
- Use design tokens from `src/styles/tokens.css` (CSS vars like `var(--accent)`,
  `var(--surface-dark-raised)`, `var(--display-xl)`, etc). Reuse the shared classes
  in `src/styles/global.css` (`.btn`, `.chip`, `.numpad`, `.range`, `.segmented`,
  `.field`, `.kicker`, `.muted`, `.serif`, `.tnum`, `.display`, `.lbrow`, `.result`).
  You MAY add new classes to global.css ONLY by appending (never edit existing ones).
- All visible text via `useT()` from `src/i18n.js` — never hardcode copy. Both ET and
  EN must work. If you need a new string, add the key to BOTH `et` and `en` in i18n.js.
- Numbers via `src/lib/format.js` (`formatEur`, `groupSpaces`, `formatMultiple`).
- Never invent financial data. Regional figures come from `src/data/regional.json`;
  the maths lives in `src/lib/calc.js`. Don't duplicate or change them.
- Responsive: must look right on a portrait phone (~390px) AND a landscape kiosk
  (~1366×1024). Use the existing responsive CSS; don't hardcode pixel widths that
  break small screens. Test mentally at both sizes.
- Accessibility: keyboard-operable, `aria-pressed`/labels on toggles, visible focus,
  decent tap targets (≥48px), and respect `prefers-reduced-motion` (framer-motion's
  `useReducedMotion()` — gate big motion on it).
- ONLY edit the file(s) assigned to you. Do not touch other components, App.jsx,
  tokens.css (except appending), calc.js, backend.js, or i18n.js (except adding keys).
- Do NOT run `npm run dev` (a server is already running) and do NOT run `npm run
  build` (other agents are editing in parallel; the orchestrator builds). Just write
  correct code following the existing patterns.

## Shared component prop contracts (do not change signatures)
```
StepAmount({ value:int, min:int, onChange:(target:int)=>void, onBack:()=>void, onNext:()=>void })
StepAbout({ draft:{name,age,retire,country}, onChange:(partial)=>void, onBack:()=>void, onSubmit:(about:{})=>void })
Result({ result, player, backend, onPlayAgain:()=>void })
  result = { target, age, retire, country, endAge, years, months, monthly,
             sustainableMonthly, avgSalary, multiple, name }
  player = { target, name, age, retire, country }
  backend = { mode:'local'|'supabase', submitEntry(entry)->stats, getLeaderboard(n)->[{name,target}],
              getStats(target)->stats, saveLead(lead)->{ok} }
  stats  = { total, percentile, rank, top }   // percentile = % you out-dream; top = 100-percentile
SalaryBars({ rows:[{label,value,hl?}], dark? })           // in charts.jsx
Leaderboard({ stats, rows:[{name,target}], result, live:boolean })
LeadCapture({ backend, player, result })
```

## i18n keys available (see src/i18n.js for the rest)
gameKicker, attractTitle1/2, attractSub, tapToBegin, step{n}, yourNumberPrompt,
yourNumberHint, presetHint, next, back, minNote{min}, aboutYou, aboutYouPrompt,
nameLabel, namePlaceholder, ageLabel, retireLabel, countryLabel, years, seeMyNumber,
fromAgePays{retire,target}, yourFreedomIncome, perMonthToAge{age}, perMonthForever,
salaryTitle, you, countryNames{EE,LV,LT}, multipleNote{x,country}, yearsOfFreedom,
toAge{age}, avgMultiple{country}, modeDeplete, modeForever, foreverHint, depleteHint{age},
whatItBuys, replacesSalary{years}, asOf{year}, roomTitle, liveTag, topPct{pct},
outDream{pct,total}, biggestDreamers, youTag, lowerAxis, higherAxis, bookAppt,
playAgain, startOver, captureTitle, captureBody, emailPlaceholder, consentText,
emailInvalid, sendBtn, captureThanks.
(`useT()` returns `{ t, lang, setLang, dict }`; `dict.countryNames[cc]` gives the full name.)
