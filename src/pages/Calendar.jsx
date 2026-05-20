import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCurrentKW, getCurrentYear,
  getNextNWeeks, getKWDateRange, getActiveVariant, formatCurrency
} from '@/lib/utils'
import { BRANDS, BRAND_ORDER } from '@/lib/brands'
import { useListings } from '@/hooks/useListings'
import { useAllVariants } from '@/hooks/useVariants'
import { useMultiWeekDealStatus } from '@/hooks/useDealStatus'
import BrandLogo from '@/components/ui/BrandLogo'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

// ─── Tooltip ────────────────────────────────────────────────────────────────
function Tooltip({ asin, profitDeal }) {
  if (!asin && !profitDeal) return null
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-overlay)',
      border: '1px solid var(--border-default)',
      borderRadius: 8,
      padding: '8px 12px',
      whiteSpace: 'nowrap',
      zIndex: 200,
      pointerEvents: 'none',
      fontSize: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {asin && (
        <div style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{asin}</div>
      )}
      {profitDeal != null && (
        <div style={{ color: 'var(--green)', marginTop: asin ? 3 : 0 }}>
          Deal: {formatCurrency(profitDeal)}
        </div>
      )}
    </div>
  )
}

// ─── Calendar Cell ───────────────────────────────────────────────────────────
function CalCell({ listing, week, active, status, onToggle, isCurrentKW }) {
  const [hovered, setHovered] = useState(false)

  const isVariantObj = active !== null && typeof active === 'object'
  const isActive = isVariantObj || active === 'aktiv'
  const variantName = isVariantObj ? active.name : active === 'aktiv' ? '✓ Aktiv' : null
  const asin = isVariantObj ? active.asin : listing.main_asin
  const profitDeal = isVariantObj ? active.profit_deal : null

  const cellBg = isActive
    ? 'rgba(34,197,94,0.08)'
    : 'transparent'

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!isActive) return
    const variantId = isVariantObj ? active.id : null
    onToggle(listing.id, variantId, week.kw, week.year, 'submitted')
  }

  return (
    <td
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 90,
        minWidth: 90,
        height: 42,
        padding: '4px 6px',
        background: isCurrentKW
          ? (isActive ? 'rgba(91,91,214,0.1)' : 'rgba(91,91,214,0.04)')
          : cellBg,
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        verticalAlign: 'middle',
        cursor: isActive ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onClick={handleToggle}
    >
      {isActive ? (
        <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '100%' }}>
          {variantName}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>–</div>
      )}

      {/* Submitted indicator */}
      {isActive && status?.submitted && (
        <div style={{
          position: 'absolute', bottom: 3, right: 3,
          width: 14, height: 14,
          background: 'var(--green)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={8} style={{ color: '#000' }} />
        </div>
      )}

      {/* Tooltip */}
      {hovered && isActive && (
        <Tooltip asin={asin} profitDeal={profitDeal} />
      )}
    </td>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Calendar() {
  const [brandFilter, setBrandFilter] = useState(null)

  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const weeks = useMemo(() => getNextNWeeks(12), [])

  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing, loading: variantsLoading } = useAllVariants(listingIds)
  const { statusMap, loading: statusLoading, toggleCell } = useMultiWeekDealStatus(weeks)

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

  const brandKeys = BRAND_ORDER.filter(b =>
    listings.some(l => l.brand === b)
  )

  const handleToggle = async (listingId, variantId, cellKw, cellYear, field) => {
    await toggleCell(listingId, variantId, cellKw, cellYear, field)
    toast.success('Status aktualisiert', { duration: 1500 })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, margin: 0 }}
        >
          Rotationskalender
        </motion.h1>

        {/* Brand filter */}
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
          { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', color: 'var(--green)', label: 'Aktiv' },
          { bg: 'transparent', border: 'var(--border-subtle)', color: 'var(--text-muted)', label: 'Pause' },
          { bg: 'rgba(91,91,214,0.1)', border: 'rgba(91,91,214,0.2)', color: 'var(--accent)', label: 'Aktuelle KW' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 12, background: item.bg, border: `1px solid ${item.border}`, borderRadius: 3 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, background: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={8} style={{ color: '#000' }} />
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
            {/* Column header */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {/* Listing name col */}
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
                {/* Week columns */}
                <AnimatePresence>
                  {weeks.map((w, i) => {
                    const isCurrentKW = w.kw === kw && w.year === year
                    const { start } = getKWDateRange(w.kw, w.year)
                    return (
                      <motion.th
                        key={`${w.kw}-${w.year}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        style={{
                          width: 90, minWidth: 90,
                          background: isCurrentKW ? 'rgba(91,91,214,0.12)' : 'var(--bg-surface)',
                          borderRight: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid var(--border-default)',
                          borderTop: isCurrentKW ? '2px solid var(--accent)' : '2px solid transparent',
                          padding: '8px 6px 6px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: isCurrentKW ? 'var(--accent)' : 'var(--text-primary)',
                        }}>
                          KW {w.kw}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {format(start, 'd. MMM', { locale: de })}
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
                  <td colSpan={weeks.length + 1} style={{ padding: 24 }}>
                    <SkeletonLoader count={8} height={42} gap={4} />
                  </td>
                </tr>
              ) : (
                BRAND_ORDER
                  .filter(brand => grouped[brand])
                  .map(brand => (
                    <React.Fragment key={brand}>
                      {/* Brand group row */}
                      <tr>
                        <td
                          colSpan={weeks.length + 1}
                          style={{
                            position: 'sticky', left: 0,
                            background: `${BRANDS[brand].color}10`,
                            borderTop: `1px solid ${BRANDS[brand].color}30`,
                            borderBottom: `1px solid ${BRANDS[brand].color}30`,
                            padding: '8px 14px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img
                              src={BRANDS[brand].logo}
                              alt={BRANDS[brand].label}
                              style={{ width: 20, height: 20, objectFit: 'contain' }}
                            />
                            <span style={{
                              fontFamily: 'Syne', fontSize: 13, fontWeight: 700,
                              color: BRANDS[brand].color,
                            }}>
                              {BRANDS[brand].label}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {grouped[brand].length} Listings
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Listing rows */}
                      {grouped[brand].map(listing => (
                        <tr key={listing.id}>
                          {/* Sticky listing name cell */}
                          <td
                            style={{
                              position: 'sticky', left: 0, zIndex: 5,
                              width: 220, minWidth: 220,
                              background: 'var(--bg-elevated)',
                              borderRight: '1px solid var(--border-default)',
                              borderBottom: '1px solid var(--border-subtle)',
                              padding: '0 14px',
                              height: 42,
                              verticalAlign: 'middle',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <BrandLogo brand={listing.brand} size={18} />
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

                          {/* Week cells */}
                          {weeks.map(w => {
                            const isCurrentKW = w.kw === kw && w.year === year
                            const variants = variantsByListing[listing.id] || []
                            const active = getActiveVariant(listing, variants, w.kw, w.year)
                            const statusKey = `${listing.id}_${w.kw}_${w.year}`
                            const status = statusMap[statusKey] || null

                            return (
                              <CalCell
                                key={`${listing.id}-${w.kw}-${w.year}`}
                                listing={listing}
                                week={w}
                                active={active}
                                status={status}
                                onToggle={handleToggle}
                                isCurrentKW={isCurrentKW}
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
