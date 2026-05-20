import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Card({ children, style = {}, onClick, hoverable = false }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => hoverable && setHovered(true)}
      onHoverEnd={() => hoverable && setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
        border: `1px solid ${hovered ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        borderRadius: '12px',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </motion.div>
  )
}
