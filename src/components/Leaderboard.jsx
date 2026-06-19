import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n.js'
import { rise } from './ui.jsx'

// Compact euro: 5_000_000 -> "€5M", 3_200_000 -> "€3.2M", 1_000_000 -> "€1M",
// 250_000 -> "€250k", 900 -> "€900". A light touch, matching the original chips.
function compactEur(n) {
  const v = Math.max(0, Math.round(Number(n) || 0))
  if (v >= 1e6) {
    const m = v / 1e6
    const s = (Math.round(m * 10) / 10).toString() // one decimal, drop trailing .0
    return '€' + s + 'M'
  }
  if (v >= 1e3) return '€' + Math.round(v / 1e3) + 'k'
  return '€' + v
}

// Build ~8 buckets across the room's target range; flag the bucket holding the
// player's target. Returns counts + the player's bucket index (or -1).
function useHistogram(rows, playerTarget, buckets = 8) {
  return useMemo(() => {
    const targets = rows.map((r) => Number(r.target) || 0).filter((v) => v > 0)
    if (!targets.length) return { counts: [], youIdx: -1, max: 0 }
    let lo = Math.min(...targets, playerTarget)
    let hi = Math.max(...targets, playerTarget)
    if (hi <= lo) hi = lo + 1 // avoid zero-width range
    const span = hi - lo
    const idxOf = (v) => Math.min(buckets - 1, Math.floor(((v - lo) / span) * buckets))
    const counts = new Array(buckets).fill(0)
    targets.forEach((v) => { counts[idxOf(v)] += 1 })
    const youIdx = playerTarget > 0 ? idxOf(playerTarget) : -1
    return { counts, youIdx, max: Math.max(...counts, 1) }
  }, [rows, playerTarget, buckets])
}

function Histogram({ rows, result, t, reduce }) {
  const { counts, youIdx, max } = useHistogram(rows, Number(result?.target) || 0)
  if (!counts.length) return null

  // viewBox geometry — scales fluidly via width:100%.
  const W = 320
  const H = 78
  const gap = 6
  const n = counts.length
  const bw = (W - gap * (n - 1)) / n
  const floor = H - 12 // leave room for the YOU tick baseline
  const minBar = 3

  return (
    <div style={{ marginTop: 'var(--space-3)' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={t('outDream', { pct: result?.percentile ?? 0, total: counts.reduce((a, b) => a + b, 0) })}
        style={{ overflow: 'visible' }}
      >
        {counts.map((c, i) => {
          const h = Math.max(minBar, (c / max) * (floor - 6))
          const x = i * (bw + gap)
          const y = floor - h
          const isYou = i === youIdx
          return (
            <g key={i}>
              {isYou && (
                <>
                  <motion.text
                    x={x + bw / 2}
                    y={6}
                    textAnchor="middle"
                    style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', fill: 'var(--accent)' }}
                    initial={reduce ? false : { opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    {t('you').toUpperCase()}
                  </motion.text>
                  <line
                    x1={x + bw / 2}
                    x2={x + bw / 2}
                    y1={9}
                    y2={y - 2}
                    stroke="var(--accent)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                </>
              )}
              <motion.rect
                x={x}
                width={bw}
                rx="2"
                fill={isYou ? 'var(--accent)' : 'var(--border-strong)'}
                initial={reduce ? false : { height: minBar, y: floor - minBar }}
                animate={{ height: h, y }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>
          )
        })}
        <line x1="0" x2={W} y1={floor} y2={floor} stroke="var(--border-subtle)" strokeWidth="1" />
      </svg>
      <div
        className="muted"
        style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 'var(--label-md)', letterSpacing: '0.04em' }}
      >
        <span>{t('lowerAxis')}</span>
        <span>{t('higherAxis')}</span>
      </div>
    </div>
  )
}

export default function Leaderboard({ stats, rows = [], result, live = false }) {
  const { t } = useT()
  const reduce = useReducedMotion()

  // Highlight only the FIRST row matching the player by name AND target.
  const meIdx = useMemo(
    () => rows.findIndex((r) => r.name === result?.name && Number(r.target) === Number(result?.target)),
    [rows, result?.name, result?.target]
  )

  const total = stats?.total ?? rows.length

  return (
    <motion.div initial="hidden" animate="show">
      {/* header: kicker + live pill */}
      <motion.div
        custom={0}
        variants={rise}
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
      >
        <span className="kicker">{t('roomTitle')}</span>
        {live && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--fw-demi)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              padding: '3px 9px',
              borderRadius: 'var(--radius-pill)',
              background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
            }}
          >
            <motion.span
              aria-hidden="true"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}
              animate={reduce ? {} : { opacity: [1, 0.35, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            />
            {t('liveTag')}
          </span>
        )}
      </motion.div>

      {/* headline */}
      <motion.div
        custom={1}
        variants={rise}
        className="display tnum"
        style={{ fontSize: 'var(--display-md)', color: 'var(--accent)', marginTop: 'var(--space-2)', lineHeight: 'var(--lh-tight)' }}
      >
        {t('topPct', { pct: stats?.top ?? '–' })}
      </motion.div>
      <motion.p custom={1} variants={rise} className="serif muted" style={{ fontStyle: 'italic', marginTop: 2 }}>
        {t('outDream', { pct: stats?.percentile ?? 0, total })}
      </motion.p>

      {/* distribution */}
      <motion.div custom={2} variants={rise}>
        <Histogram rows={rows} result={result} t={t} reduce={reduce} />
      </motion.div>

      {/* biggest dreamers */}
      <motion.div custom={3} variants={rise} className="kicker" style={{ marginTop: 'var(--space-5)' }}>
        {t('biggestDreamers')}
      </motion.div>
      <div style={{ marginTop: 'var(--space-3)' }}>
        {rows.map((r, i) => {
          const isMe = i === meIdx
          return (
            <motion.div
              key={`${r.name}-${i}`}
              className={isMe ? 'lbrow me' : 'lbrow'}
              custom={4 + i}
              variants={rise}
              {...(isMe && !reduce
                ? {
                    animate: { opacity: 1, y: 0, scale: [1, 1.012, 1] },
                    transition: { duration: 0.6, delay: 0.05 + (4 + i) * 0.07, ease: [0.22, 1, 0.36, 1] },
                  }
                : {})}
            >
              <span className="rank">{i + 1}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name}{isMe ? ' ' + t('youTag') : ''}
              </span>
              <span className="tnum" style={{ fontWeight: 'var(--fw-demi)' }}>{compactEur(r.target)}</span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
