import { useEffect, useState } from 'react'

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function useCountUp(target: number, durationMs: number, delayMs = 0): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    let frame: number
    let start: number | null = null
    const timeout = setTimeout(() => {
      function tick(timestamp: number) {
        if (start === null) start = timestamp
        const elapsed = timestamp - start
        const progress = Math.min(1, elapsed / durationMs)
        setValue(Math.round(target * EASE_OUT_EXPO(progress)))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, delayMs)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frame)
    }
  }, [target, durationMs, delayMs])

  return value
}
