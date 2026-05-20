import { motion } from 'framer-motion'

export default function SkeletonLoader({ count = 1, height = 20, width = '100%', radius = 6, gap = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
          style={{
            height,
            width,
            background: 'var(--bg-overlay)',
            borderRadius: radius,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}
