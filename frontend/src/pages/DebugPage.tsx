import { useEffect, useState } from 'react'
import { fetchDebugLog, type DebugLogEntry } from '../lib/api/debug'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { IconBug, IconRefresh } from '../components/ui/icons'

const POLL_INTERVAL_MS = 5000

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour12: false })
}

function LevelBadge({ level }: { level: DebugLogEntry['level'] }) {
  const className =
    level === 'error'
      ? 'border-temp-hot/40 bg-temp-hot/10 text-temp-hot'
      : 'border-temp-warm/40 bg-temp-warm/10 text-temp-warm'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-xs uppercase ${className}`}>
      {level}
    </span>
  )
}

export function DebugPage() {
  const [entries, setEntries] = useState<DebugLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    function load() {
      fetchDebugLog().then((result) => {
        if (!cancelled) {
          setEntries(result)
          setIsLoading(false)
        }
      })
    }
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-medium text-fog-50">
            <IconBug className="h-5 w-5 text-slate-400" />
            Debug log
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Rate limits, provider failures, and other warnings/errors from the last {entries.length} events. Polls every
            5s.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setIsLoading(true)
            fetchDebugLog().then((result) => {
              setEntries(result)
              setIsLoading(false)
            })
          }}
          className="gap-1.5"
        >
          <IconRefresh className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<IconBug className="h-8 w-8" />}
          title="No warnings or errors yet"
          description="Rate-limit hits, API failures, and similar events will show up here as they happen."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="rounded-lg border border-graphite-700 bg-graphite-900 p-4">
                <div className="flex items-center gap-3">
                  <LevelBadge level={entry.level} />
                  <span className="font-mono text-xs text-slate-500">{formatTime(entry.timestamp)}</span>
                </div>
                <p className="mt-2 text-sm text-fog-100">{entry.message}</p>
                {entry.meta && Object.keys(entry.meta).length > 0 && (
                  <pre className="mt-2 overflow-x-auto rounded-md bg-graphite-950 p-3 font-mono text-xs text-slate-400">
                    {JSON.stringify(entry.meta, null, 2)}
                  </pre>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
