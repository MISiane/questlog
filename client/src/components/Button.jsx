const VARIANTS = {
  primary:
    'bg-gold text-bg hover:brightness-110 active:brightness-95 border-transparent',
  secondary:
    'bg-surface text-text border-border-strong hover:bg-surface-hover',
  ghost:
    'bg-transparent text-text-muted border-transparent hover:text-text hover:bg-surface-hover',
  danger:
    'bg-transparent text-hp border-hp-dim hover:bg-surface-hover',
  arcane:
    'bg-arcane text-bg hover:brightness-110 active:brightness-95 border-transparent',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 border font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}