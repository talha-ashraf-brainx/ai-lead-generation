import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { springPanel } from '../../lib/motion'
import { IconX } from './icons'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-graphite-950/60"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={springPanel}
            className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-graphite-700 bg-graphite-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-graphite-700 px-6 py-4">
              <h2 className="font-display text-lg font-medium text-fog-50">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-graphite-800 hover:text-fog-100"
              >
                <IconX className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
