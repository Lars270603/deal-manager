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
        background: 'var(--bg-elevated)',
        borderRadius: '12px',
        boxShadow: hovered
          ? '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)'
          : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </motion.div>
  )
}
