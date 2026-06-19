import { motion, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n.js'
import { formatEur, groupSpaces } from '../lib/format.js'

// Visual "what your number buys": one bar splits the monthly income into tax, a
// luxury home (rent), utilities and what's free. The free part is then pictured
// two ways: fancy dinners out a week (EUR 100 a meal) and holidays a year (a
// EUR 2,000 week away). Segments sum to the gross, so the bar is honest.
const SEG = {
  tax: { color: '#4a443d', label: 'segTax' },
  rent: { color: '#7a6047', label: 'segRent' },
  utilities: { color: '#9a785a', label: 'segUtilities' },
  free: { color: 'var(--accent-on-dark)', label: 'segFree' },
}

function Fork() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3v6a2 2 0 0 0 4 0V3M8 9v12" />
      <path d="M17 3c-1.5 0-2.5 1.6-2.5 4s1 4 2.5 4M17 3v18" />
    </svg>
  )
}

function Plane() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 13.5 3 11l-.5-1.6L4 9l2.5 1 3-1L6 4.2 7.6 4l5 3 4.2-1.4a1.6 1.6 0 0 1 1 3l-3.8 1.6-2 8-1.4.3-.6-5-3 1.2-.4 2.2-1.2.3z" />
    </svg>
  )
}

export default function Afford({ life }) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const total = Math.max(life.gross, life.tax + life.living) || 1
  const segs = life.segments.filter((s) => s.value > 0)

  return (
    <div className="afford">
      <div className="afford__head">
        <span className="kicker">{t('whatItBuys')}</span>
        <span className="afford__place serif">{life.capital} · {life.district}</span>
      </div>

      <div className="afford__bar" role="img" aria-label={t('whatItBuys')}>
        {segs.map((s, i) => (
          <motion.span
            key={s.key}
            className="afford__seg"
            style={{ background: SEG[s.key].color }}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${(s.value / total) * 100}%` }}
            transition={{ duration: 0.7, delay: reduce ? 0 : 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>

      <div className="afford__legend">
        {segs.map((s) => (
          <span key={s.key} className="afford__item">
            <i style={{ background: SEG[s.key].color }} />
            {t(SEG[s.key].label)} <b className="tnum">{formatEur(s.value)}</b>
          </span>
        ))}
      </div>

      {life.affords ? (
        <>
          <div className="afford__metrics">
            <span className="afford__metric">
              <Fork />
              <b className="tnum">{life.mealsPerWeek}</b> {t('mealsAWeek')}
            </span>
            <span className="afford__metric">
              <Plane />
              <b className="tnum">{life.holidaysPerYear}</b> {t('holidaysAYear')}
            </span>
          </div>
          <span className="afford__assume">{t('affordAssume', { meal: groupSpaces(life.mealPrice), trip: groupSpaces(life.tripCost) })}</span>
        </>
      ) : (
        <p className="serif muted afford__partial" style={{ fontStyle: 'italic' }}>
          {t('buysPartial', { capital: life.capital, pct: life.coverPct })}
        </p>
      )}
    </div>
  )
}
