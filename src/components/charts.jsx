import { motion, useReducedMotion } from 'framer-motion'
import { formatEur } from '../lib/format.js'

// Animated horizontal salary bars. Pure SVG that scales to its container
// (width:100%, height auto via a uniform-aspect viewBox so text + rounded
// corners stay crisp). Each value bar grows 0 → its proportion on mount; the
// highlighted row (hl) is gold (var(--accent)), others muted. Works on dark
// (dark=true) and light surfaces.
export function SalaryBars({ rows = [], dark = false }) {
  const reduce = useReducedMotion()
  if (!rows.length) return null

  // Geometry in viewBox units (uniform scaling → height tracks width).
  const W = 320
  const labelW = 78 // left gutter for the row labels
  const barX = labelW + 8
  const barEnd = W - 4
  const barSpan = barEnd - barX
  const rowH = 34
  const barH = 19
  const gap = 12
  const H = rows.length * rowH + (rows.length - 1) * gap
  const max = Math.max(1, ...rows.map((r) => Number(r.value) || 0))

  const track = dark ? '#3a342e' : 'var(--paper-100)'
  const mutedFill = dark ? '#5f564b' : 'var(--paper-300)'

  return (
    <svg
      role="img"
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      {rows.map((r, i) => {
        const value = Number(r.value) || 0
        const fullW = Math.max(2, (value / max) * barSpan)
        const y = i * (rowH + gap)
        const mid = y + rowH / 2
        const barY = y + (rowH - barH) / 2
        const fill = r.hl ? 'var(--accent)' : mutedFill
        const labelColor = r.hl
          ? 'var(--accent-on-dark)'
          : dark
            ? 'var(--text-on-dark-muted)'
            : 'var(--text-muted)'
        // Long bars: value sits inside (light text); short bars: just past the end.
        const inside = fullW > barSpan * 0.74
        const valueX = inside ? barX + fullW - 8 : barX + fullW + 7

        return (
          <g key={i}>
            <text
              x={labelW}
              y={mid}
              textAnchor="end"
              dominantBaseline="central"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                fontWeight: 'var(--fw-demi)',
                letterSpacing: '1.3px',
                textTransform: 'uppercase',
                fill: labelColor,
              }}
            >
              {r.label}
            </text>

            <rect
              x={barX}
              y={barY}
              width={barSpan}
              height={barH}
              rx={3}
              style={{ fill: track }}
              opacity={dark ? 0.5 : 0.85}
            />

            <motion.rect
              x={barX}
              y={barY}
              height={barH}
              rx={3}
              style={{ fill }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: fullW }}
              transition={{
                duration: 0.95,
                delay: reduce ? 0 : 0.12 + i * 0.09,
                ease: [0.22, 1, 0.36, 1],
              }}
            />

            <motion.text
              x={valueX}
              y={mid}
              textAnchor={inside ? 'end' : 'start'}
              dominantBaseline="central"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 0.5 + i * 0.09 }}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 11,
                fontWeight: 'var(--fw-medium)',
                fontVariantNumeric: 'tabular-nums lining-nums',
                fill: inside ? (dark ? 'var(--ink-900)' : '#fff') : (dark ? 'var(--text-on-dark)' : 'var(--text-strong)'),
              }}
            >
              {formatEur(value)}
            </motion.text>
          </g>
        )
      })}
    </svg>
  )
}

// Unused by Result (Leaderboard owns its own distribution). Kept as a no-op
// placeholder so the named export stays stable for any other importer.
export function RoomHistogram() {
  return <div style={{ height: 80 }} />
}
