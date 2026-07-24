import type { SelectHTMLAttributes } from 'react'
import { IconChevronDown } from './icons'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, id, name, className = '', children, ...props }: SelectProps) {
  const fieldId = id ?? name
  const select = (
    <div className="relative">
      <select
        id={fieldId}
        name={name}
        className={`w-full appearance-none rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 pr-9 text-sm text-fog-50 outline-none transition-colors focus:border-primary ${className}`}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  )

  if (!label) return select

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="font-mono text-xs tracking-wide text-slate-400 uppercase">
        {label}
      </label>
      {select}
    </div>
  )
}
