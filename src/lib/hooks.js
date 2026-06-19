import { useEffect, useRef, useState } from 'react'

// Reactive CSS media query (used to gate the fit-to-screen scaler to landscape).
export function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

// Polling that survives re-renders (used to refresh the live leaderboard).
export function useInterval(cb, delay) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (delay == null) return
    const id = setInterval(() => ref.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

// Kiosk idle reset: after `ms` with no interaction, call onIdle (back to attract).
export function useIdleReset(onIdle, ms = 60000, active = true) {
  useEffect(() => {
    if (!active) return
    let id
    const reset = () => {
      clearTimeout(id)
      id = setTimeout(onIdle, ms)
    }
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel']
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      clearTimeout(id)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [onIdle, ms, active])
}
