import { useLayoutEffect, useRef, useState, useCallback } from 'react'

// Scale-to-fit wrapper with two modes:
//
//  • FIXED CANVAS (fixedWidth + fixedHeight given): the child is a fixed-size
//    stage and the scale depends ONLY on the viewport, not on the content. This
//    is what the input wizard uses, so the scale is identical on every step and
//    nothing jumps when you move between them. Fills the screen (may upscale).
//
//  • CONTENT-FIT (no fixed size): measures the child and scales it down (never
//    up) to fit. Used by the result, whose height varies. A CSS transform does
//    not change offsetWidth/Height, so the natural size stays measurable.
//
// Gated to landscape/large screens by the caller; a portrait phone keeps the
// readable stacked layout and scrolls instead of shrinking to nothing.
export default function FitToScreen({
  children, enabled = true, min = 0.5, background = 'transparent', align = 'center',
  fixedWidth = null, fixedHeight = null,
}) {
  const fixed = !!(fixedWidth && fixedHeight)
  const wrapRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)

  const measure = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const availW = wrap.clientWidth
    const availH = wrap.clientHeight
    let cw, ch
    if (fixed) {
      cw = fixedWidth
      ch = fixedHeight
    } else {
      const content = contentRef.current
      if (!content) return
      cw = content.offsetWidth
      ch = content.offsetHeight
    }
    if (!cw || !ch) return
    const s = Math.min(availW / cw, availH / ch)
    // Fixed canvas fills the screen (upscale allowed); content-fit never upscales.
    setScale(fixed ? Math.max(min, s) : Math.max(min, Math.min(1, s)))
  }, [fixed, fixedWidth, fixedHeight, min])

  useLayoutEffect(() => {
    if (!enabled) return
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    if (!fixed && contentRef.current) ro.observe(contentRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [enabled, measure, fixed])

  if (!enabled) return children

  const origin =
    align === 'flex-start' ? 'left center' : align === 'flex-end' ? 'right center' : 'center center'
  const contentStyle = fixed
    ? { width: fixedWidth, height: fixedHeight, flex: '0 0 auto', transform: `scale(${scale})`, transformOrigin: origin }
    : { width: '100%', flex: '0 0 auto', transform: `scale(${scale})`, transformOrigin: origin }

  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%', height: '100svh', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: align,
        background,
      }}
    >
      <div ref={contentRef} style={contentStyle}>
        {children}
      </div>
    </div>
  )
}
