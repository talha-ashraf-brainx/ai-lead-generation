import type { ReactNode } from 'react'
import { IconInbox } from './icons'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-graphite-600 px-6 py-16 text-center">
      <span className="text-slate-500">{icon ?? <IconInbox className="h-8 w-8" />}</span>
      <p className="font-display text-base font-medium text-fog-50">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
