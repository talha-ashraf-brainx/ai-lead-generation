import { useState, type PointerEvent } from 'react'
import type { AnalyticsSeriesPoint } from '../../types/analytics'

interface TrendChartProps {
  data: AnalyticsSeriesPoint[]
  color: string
  width?: number
  height?: number
}

const PAD_X = 4
const PAD_TOP = 8
const PAD_BOTTOM = 4

export function TrendChart({ data, color, width = 260, height = 64 }: TrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0 || data.every((point) => point.value === 0)) {
    return (
      <div className="flex h-16 items-center justify-center text-xs text-slate-500">No activity in this range</div>
    )
  }

  const max = Math.max(1, ...data.map((point) => point.value))
  const innerWidth = width - PAD_X * 2
  const innerHeight = height - PAD_TOP - PAD_BOTTOM
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0

  const points = data.map((point, index) => ({
    x: PAD_X + index * stepX,
    y: PAD_TOP + innerHeight - (point.value / max) * innerHeight,
    date: point.date,
    value: point.value,
  }))

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
  const baseline = PAD_TOP + innerHeight
  const areaPath = `${linePath} L${points[points.length - 1].x},${baseline} L${points[0].x},${baseline} Z`
  const last = points[points.length - 1]
  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  function handleMove(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * width
    const index = Math.round((x - PAD_X) / (stepX || 1))
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)))
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <line x1={PAD_X} y1={baseline} x2={width - PAD_X} y2={baseline} stroke="var(--color-graphite-700)" strokeWidth={1} />
        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {hovered && (
          <line x1={hovered.x} y1={PAD_TOP} x2={hovered.x} y2={baseline} stroke="var(--color-graphite-600)" strokeWidth={1} />
        )}
        <circle cx={last.x} cy={last.y} r={4} fill={color} stroke="var(--color-graphite-900)" strokeWidth={2} />
        {hovered && hoverIndex !== points.length - 1 && (
          <circle cx={hovered.x} cy={hovered.y} r={4} fill={color} stroke="var(--color-graphite-900)" strokeWidth={2} />
        )}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-graphite-600 bg-graphite-800 px-2 py-1 text-xs whitespace-nowrap shadow-lg"
          style={{ left: `${(hovered.x / width) * 100}%` }}
        >
          <span className="font-medium text-fog-50">{hovered.value}</span>{' '}
          <span className="text-slate-400">
            {new Date(hovered.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  )
}
