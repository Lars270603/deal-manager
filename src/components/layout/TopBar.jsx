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
      height: 54,
      borderBottom: '1px solid #1A1A25',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      background: '#0F0F18',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'Georgia, serif',
        fontSize: 17,
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '0.01em',
      }}>
        {pageName}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#6B6B8A' }}>
          {format(start, 'd. MMMM', { locale: de })} – {format(end, 'd. MMMM yyyy', { locale: de })}
        </span>
        <span style={{ width: 1, height: 14, background: '#2E2E3E' }} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#C41E3A',
          background: 'rgba(196,30,58,0.1)',
          padding: '3px 9px',
          borderRadius: 20,
          border: '1px solid rgba(196,30,58,0.2)',
          letterSpacing: '0.04em',
        }}>
          KW {kw}
        </span>
      </div>
    </div>
  )
}
