import type { ButtonHTMLAttributes } from 'react'
import { motion } from 'motion/react'
import { springPress } from '../../lib/motion'

type ButtonVariant = 'primary' | 'ghost'

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant
  isLoading?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-[0_0_0_0_rgba(62,111,217,0)] hover:bg-primary-hover hover:shadow-[0_0_20px_-4px_rgba(62,111,217,0.6)]',
  ghost: 'border border-graphite-600 bg-transparent text-fog-100 hover:bg-graphite-800',
}

export function Button({
  variant = 'primary',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      whileHover={isDisabled ? undefined : { y: -1 }}
      transition={springPress}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 font-body text-sm font-medium transition-[background-color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? 'Please wait…' : children}
    </motion.button>
  )
}
