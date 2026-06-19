import { useMemo, useState, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LangContext, useT } from './i18n.js'
import { createBackend } from './lib/backend.js'
import { computeResults } from './lib/calc.js'
import regional from './data/regional.json'
import { useIdleReset, useMediaQuery } from './lib/hooks.js'
import { Logo, LangToggle } from './components/ui.jsx'
import FitToScreen from './components/FitToScreen.jsx'
import Attract from './components/Attract.jsx'
import StepAmount from './components/StepAmount.jsx'
import StepAbout from './components/StepAbout.jsx'
import Result from './components/Result.jsx'

export const MIN_TARGET = 50000
const DEFAULTS = { target: 0, name: '', age: 32, retire: 60, country: 'EE' }

// Fixed input canvas. The whole stage scales to the viewport as ONE unit, so the
// scale is identical on every step (nothing resizes when you move between them).
// Sized to fit the tallest step (the keypad) plus header and footer.
const STAGE_W = 1366
const STAGE_H = 1000

// Horizontal carousel slide between steps. dir 1 = forward (new enters from the
// right), dir -1 = back (new enters from the left). Concurrent (not mode=wait),
// so old and new cross at once instead of blanking between them.
const SLIDE = {
  enter: (d) => ({ x: d >= 0 ? '100%' : '-100%' }),
  center: { x: '0%', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: (d) => ({ x: d >= 0 ? '-100%' : '100%', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
}

export default function App() {
  const [lang, setLang] = useState('et')
  const [phase, setPhase] = useState('attract') // attract | amount | about | result
  const [dir, setDir] = useState(1)
  const [draft, setDraft] = useState(DEFAULTS)
  const [result, setResult] = useState(null)
  const backend = useMemo(() => createBackend(), [])

  const go = useCallback((next, d = 1) => {
    setDir(d)
    setPhase(next)
  }, [])

  const reset = useCallback(() => {
    setDir(-1)
    setPhase('attract')
    setDraft(DEFAULTS)
    setResult(null)
  }, [])

  // Kiosk: after inactivity, return to the attract loop so the next person starts fresh.
  useIdleReset(reset, 75000, phase !== 'attract')

  const patch = useCallback((p) => setDraft((d) => ({ ...d, ...p })), [])

  const submit = useCallback(
    (about) => {
      const player = { ...draft, ...about }
      const res = computeResults(player, regional)
      setDraft(player)
      setResult({ ...res, name: player.name })
      setDir(1)
      setPhase('result')
    },
    [draft]
  )

  const ctx = useMemo(() => ({ lang, setLang }), [lang])

  // Scale-to-fit only makes sense on a landscape/large screen; a portrait phone
  // keeps the readable stacked layout (which scrolls) rather than shrinking.
  const fit = useMediaQuery('(min-width: 900px) and (orientation: landscape)')
  const reduce = useReducedMotion()

  // Result fills the viewport (two panels stretch to the full width, so there is
  // no dark void on wide screens) and slides in from the right like the steps.
  if (phase === 'result' && result) {
    return (
      <LangContext.Provider value={ctx}>
        <AnimatePresence>
          <motion.div
            key="result-view"
            initial={reduce ? false : { x: '100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ minHeight: '100svh', background: '#1b1410' }}
          >
            <Result result={result} player={draft} backend={backend} onPlayAgain={reset} />
          </motion.div>
        </AnimatePresence>
      </LangContext.Provider>
    )
  }

  const step =
    phase === 'attract' ? (
      <Attract onBegin={() => go('amount', 1)} />
    ) : phase === 'amount' ? (
      <StepAmount
        value={draft.target}
        min={MIN_TARGET}
        onChange={(t) => patch({ target: t })}
        onBack={reset}
        onNext={() => go('about', 1)}
      />
    ) : (
      <StepAbout draft={draft} onChange={patch} onBack={() => go('amount', -1)} onSubmit={submit} />
    )

  return (
    <LangContext.Provider value={ctx}>
      {fit ? (
        <FitToScreen enabled background="var(--hero-glow)" fixedWidth={STAGE_W} fixedHeight={STAGE_H}>
          <Shell phase={phase} dir={dir} sliding step={step} />
        </FitToScreen>
      ) : (
        <Shell phase={phase} dir={dir} sliding={false} step={step} />
      )}
    </LangContext.Provider>
  )
}

function Shell({ phase, dir, sliding, step }) {
  const { t, lang, setLang } = useT()
  const stepIndex = phase === 'amount' ? 1 : phase === 'about' ? 2 : 0
  return (
    <div className={sliding ? 'app app--dark app--fixed' : 'app app--dark'}>
      <header className="app__header">
        <span className="brand"><Logo /></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="kicker" style={{ fontSize: 'var(--label-md)' }}>
            {phase === 'attract' ? t('festival') : t('step', { n: stepIndex })}
          </span>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      {sliding ? (
        <main className="app__main app__main--slide">
          <AnimatePresence custom={dir} initial={false}>
            <motion.div
              key={phase}
              className="stage stage--abs"
              custom={dir}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step}
            </motion.div>
          </AnimatePresence>
        </main>
      ) : (
        <main className="app__main">
          <div className="stage">{step}</div>
        </main>
      )}

      {/* Footer height is always reserved so the slide area never shifts. */}
      <footer className="app__footer">
        {phase === 'attract' && (
          <span className="kicker" style={{ color: 'var(--text-on-dark-muted)', fontSize: 'var(--label-md)' }}>
            {t('tagline')}
          </span>
        )}
      </footer>
    </div>
  )
}
