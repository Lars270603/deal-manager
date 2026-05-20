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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } }
}

const itemVariants = {
  hidden:   { opacity: 0, x: -16 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } }
}

export default function Sidebar({ collapsed, onToggle }) {
  const kw   = getCurrentKW()
  const year = getCurrentYear()

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
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
        padding: '0 16px',
        gap: 10,
        height: 60,
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <img
          src={albatrosLogo}
          alt="Albatros"
          style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              Deal Manager
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <motion.nav
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          flex: 1,
          padding: '10px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
        }}
      >
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <motion.div key={to} variants={itemVariants}>
            <NavLink
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <Icon
                      size={18}
                      style={{ color: isActive ? 'var(--accent)' : 'inherit' }}
                    />
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      {/* Footer */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border-subtle)',
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
                background: 'var(--accent-muted)',
                border: '1px solid rgba(91,91,214,0.3)',
                borderRadius: 20,
                fontSize: 11,
                color: 'var(--accent)',
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
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            borderRadius: 4,
          }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={15} />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  )
}
