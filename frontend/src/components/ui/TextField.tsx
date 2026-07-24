import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, name, className = '', ...props }: TextFieldProps) {
  const fieldId = id ?? name
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="font-mono text-xs uppercase tracking-wide text-slate-400">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        className={`rounded-md border bg-graphite-900 px-3 py-2.5 text-sm text-fog-50 outline-none transition-colors placeholder:text-slate-500 focus:border-primary ${
          error ? 'border-temp-hot' : 'border-graphite-600'
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-xs text-temp-hot">{error}</p>}
    </div>
  )
}
