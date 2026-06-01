import { useLocation } from 'react-router-dom'
import { getCurrentKW, getCurrentYear, getKWDateRange } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const PAGE_NAMES = {
  '/':           'Dashboard',
  '/listings':   'Listings',
  '/calendar':   'Kalender',
  '/submission': 'Einreichung',
  '/william':    'William',
  '/profit':     'Gewinn',
}

export default function TopBar() {
  const location = useLocation()
  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const { start, end } = getKWDateRange(kw, year)

  const pageName = PAGE_NAMES[location.pathname] || 'Deal Manager'

  return (
    <div style={{
      height: 56,
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      background: 'var(--bg-surface)',
      flexShrink: 0,
      boxShadow: '0 1px 0 var(--border-subtle)',
    }}>
      <span style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-primary)',
      }}>
        {pageName}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          fontWeight: 500,
          letterSpacing: '0.04em',
        }}>
          {format(start, 'd. MMMM', { locale: de })} – {format(end, 'd. MMMM yyyy', { locale: de })}
        </span>
        <span style={{ width: 1, height: 14, background: 'var(--border-default)' }} />
        <span style={{
          fontSize: 12,
          color: 'var(--accent)',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>
          KW {kw}
        </span>
      </div>
    </div>
  )
}
