import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n.js'
import { formatEur, formatMultiple } from '../lib/format.js'
import { AnimatedNumber, Logo, LangToggle, rise } from './ui.jsx'
import { SalaryBars } from './charts.jsx'
import Leaderboard from './Leaderboard.jsx'
import LeadCapture from './LeadCapture.jsx'
import Afford from './Afford.jsx'
import regional from '../data/regional.json'
import lifestyleData from '../data/lifestyle.json'
import { lifestyle, bestTier } from '../lib/calc.js'

// Centerpiece: the two-panel result. LEFT (dark) is the emotional payoff: the
// big "freedom income" with an HONEST deplete/forever toggle, a salary
// comparison, and a bottom stats strip. RIGHT (light) is the social proof
// (leaderboard), lead capture, and CTAs. Backend wiring mirrors the stub.
export default function Result({ result, player, backend, onPlayAgain }) {
  const { t, lang, setLang, dict } = useT()
  const reduce = useReducedMotion()
  const [stats, setStats] = useState(null)
  const [rows, setRows] = useState([])
  const [mode, setMode] = useState('deplete') // honest default: pot runs out at life expectancy
  // Default to the fanciest home the number can comfortably carry, so a smaller
  // pot lands on a modest home it can actually live in (and still travel from)
  // instead of "barely affording" the luxury district. Users can re-pick.
  const [tier, setTier] = useState(() => bestTier(result.monthly, result.country, lifestyleData))

  // Submit the entry ONCE (the ref guards StrictMode's double-invoke), but
  // ALWAYS load the room afterwards. Gating the read behind the same guard was
  // the bug: under StrictMode the surviving mount skipped the load and the
  // leaderboard stayed empty.
  const submitted = useRef(false)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const entry = {
        name: player.name, country: result.country, age: result.age,
        retire: result.retire, target: result.target, monthly: result.monthly,
      }
      if (!submitted.current) {
        submitted.current = true
        try { await backend.submitEntry(entry) } catch { /* keep going to read */ }
      }
      try {
        const [s, r] = await Promise.all([
          backend.getStats(result.target),
          backend.getLeaderboard(6),
        ])
        if (alive) { setStats(s); setRows(r) }
      } catch { /* leave defaults */ }
    })()
    return () => { alive = false }
  }, []) // eslint-disable-line

  const cc = dict.countryNames[result.country]
  // "Spend it down" empties the pot by the average age of death, so the horizon
  // IS that age; "make it last" never touches the pot at all.
  const endAge = Math.round(result.endAge)

  // The figure currently on stage depends on the honest mode. Everything that
  // compares against salary derives from THIS number so it stays consistent.
  const shownMonthly = mode === 'deplete' ? result.monthly : result.sustainableMonthly
  const avg = regional.salary[result.country] || 0
  const shownMultiple = avg ? shownMonthly / avg : 0

  // Realistic lifestyle the income buys for the chosen home tier (gross, less
  // tax, rent, utilities); whatever is free becomes dinners out and holidays.
  const life = lifestyle(shownMonthly, result.country, lifestyleData, tier)

  const subline = mode === 'deplete' ? t('perMonthToAge', { age: endAge }) : t('perMonthForever')
  const hint = mode === 'deplete' ? t('depleteHint', { age: endAge, country: cc }) : t('foreverHint')
  // The honest counterpoint to whichever mode is showing.
  const reality = mode === 'deplete' ? t('deathNote', { country: cc, age: endAge }) : t('foreverNote')

  const salaryRows = [
    { label: t('you'), value: shownMonthly, hl: true },
    ...['EE', 'LV', 'LT'].map((c) => ({ label: dict.countryNames[c], value: regional.salary[c] })),
  ]

  const modes = [
    { key: 'deplete', label: t('modeDeplete') },
    { key: 'forever', label: t('modeForever') },
  ]

  // Stagger helper: each left block rises in sequence. The parent below owns
  // initial/animate; children just declare their order via `custom` (mirrors
  // Attract.jsx). Reduced motion is handled by the parent's `initial`.
  const block = (i) => ({ custom: i, variants: rise })

  return (
    <div className="result">
      <motion.div
        className="result__left"
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        {/* top bar: logo · identity + language */}
        <motion.div className="result__top" {...block(0)}>
          <span className="brand"><Logo /></span>
          <div className="result__id">
            <span className="kicker" style={{ fontSize: 'var(--label-md)' }}>
              {player.name} · {result.age} · {result.country}
            </span>
            <LangToggle lang={lang} setLang={setLang} />
          </div>
        </motion.div>

        {/* hero: kicker → big number → honest toggle → subline/hint → what-it-buys */}
        <div className="result__hero">
          <motion.span className="kicker" {...block(1)}>
            {t('fromAgePays', { retire: result.retire, target: formatEur(result.target) })}
          </motion.span>

          <motion.div className="display tnum result__display" {...block(2)}>
            <AnimatedNumber value={shownMonthly} kind="eur" />
          </motion.div>

          <motion.div
            className="modeseg"
            role="group"
            aria-label={t('yourFreedomIncome')}
            {...block(3)}
          >
            {modes.map((m) => {
              const on = mode === m.key
              return (
                <button key={m.key} aria-pressed={on} onClick={() => setMode(m.key)}>
                  {on && (
                    <motion.span
                      className="modeseg__pill"
                      layoutId="modeseg-pill"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span>{m.label}</span>
                </button>
              )
            })}
          </motion.div>

          <motion.div className="result__subwrap" {...block(4)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="result__subline">{subline}</span>
                <span className="muted result__hint">{hint}</span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div className="result__reality-wrap" {...block(5)}>
            <AnimatePresence mode="wait">
              <motion.p
                key={mode}
                className="serif result__reality"
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {reality}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          <motion.div className="result__buys" {...block(6)}>
            <Afford life={life} tier={tier} setTier={setTier} />
          </motion.div>
        </div>

        {/* salary comparison */}
        <motion.div className="result__bars" {...block(6)}>
          <span className="kicker">{t('salaryTitle')}</span>
          <SalaryBars dark rows={salaryRows} />
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              className="serif muted"
              style={{ fontStyle: 'italic' }}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {t('multipleNote', { x: formatMultiple(shownMultiple), country: cc })}
            </motion.p>
          </AnimatePresence>
          <span className="result__asof">
            {t('returnNote', { pct: (regional.investReturn * 100).toFixed(1) })} {t('asOf', { year: regional.as_of })}
          </span>
        </motion.div>

        {/* bottom stats strip */}
        <motion.div className="result__strip" {...block(7)}>
          <div className="result__stat">
            <b className="tnum">{result.years}</b>
            <span>{t('yearsOfFreedom')}</span>
          </div>
          <div className="result__stat">
            <b className="tnum">{formatMultiple(shownMultiple)}<sup>×</sup></b>
            <span>{t('avgMultiple', { country: cc })}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT (light): social proof, lead capture, CTAs */}
      <div className="result__right">
        <Leaderboard stats={stats} rows={rows} result={result} live={backend.mode === 'supabase'} />
        <div style={{ marginTop: 24 }}>
          <LeadCapture backend={backend} player={player} result={result} />
        </div>
        <div className="result__cta">
          {/* TODO(Signet): set the real booking URL. Placeholder points to the site. */}
          <a
            className="btn btn--primary"
            href="https://signetbank.com/en/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('bookAppt')} →
          </a>
          <button className="btn btn--dark" onClick={onPlayAgain}>{t('playAgain')} ↻</button>
        </div>
      </div>
    </div>
  )
}
