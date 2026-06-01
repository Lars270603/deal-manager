import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, CalendarDays, CheckSquare,
  Megaphone, TrendingUp, ChevronLeft
} from 'lucide-react'
import { getCurrentKW, getCurrentYear } from '@/lib/utils'
import albatrosLogo from '@/assets/brands/albatros.png'

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/listings',   icon: Package,         label: 'Listings' },
  { to: '/calendar',   icon: CalendarDays,    label: 'Kalender' },
  { to: '/submission', icon: CheckSquare,     label: 'Einreichung' },
  { to: '/william',    icon: Megaphone,       label: 'William' },
  { to: '/profit',     icon: TrendingUp,      label: 'Gewinn' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const [hoveredItem, setHoveredItem] = useState(null)

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        background: '#08080D',
        borderRight: '1px solid #1A1A25',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 10,
        height: 60,
        borderBottom: '1px solid #1A1A25',
        flexShrink: 0,
      }}>
        <img
          src={albatrosLogo}
          alt="Albatros"
          style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 13, color: '#F2F2F5', lineHeight: 1.2 }}>
                Deal Manager
              </div>
              <div style={{ fontSize: 10, color: '#6B6B8A', lineHeight: 1.2, marginTop: 1 }}>
                Albatros Int.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '8px 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflowY: 'auto',
      }}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <div
            key={to}
            onMouseEnter={() => setHoveredItem(to)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <NavLink
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 7,
                textDecoration: 'none',
                color: isActive ? '#C41E3A' : hoveredItem === to ? '#D0D0E0' : '#A0A0C0',
                background: isActive
                  ? 'rgba(196,30,58,0.08)'
                  : hoveredItem === to ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderLeft: isActive ? '3px solid #C41E3A' : '3px solid transparent',
                transition: 'color 0.15s, background 0.15s',
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <Icon
                      size={17}
                      style={{ color: isActive ? '#C41E3A' : hoveredItem === to ? '#D0D0E0' : '#A0A0C0', transition: 'color 0.15s' }}
                    />
                  </div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '10px 8px',
        borderTop: '1px solid #1A1A25',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
        flexShrink: 0,
      }}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '3px 10px',
                background: 'rgba(196,30,58,0.1)',
                border: '1px solid rgba(196,30,58,0.2)',
                borderRadius: 20,
                fontSize: 11,
                color: '#C41E3A',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              KW {kw} · {year}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          title={collapsed ? 'Ausklappen' : 'Einklappen'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#6B6B8A',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            borderRadius: 4,
          }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronLeft size={15} />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  )
}
