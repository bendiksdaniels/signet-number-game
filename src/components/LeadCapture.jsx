import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n.js'
import { rise } from './ui.jsx'

// Basic, forgiving email check — enough to gate the button without rejecting
// legitimate addresses. Real validation happens server-side.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isValidEmail = (s) => EMAIL_RE.test(String(s).trim())

export default function LeadCapture({ backend, player, result }) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('') // 'invalid' | 'save' | ''

  const trimmed = email.trim()
  const emailOk = isValidEmail(trimmed)
  const showEmailError = trimmed.length > 0 && !emailOk
  const canSend = emailOk && consent && !saving

  async function submit() {
    if (!canSend) return
    setSaving(true)
    setError('')
    try {
      await backend.saveLead({
        email: trimmed,
        consent: true,
        name: player.name,
        target: result.target,
        country: result.country,
      })
      setSent(true)
    } catch (e) {
      setError('save')
    } finally {
      setSaving(false)
    }
  }

  const fade = reduce
    ? { initial: false }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <motion.p
          key="thanks"
          className="serif"
          style={{ fontStyle: 'italic', fontSize: 'var(--body-lg)', color: 'var(--text-strong)' }}
          {...fade}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('captureThanks')}
        </motion.p>
      ) : (
        <motion.form
          key="form"
          onSubmit={(e) => { e.preventDefault(); submit() }}
          initial="hidden"
          animate="show"
          {...(reduce ? {} : { exit: { opacity: 0, y: -6, transition: { duration: 0.26 } } })}
          noValidate
        >
          <motion.div custom={0} variants={rise} className="kicker">{t('captureTitle')}</motion.div>
          <motion.p custom={1} variants={rise} className="muted" style={{ marginTop: 'var(--space-2)' }}>
            {t('captureBody')}
          </motion.p>

          <motion.div custom={2} variants={rise} style={{ marginTop: 'var(--space-4)' }}>
            <label htmlFor="lead-email" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
              {t('emailPlaceholder')}
            </label>
            <input
              id="lead-email"
              className="field"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error === 'save') setError('') }}
              aria-invalid={showEmailError}
              aria-describedby={showEmailError ? 'lead-email-error' : undefined}
              style={{ color: 'var(--text-strong)', borderColor: 'var(--border-strong)' }}
            />
            <AnimatePresence>
              {showEmailError && (
                <motion.div
                  id="lead-email-error"
                  role="alert"
                  initial={reduce ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? {} : { opacity: 0, y: -4 }}
                  style={{ color: 'var(--negative)', fontSize: 'var(--body-sm)', marginTop: 'var(--space-2)' }}
                >
                  {t('emailInvalid')}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.label
            custom={3}
            variants={rise}
            htmlFor="lead-consent"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginTop: 'var(--space-4)', cursor: 'pointer', color: 'var(--text-body)', fontSize: 'var(--body-sm)', lineHeight: 'var(--lh-snug)' }}
          >
            <input
              id="lead-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              style={{ width: 20, height: 20, marginTop: 1, flex: '0 0 auto', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span>{t('consentText')}</span>
          </motion.label>

          <AnimatePresence>
            {error === 'save' && (
              <motion.div
                role="alert"
                initial={reduce ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? {} : { opacity: 0, y: -4 }}
                style={{ color: 'var(--negative)', fontSize: 'var(--body-sm)', marginTop: 'var(--space-3)' }}
              >
                {t('saveError')}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            custom={4}
            variants={rise}
            type="submit"
            className="btn btn--primary"
            disabled={!canSend}
            style={{ marginTop: 'var(--space-4)', width: '100%' }}
          >
            {t('sendBtn')}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
