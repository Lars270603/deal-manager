import { motion } from 'framer-motion'

export default function Button({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
  type = 'button',
  style = {},
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '13px' },
    lg: { padding: '10px 20px', fontSize: '14px' },
  }

  const variants = {
    default: {
      background: 'var(--bg-overlay)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
    },
    primary: {
      background: 'var(--accent)',
      color: '#fff',
      boxShadow: '0 1px 2px rgba(196,30,58,0.3)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
    danger: {
      background: 'var(--red-muted)',
      color: 'var(--red)',
      border: '1px solid rgba(239,68,68,0.2)',
    },
    success: {
      background: 'var(--green-muted)',
      color: 'var(--green)',
      border: '1px solid rgba(34,197,94,0.2)',
    },
    warning: {
      background: 'var(--yellow-muted)',
      color: 'var(--yellow)',
      border: '1px solid rgba(245,158,11,0.2)',
    },
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
