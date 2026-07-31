import { useCountUp } from '../../hooks/useCountUp'
import { Skeleton } from '../ui/Skeleton'
import { TrendChart } from './TrendChart'
import type { AnalyticsSeriesPoint } from '../../types/analytics'

interface StatCardProps {
  label: string
  value: number
  color: string
  trend: AnalyticsSeriesPoint[]
  isLoading: boolean
}

export function StatCard({ label, value, color, trend, isLoading }: StatCardProps) {
  const count = useCountUp(value, 700, 100)

  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-lg bg-graphite-900 p-4"
      style={{ border: `1px solid color-mix(in srgb, ${color} 22%, var(--color-graphite-700))` }}
    >
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <p className="font-mono text-xs tracking-wide text-slate-400 uppercase">{label}</p>
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-16 w-full" />
        </>
      ) : (
        <>
          <p className="font-mono text-4xl font-medium tracking-tight text-fog-50 tabular-nums">{count}%</p>
          <TrendChart data={trend} color={color} />
        </>
      )}
    </div>
  )
}
