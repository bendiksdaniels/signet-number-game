import { motion, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n.js'
import { rise, StepDots } from './ui.jsx'

const COUNTRIES = ['EE', 'LV', 'LT']
const AGE_MIN = 16
// Current age caps one below the retirement cap so retire can always sit above
// age (retireMin = age + 1). If AGE_MAX ever reaches RETIRE_MAX the retire
// slider's min would exceed its max and break.
const AGE_MAX = 69
const RETIRE_MAX = 70

// Step 2 of 2: collects name, age, retirement age and country, then submits.
// `draft` holds live values; patch via onChange({ field }). Submit with onSubmit({}).
export default function StepAbout({ draft, onChange, onBack, onSubmit }) {
  const { t, dict } = useT()
  const reduce = useReducedMotion()

  const ok = (draft.name || '').trim().length > 0
  const retireMin = Math.max(draft.age + 1, 45)

  // Age and retire are coupled: retire must always sit above age. When the user
  // raises age past the current retire value, push retire up with it so the
  // result maths never sees a retirement age that's <= the person's age.
  const setAge = (age) => {
    const next = { age }
    if (draft.retire <= age) next.retire = Math.min(age + 1, RETIRE_MAX)
    onChange(next)
  }
  // Clamp retire to at least age+1 defensively (the slider min already enforces
  // this, but keep the patch honest if it's ever driven from elsewhere).
  const setRetire = (retire) => onChange({ retire: Math.max(retire, draft.age + 1) })

  const submit = () => ok && onSubmit({})

  // Variants gate themselves on reduced motion: hidden == show, no delay.
  const v = reduce ? undefined : rise
  const initial = reduce ? false : 'hidden'

  return (
    <motion.form
      className="about"
      initial={initial}
      animate="show"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="about__body">
        <motion.h2 custom={0} variants={v} className="display" style={{ fontSize: 'var(--display-md)' }}>
          {t('aboutYou')}
        </motion.h2>
        <motion.p
          custom={1}
          variants={v}
          className="serif muted"
          style={{ fontStyle: 'italic', fontSize: 'var(--body-lg)', marginTop: 'var(--space-2)' }}
        >
          {t('aboutYouPrompt')}
        </motion.p>

        {/* Name */}
        <motion.div custom={2} variants={v} className="about__row">
          <label className="kicker" htmlFor="about-name">
            {t('nameLabel')}
          </label>
          <input
            id="about-name"
            className="field"
            type="text"
            autoComplete="given-name"
            placeholder={t('namePlaceholder')}
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </motion.div>

        {/* Sliders: age + retire, side by side, stacking on narrow screens */}
        <motion.div custom={3} variants={v} className="about__sliders">
          <Slider
            label={t('ageLabel')}
            suffix={t('years')}
            value={draft.age}
            min={AGE_MIN}
            max={AGE_MAX}
            onChange={setAge}
          />
          <Slider
            label={t('retireLabel')}
            suffix={t('years')}
            value={draft.retire}
            min={retireMin}
            max={RETIRE_MAX}
            onChange={setRetire}
          />
        </motion.div>

        {/* Country */}
        <motion.div custom={4} variants={v} className="about__row">
          <span className="kicker">{t('countryLabel')}</span>
          <div className="segmented" role="group" aria-label={t('countryLabel')} style={{ marginTop: 'var(--space-3)' }}>
            {COUNTRIES.map((code) => {
              const selected = draft.country === code
              return (
                <motion.button
                  key={code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ country: code })}
                  animate={reduce ? undefined : { scale: selected ? 1.015 : 1 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <b>{code}</b>
                  <span>{dict.countryNames[code]}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom nav: back · dots · submit */}
      <motion.div custom={5} variants={v} className="about__nav">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← {t('back')}
        </button>
        <StepDots total={2} current={1} />
        <button type="submit" className="btn btn--primary" disabled={!ok}>
          {t('seeMyNumber')} →
        </button>
      </motion.div>
    </motion.form>
  )
}

// One labelled slider: kicker label, big gold tabular value with a small suffix,
// then the shared .range input beneath.
function Slider({ label, suffix, value, min, max, onChange }) {
  return (
    <label className="about__slider">
      <span className="kicker">{label}</span>
      <span className="about__val tnum" style={{ color: 'var(--accent-on-dark)' }}>
        {value}
        <span className="about__val-suffix muted">{suffix}</span>
      </span>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        aria-valuetext={`${value} ${suffix}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
