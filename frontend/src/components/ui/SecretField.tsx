import { useState, type InputHTMLAttributes } from 'react'
import { IconEye, IconEyeOff } from './icons'

interface SecretFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function SecretField({ label, id, name, className = '', ...props }: SecretFieldProps) {
  const [revealed, setRevealed] = useState(false)
  const fieldId = id ?? name

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="font-mono text-xs tracking-wide text-slate-400 uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          name={name}
          type={revealed ? 'text' : 'password'}
          className={`w-full rounded-md border border-graphite-600 bg-graphite-900 px-3 py-2.5 pr-10 text-sm text-fog-50 outline-none transition-colors placeholder:text-slate-500 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setRevealed((current) => !current)}
          aria-label={revealed ? 'Hide value' : 'Reveal value'}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-500 transition-colors hover:text-fog-100"
        >
          {revealed ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
