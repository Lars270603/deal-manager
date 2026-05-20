import { getCurrentKW, getCurrentYear, getKWDateRange } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default function TopBar() {
  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const { start, end } = getKWDateRange(kw, year)

  return (
    <div style={{
      height: 48,
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      background: 'var(--bg-surface)',
      flexShrink: 0,
      gap: 16,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        KW {kw}
      </span>
      <span style={{ width: 1, height: 14, background: 'var(--border-default)' }} />
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {format(start, 'd. MMMM', { locale: de })} – {format(end, 'd. MMMM yyyy', { locale: de })}
      </span>
    </div>
  )
}
