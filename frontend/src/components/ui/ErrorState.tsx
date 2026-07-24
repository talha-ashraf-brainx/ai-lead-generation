import { motion } from 'motion/react'
import { fadeIn } from '../../lib/motion'
import { Button } from './Button'
import { IconAlertTriangle } from './icons'

interface ErrorStateProps {
  title?: string
  description: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-temp-hot/30 bg-temp-hot/5 px-6 py-16 text-center"
    >
      <IconAlertTriangle className="h-8 w-8 text-temp-hot" />
      <p className="font-display text-base font-medium text-fog-50">{title}</p>
      <p className="max-w-sm text-sm text-slate-400">{description}</p>
      {onRetry && (
        <Button variant="ghost" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </motion.div>
  )
}
