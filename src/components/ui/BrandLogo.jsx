import { BRANDS } from '@/lib/brands'

export default function BrandLogo({ brand, size = 32, className = '', style = {} }) {
  const b = BRANDS[brand]
  if (!b) return null

  return (
    <img
      src={b.logo}
      alt={b.label}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        ...style
      }}
      className={className}
    />
  )
}
