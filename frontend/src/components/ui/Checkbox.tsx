import type { InputHTMLAttributes } from 'react'
import { IconCheck } from './icons'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
}

export function Checkbox({ checked, indeterminate, className = '', ...props }: CheckboxProps) {
  return (
    <span className={`relative inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate && !checked
        }}
        className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded border border-graphite-600 bg-graphite-900 checked:border-primary checked:bg-primary"
        {...props}
      />
      <IconCheck className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
    </span>
  )
}
