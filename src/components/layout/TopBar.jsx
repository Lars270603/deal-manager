import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const PAGE_NAMES = {
  '/':           'Dashboard',
  '/listings':   'Listings',
  '/calendar':   'Kalender',
  '/submission': 'Einreichung',
  '/william':    'William',
}

export default function TopBar() {
  const location = useLocation()
  const today = new Date()
  const pageName = PAGE_NAMES[location.pathname] || 'Deal Manager'

  return (
    <div style={{
      height: 54,
      borderBottom: '1px solid #E8E8EE',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      background: '#FFFFFF',
      flexShrink: 0,
      boxShadow: '0 1px 0 #E8E8EE',
    }}>
      <span style={{
        fontFamily: 'Georgia, serif',
        fontSize: 17,
        fontWeight: 700,
        color: '#0A0A14',
        letterSpacing: '0.01em',
      }}>
        {pageName}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#9090A8' }}>
          {format(today, 'EEEE, d. MMMM yyyy', { locale: de })}
        </span>
      </div>
    </div>
  )
}
