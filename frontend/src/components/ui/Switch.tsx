interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className={`flex items-center gap-2.5 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5.5 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-graphite-600'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4.5' : ''}`}
        />
      </button>
      {label && <span className="text-sm text-fog-100">{label}</span>}
    </label>
  )
}
