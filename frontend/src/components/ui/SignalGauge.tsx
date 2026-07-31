import { motion } from 'motion/react'

interface SignalGaugeProps {
  size?: number
  value?: number
  animated?: boolean
  className?: string
}

const STAGE_COLORS = [
  'var(--color-temp-cold)',
  'var(--color-temp-cool)',
  'var(--color-temp-warm)',
  'var(--color-temp-hot)',
]

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = arcPoint(cx, cy, r, startDeg)
  const end = arcPoint(cx, cy, r, endDeg)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 0 0 ${end.x} ${end.y}`
}

// The signature mark: a literal Signal Temperature dial (cold -> hot), used as
// the logomark and as the login hero. Needle position is decorative, not a data
// encoding, so it doesn't go through the dataviz color-validation path.
export function SignalGauge({ size = 40, value = 0.64, animated = false, className = '' }: SignalGaugeProps) {
  const cx = 20
  const cy = 21
  const r = 16
  const needleAngle = 180 - value * 180
  const needleEnd = arcPoint(cx, cy, r * 0.8, needleAngle)

  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 40 24.5" className={className} fill="none">
      {STAGE_COLORS.map((color, i) => (
        <path
          key={color}
          d={arcPath(cx, cy, r, 180 - i * 45, 180 - (i + 1) * 45)}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.9}
        />
      ))}
      <motion.line
        x1={cx}
        y1={cy}
        x2={needleEnd.x}
        y2={needleEnd.y}
        stroke="var(--color-fog-50)"
        strokeWidth={1.4}
        strokeLinecap="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        initial={animated ? { rotate: -46 } : undefined}
        animate={animated ? { rotate: 0 } : undefined}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      />
      <circle cx={cx} cy={cy} r={1.8} fill="var(--color-fog-50)" />
    </svg>
  )
}
