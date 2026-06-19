import { useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n.js'
import { formatEur } from '../lib/format.js'
import { rise, StepDots } from './ui.jsx'

// Amount-entry step: live euro display + numeric keypad + quick presets.
// SOURCE OF TRUTH is the `value` prop; every change funnels through onChange(int).
const PRESETS = [250000, 500000, 1000000, 2000000, 5000000]
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫']
const CAP = 1_000_000_000

export default function StepAmount({ value, min, onChange, onBack, onNext }) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const belowMin = value < min
  const canNext = !belowMin

  // Apply a keypad token to the current integer value, then publish via onChange.
  const press = useCallback(
    (key) => {
      let next
      if (key === '⌫') {
        next = Math.floor(value / 10)
      } else {
        // append the digits of the token (digit or "000") to the right of value
        const appended = String(value) + key
        next = Math.min(CAP, parseInt(appended, 10) || 0)
      }
      if (next !== value) onChange(next)
    },
    [value, onChange]
  )

  // Physical keyboard: digits append, Backspace deletes, Enter advances when allowed.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        press(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        press('⌫')
      } else if (e.key === 'Enter' && canNext) {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press, canNext, onNext])

  const tap = reduce ? undefined : { scale: 0.94 }

  return (
    <motion.div
      className="measure stepamount"
      initial="hidden"
      animate="show"
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px, 2.6vh, 26px)' }}
    >
      <style>{STYLES}</style>

      {/* Heading + kicker + live euro display */}
      <motion.h2
        custom={0}
        variants={rise}
        className="display"
        style={{ fontSize: 'var(--display-md)', textAlign: 'center', maxWidth: '16ch' }}
      >
        {t('yourNumberPrompt')}
      </motion.h2>

      <motion.span custom={1} variants={rise} className="kicker">
        {t('yourNumberHint')}
      </motion.span>

      <motion.div custom={2} variants={rise} style={{ minHeight: 'calc(var(--display-lg) * 1.04)', display: 'flex', alignItems: 'center' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={value}
            className="tnum"
            initial={reduce ? false : { scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 1.06, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--fw-bold)',
              fontSize: 'var(--display-lg)',
              lineHeight: 'var(--lh-tight)',
              letterSpacing: 'var(--ls-display)',
              color: 'var(--accent-on-dark)',
            }}
            aria-live="polite"
          >
            {formatEur(value)}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Keypad (left) + presets (right): side by side >=720px, stacked below. */}
      <motion.div custom={3} variants={rise} className="stepamount__cols">
        <div className="numpad stepamount__pad" role="group" aria-label={t('yourNumberPrompt')}>
          {KEYS.map((key) => (
            <motion.button
              key={key}
              type="button"
              whileTap={tap}
              onClick={() => press(key)}
              aria-label={key === '⌫' ? 'Delete' : key}
            >
              {key}
            </motion.button>
          ))}
        </div>

        <div className="stepamount__side">
          <span className="kicker" id="preset-hint" style={{ fontSize: 'var(--label-md)', color: 'var(--text-on-dark-muted)' }}>
            {t('presetHint')}
          </span>
          <div className="chips" role="group" aria-labelledby="preset-hint">
            {PRESETS.map((p) => (
              <motion.button
                key={p}
                type="button"
                className="chip"
                whileTap={tap}
                aria-pressed={value === p}
                onClick={() => onChange(p)}
              >
                {formatEur(p)}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Min note (only when below the threshold) */}
      <motion.div custom={4} variants={rise} style={{ minHeight: '1.4em' }}>
        {belowMin && (
          <span className="muted" style={{ fontSize: 'var(--body-sm)' }}>
            {t('minNote', { min: formatEur(min) })}
          </span>
        )}
      </motion.div>

      {/* Bottom nav: Back · step dots · Next */}
      <motion.div
        custom={5}
        variants={rise}
        className="stepamount__nav"
        style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginTop: 'auto' }}
      >
        <button type="button" className="btn btn--ghost" style={{ justifySelf: 'start' }} onClick={onBack}>
          ← {t('back')}
        </button>
        <StepDots total={2} current={0} />
        <button
          type="button"
          className="btn btn--primary"
          style={{ justifySelf: 'end' }}
          disabled={!canNext}
          onClick={onNext}
        >
          {t('next')} →
        </button>
      </motion.div>
    </motion.div>
  )
}

// Scoped responsive layout. Media queries can't live in inline styles, and
// global.css is not ours to edit, so the breakpoint rules ride with the
// component. >=720px: keypad left / presets right; below: stacked, keypad first.
const STYLES = `
.stepamount { max-width: 720px; }
.stepamount__cols {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(18px, 3vw, 32px);
}
.stepamount__pad { width: 100%; }
.stepamount__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}
.stepamount__side .chips { flex: 0 0 auto; }
@media (min-width: 720px) {
  .stepamount__cols {
    grid-template-columns: minmax(0, 1.35fr) minmax(200px, 1fr);
    align-items: stretch;
  }
}
@media (max-width: 719.98px) {
  .stepamount__nav { gap: 10px; }
  .stepamount__nav .btn { padding-left: 16px; padding-right: 16px; }
}
`
