import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import splashBg from '@/assets/splash.jpg'

function BirdSVG() {
  return (
    <svg viewBox="0 0 120 42" width="96" height="34">
      <g fill="#C41E3A" style={{ filter: 'drop-shadow(0 0 7px rgba(196,30,58,0.8))' }}>
        {/* Left wing */}
        <path d="M60,21 C48,5 28,10 3,17 C22,14 44,19 56,21 Z" />
        {/* Right wing */}
        <path d="M60,21 C72,5 92,10 117,17 C98,14 76,19 64,21 Z" />
        {/* Body */}
        <ellipse cx="60" cy="22" rx="6" ry="4" />
        {/* Tail */}
        <path d="M54,23 Q60,34 66,23" strokeWidth="0" />
        {/* Beak/head */}
        <path d="M66,20 C72,18 80,19 84,21 L78,23 Z" />
      </g>
    </svg>
  )
}

export default function SplashScreen({ onExitComplete }) {
  const [visible, setVisible] = useState(true)
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible && (
        <motion.div
          key="splash"
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Background image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${splashBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#04040C',
            }}
          />

          {/* Dark overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(4,4,12,0.55)',
          }} />

          {/* Bird */}
          <motion.div
            initial={{ x: -200, y: 0 }}
            animate={{
              x: screenW + 200,
              y: [0, 15, 0, -15, 0, 15, 0, -15, 0],
            }}
            transition={{
              x: { delay: 0.8, duration: 1.0, ease: 'linear' },
              y: { delay: 0.8, duration: 1.0, ease: 'linear' },
            }}
            style={{
              position: 'absolute',
              top: 'calc(62% - 17px)',
              left: 0,
              zIndex: 2,
            }}
          >
            <BirdSVG />
          </motion.div>

          {/* Trail / progress line */}
          <div style={{
            position: 'absolute',
            top: '62%',
            left: '10%',
            width: '80%',
            height: '2px',
            overflow: 'hidden',
            zIndex: 1,
          }}>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 1.0, ease: 'linear' }}
              style={{
                height: '100%',
                width: '100%',
                background: '#C41E3A',
                transformOrigin: 'left center',
                boxShadow: '0 0 8px rgba(196,30,58,0.55)',
              }}
            />
          </div>

          {/* Title block */}
          <div style={{
            position: 'absolute',
            bottom: '26%',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            zIndex: 2,
          }}>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 52,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.15em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              Deal Manager
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.6, ease: 'easeOut' }}
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.3em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              by Albatros International
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
