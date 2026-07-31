import type { ReactNode } from 'react'

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-graphite-700 bg-graphite-900 p-5">
      <div>
        <h3 className="font-display text-base font-medium text-fog-50">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {children}
    </section>
  )
}
