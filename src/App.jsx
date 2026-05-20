import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Listings from '@/pages/Listings'
import Calendar from '@/pages/Calendar'
import Submission from '@/pages/Submission'
import WilliamView from '@/pages/WilliamView'
import Profit from '@/pages/Profit'
import albatrosLogo from '@/assets/brands/albatros.png'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<motion.div key="/" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Dashboard /></motion.div>} />
        <Route path="/listings"   element={<motion.div key="/listings" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Listings /></motion.div>} />
        <Route path="/calendar"   element={<motion.div key="/calendar" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Calendar /></motion.div>} />
        <Route path="/submission" element={<motion.div key="/submission" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Submission /></motion.div>} />
        <Route path="/william"    element={<motion.div key="/william" variants={pageVariants} initial="initial" animate="animate" exit="exit"><WilliamView /></motion.div>} />
        <Route path="/profit"     element={<motion.div key="/profit" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Profit /></motion.div>} />
      </Routes>
    </AnimatePresence>
  )
}

function KonamiOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="konami"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(8,8,14,0.96)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, gap: 32,
          }}
        >
          <motion.img
            src={albatrosLogo}
            alt="Albatros"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: 'Syne', fontSize: 52, fontWeight: 800,
              color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.1,
            }}
          >
            Albatros International 🌊
          </motion.h1>
          <div style={{ width: '60%', overflow: 'hidden' }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2 + i * 0.6, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
                style={{
                  height: 3,
                  background: `linear-gradient(90deg, transparent, var(--accent), transparent)`,
                  marginBottom: 8,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AppInner() {
  const [konamiActive, setKonamiActive] = useState(false)
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']
  const posRef = useRef(0)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === KONAMI[posRef.current]) {
        posRef.current++
        if (posRef.current === KONAMI.length) {
          setKonamiActive(true)
          posRef.current = 0
          setTimeout(() => setKonamiActive(false), 4000)
        }
      } else {
        posRef.current = e.key === KONAMI[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <KonamiOverlay active={konamiActive} />
      <Layout>
        <AnimatedRoutes />
      </Layout>
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-overlay)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
          },
          success: {
            iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-overlay)' }
          },
          error: {
            iconTheme: { primary: 'var(--red)', secondary: 'var(--bg-overlay)' }
          },
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/deal-manager">
      <AppInner />
    </BrowserRouter>
  )
}
