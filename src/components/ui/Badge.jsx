export default function Badge({ children, color, style = {} }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: color ? `${color}22` : 'var(--bg-overlay)',
        color: color || 'var(--text-secondary)',
        border: `1px solid ${color ? `${color}44` : 'var(--border-subtle)'}`,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {children}
    </span>
  )
}
