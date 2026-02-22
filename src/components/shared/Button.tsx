import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-coral text-white hover:bg-coral-dark focus-visible:ring-coral',
  secondary:
    'bg-lavender text-charcoal hover:bg-lavender-dark hover:text-white focus-visible:ring-lavender',
  ghost:
    'bg-transparent border-2 border-coral text-coral hover:bg-coral hover:text-white focus-visible:ring-coral',
  danger:
    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-sm rounded-md',
  md: 'min-h-11 px-5 py-2.5 text-base rounded-lg',
  lg: 'min-h-[52px] px-6 py-3 text-lg rounded-lg',
  xl: 'min-h-[60px] px-8 py-4 text-xl rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-display font-semibold',
        'transition-colors duration-150',
        'btn-bounce',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin"
        />
      )}
      {children}
    </button>
  )
}
