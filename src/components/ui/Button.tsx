import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover border border-primary',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-subtle',
  ghost: 'text-muted hover:text-ink hover:bg-subtle border border-transparent',
  danger: 'bg-surface text-danger border border-danger/40 hover:bg-danger-soft',
}

// 44px tall touch targets on phones/tablets, tighter on desktop.
const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4 md:min-h-9 md:px-3.5',
  sm: 'min-h-10 px-3 md:min-h-8 md:px-2.5 text-[13px]',
}

export function buttonClass(variant: Variant = 'secondary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', icon, className = '', children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}

interface LinkButtonProps extends LinkProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function LinkButton({ variant = 'secondary', size = 'md', icon, className = '', children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
