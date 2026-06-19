import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion'
import { formatEur, groupSpaces } from '../lib/format.js'
import logoUrl from '../assets/signet-logo.svg'

// Count-up number. `kind`: 'eur' | 'plain'. Eases from 0 to value on mount/change.
export function AnimatedNumber({ value, kind = 'eur', duration = 1.15, className }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(reduce ? value : 0)
  const fmt = kind === 'eur' ? formatEur : groupSpaces
  const text = useTransform(mv, (v) => fmt(v))
  useEffect(() => {
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
  }, [value, reduce, duration]) // eslint-disable-line
  return <motion.span className={className}>{text}</motion.span>
}

export function Logo({ className }) {
  return <img className={className} src={logoUrl} alt="Signet Bank" />
}

export function Arrow() {
  return <span aria-hidden="true">→</span>
}

export function LangToggle({ lang, setLang }) {
  return (
    <div className="langtoggle" role="group" aria-label="Language">
      {['et', 'en'].map((l) => (
        <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export function StepDots({ total, current }) {
  return (
    <div className="dots" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i === current ? 'on' : ''} />
      ))}
    </div>
  )
}

// Standard entrance for a screen's stacked children (staggered rise + fade).
export const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

export const screenTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.26, ease: [0.65, 0, 0.35, 1] } },
}
