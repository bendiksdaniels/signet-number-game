import { motion } from 'framer-motion'
import { useT } from '../i18n.js'
import { rise, Arrow } from './ui.jsx'

// Reference screen: establishes the dark-stage aesthetic the other screens match.
export default function Attract({ onBegin }) {
  const { t } = useT()
  const begin = () => onBegin()
  return (
    <motion.div
      className="measure"
      initial="hidden"
      animate="show"
      role="button"
      tabIndex={0}
      onClick={begin}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && begin()}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px, 2.2vh, 22px)', cursor: 'pointer' }}
    >
      <motion.span custom={0} variants={rise} className="kicker">
        {t('gameKicker')}
      </motion.span>

      <motion.h1 custom={1} variants={rise} className="display" style={{ fontSize: 'var(--display-xl)' }}>
        <span style={{ display: 'block' }}>{t('attractTitle1')}</span>
        <span style={{ display: 'block', color: 'var(--accent-on-dark)' }}>{t('attractTitle2')}</span>
      </motion.h1>

      <motion.p
        custom={2}
        variants={rise}
        className="serif muted"
        style={{ fontStyle: 'italic', fontSize: 'var(--body-xl)', lineHeight: 'var(--lh-snug)', maxWidth: '32ch' }}
      >
        {t('attractSub')}
      </motion.p>

      <motion.span custom={3} variants={rise} className="btn btn--ghost" style={{ marginTop: 'clamp(6px, 1.8vh, 16px)' }}>
        {t('tapToBegin')}
        <motion.span animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.7, ease: 'easeInOut' }}>
          <Arrow />
        </motion.span>
      </motion.span>
    </motion.div>
  )
}
