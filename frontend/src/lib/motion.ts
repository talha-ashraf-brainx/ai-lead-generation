import type { Transition, Variants } from 'motion/react'

// Shared timing so every panel/drawer/dropdown in the app opens and closes
// with the same feel instead of each component inventing its own duration.
export const EASE_INSTRUMENT: Transition['ease'] = [0.16, 1, 0.3, 1]

export const springPanel: Transition = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }
export const easeFast: Transition = { duration: 0.15, ease: EASE_INSTRUMENT }
export const easeBase: Transition = { duration: 0.22, ease: EASE_INSTRUMENT }

// Snappier, more mechanical spring for direct-manipulation feedback (button
// press, toggle, card hover) — distinct from the panel spring's slower settle.
export const springPress: Transition = { type: 'spring', stiffness: 520, damping: 28, mass: 0.6 }
export const springLayout: Transition = { type: 'spring', stiffness: 380, damping: 34, mass: 0.8 }

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeBase },
  exit: { opacity: 0, transition: easeFast },
}

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: easeBase },
  exit: { opacity: 0, y: -6, transition: easeFast },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: easeBase },
  exit: { opacity: 0, scale: 0.97, y: -4, transition: easeFast },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
  exit: { opacity: 0, transition: easeFast },
}

export const staggerRow: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: easeFast },
}
