import { IconCheck } from '../ui/icons'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                  isCurrent
                    ? 'bg-primary text-white'
                    : isComplete
                      ? 'bg-primary/20 text-primary'
                      : 'border border-graphite-600 text-slate-500'
                }`}
              >
                {isComplete ? <IconCheck className="h-3.5 w-3.5" /> : stepNumber}
              </span>
              <span className={`hidden text-sm sm:inline ${isCurrent ? 'font-medium text-fog-50' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {stepNumber < steps.length && <span className="mx-2 h-px flex-1 bg-graphite-700" />}
          </li>
        )
      })}
    </ol>
  )
}
