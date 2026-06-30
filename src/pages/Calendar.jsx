import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getToday, getNextNDays, getActiveVariant } from '@/lib/utils'
import { BRANDS, BRAND_ORDER } from '@/lib/brands'
import { useListings } from '@/hooks/useListings'
import { useAllVariants } from '@/hooks/useVariants'
import { useMultiDayDealStatus } from '@/hooks/useDealStatus'
import BrandLogo from '@/components/ui/BrandLogo'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

// ─── Calendar Cell ───────────────────────────────────────────────────────────
function CalCell({ listing, dateStr, active, status, onToggle, isToday }) {
  const [hovered, setHovered] = useState(false)

  const isVariantObj = active !== null && typeof active === 'object'
  const isActive = isVariantObj || active === 'aktiv'
  const variantName = isVariantObj ? active.name : active === 'aktiv' ? '✓' : null
  const brandColor = BRANDS[listing.brand]?.color || '#22C55E'

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!isActive) return
    const variantId = isVariantObj ? active.id : null
    onToggle(listing.id, variantId, dateStr, 'submitted')
  }

  return (
    <td
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 58,
        minWidth: 58,
        height: 40,
        padding: '3px 4px',
        background: isToday
          ? (isActive ? `${brandColor}22` : 'rgba(196,30,58,0.02)')
          : isActive ? `${brandColor}18` : '#F5F5F7',
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        verticalAlign: 'middle',
        cursor: isActive ? 'pointer' : 'default',
        transition: 'background 0.12s',
      }}
      onClick={handleToggle}
    >
      {isActive ? (
        <div style={{
          fontSize: 10, color: 'var(--green)', fontWeight: 700,
          lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap',
          textOverflow: 'ellipsis', maxWidth: '100%',
        }}>
          {variantName}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>–</div>
      )}

      {isActive && status?.submitted && (
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          width: 12, height: 12,
          background: 'var(--green)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={7} style={{ color: '#000' }} />
        </div>
      )}

      {hovered && isActive && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '6px 10px',
          whiteSpace: 'nowrap',
          zIndex: 200,
          pointerEvents: 'none',
          fontSize: 11,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {isVariantObj ? active.name : 'Aktiv'}
          </div>
          {isVariantObj && active.asin && (
            <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: 2 }}>
              {active.asin}
            </div>
          )}
        </div>
      )}
    </td>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Calendar() {
  const [brandFilter, setBrandFilter] = useState(null)

  const today = useMemo(() => getToday(), [])
  const days  = useMemo(() => getNextNDays(30), [])

  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing, loading: variantsLoading } = useAllVariants(listingIds)
  const { statusMap, loading: statusLoading, toggleCell } = useMultiDayDealStatus(days)

  const loading = listingsLoading || variantsLoading

  const filtered = useMemo(() => {
    if (!brandFilter) return listings
    return listings.filter(l => l.brand === brandFilter)
  }, [listings, brandFilter])

  const grouped = useMemo(() => {
    const g = {}
    for (const l of filtered) {
      if (!g[l.brand]) g[l.brand] = []
      g[l.brand].push(l)
    }
    return g
  }, [filtered])

  const brandKeys = BRAND_ORDER.filter(b => listings.some(l => l.brand === b))

  const handleToggle = async (listingId, variantId, dateStr, field) => {
    await toggleCell(listingId, variantId, dateStr, field)
    toast.success('Status aktualisiert', { duration: 1500 })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 800, margin: 0 }}
        >
          Rotationskalender
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          <button
            onClick={() => setBrandFilter(null)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: `1px solid ${!brandFilter ? 'var(--accent)' : 'var(--border-default)'}`,
              background: !brandFilter ? 'var(--accent-muted)' : 'var(--bg-elevated)',
              color: !brandFilter ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: !brandFilter ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            Alle Marken
          </button>
          {brandKeys.map(key => {
            const b = BRANDS[key]
            const active = brandFilter === key
            return (
              <button
                key={key}
                onClick={() => setBrandFilter(active ? null : key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8,
                  border: `1px solid ${active ? b.color : 'var(--border-default)'}`,
                  background: active ? `${b.color}18` : 'var(--bg-elevated)',
                  color: active ? b.color : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <img src={b.logo} alt={b.label} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                {b.label}
              </button>
            )
          })}
        </motion.div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)', label: 'Aktiv' },
          { bg: '#F5F5F7', border: 'var(--border-subtle)', label: 'Pause' },
          { bg: 'rgba(196,30,58,0.08)', border: 'rgba(196,30,58,0.2)', label: 'Heute' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 12, background: item.bg, border: `1px solid ${item.border}`, borderRadius: 3 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={7} style={{ color: '#000' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Eingereicht (klickbar)</span>
        </div>
      </div>

      {/* Grid Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{
                  position: 'sticky', left: 0, zIndex: 20,
                  width: 220, minWidth: 220,
                  background: 'var(--bg-surface)',
                  borderRight: '1px solid var(--border-default)',
                  borderBottom: '1px solid var(--border-default)',
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: 11, fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Listing
                </th>
                <AnimatePresence>
                  {days.map((dateStr, i) => {
                    const isT = dateStr === today
                    const d = parseISO(dateStr)
                    return (
                      <motion.th
                        key={dateStr}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.01, duration: 0.2 }}
                        style={{
                          width: 58, minWidth: 58,
                          background: isT ? 'rgba(196,30,58,0.08)' : 'var(--bg-surface)',
                          borderRight: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid var(--border-default)',
                          borderTop: isT ? '2px solid var(--accent)' : '2px solid transparent',
                          padding: '6px 4px 4px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: isT ? 'var(--accent)' : 'var(--text-primary)',
                        }}>
                          {format(d, 'd', { locale: de })}
                        </div>
                        <div style={{ fontSize: 9, color: isT ? 'var(--accent)' : 'var(--text-muted)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {format(d, 'MMM', { locale: de })}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                          {format(d, 'EEE', { locale: de })}
                        </div>
                      </motion.th>
                    )
                  })}
                </AnimatePresence>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={days.length + 1} style={{ padding: 24 }}>
                    <SkeletonLoader count={8} height={40} gap={4} />
                  </td>
                </tr>
              ) : (
                BRAND_ORDER
                  .filter(brand => grouped[brand])
                  .map(brand => (
                    <React.Fragment key={brand}>
                      <tr>
                        <td
                          colSpan={days.length + 1}
                          style={{
                            position: 'sticky', left: 0,
                            background: `${BRANDS[brand].color}10`,
                            borderTop: `1px solid ${BRANDS[brand].color}30`,
                            borderBottom: `1px solid ${BRANDS[brand].color}30`,
                            padding: '7px 14px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={BRANDS[brand].logo} alt={BRANDS[brand].label} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                            <span style={{ fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 700, color: BRANDS[brand].color }}>
                              {BRANDS[brand].label}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {grouped[brand].length} Listings
                            </span>
                          </div>
                        </td>
                      </tr>

                      {grouped[brand].map(listing => (
                        <tr key={listing.id}>
                          <td
                            style={{
                              position: 'sticky', left: 0, zIndex: 5,
                              width: 220, minWidth: 220,
                              background: 'var(--bg-elevated)',
                              borderRight: '1px solid var(--border-default)',
                              borderBottom: '1px solid var(--border-subtle)',
                              padding: '0 14px',
                              height: 40,
                              verticalAlign: 'middle',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <BrandLogo brand={listing.brand} size={16} />
                              <span style={{
                                fontSize: 12, fontWeight: 500,
                                color: 'var(--text-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: 160,
                              }}>
                                {listing.name}
                              </span>
                            </div>
                          </td>

                          {days.map(dateStr => {
                            const isT = dateStr === today
                            const variants = variantsByListing[listing.id] || []
                            const active = getActiveVariant(listing, variants, dateStr)
                            const status = statusMap[`${listing.id}_${dateStr}`] || null
                            return (
                              <CalCell
                                key={`${listing.id}-${dateStr}`}
                                listing={listing}
                                dateStr={dateStr}
                                active={active}
                                status={status}
                                onToggle={handleToggle}
                                isToday={isT}
                              />
                            )
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
