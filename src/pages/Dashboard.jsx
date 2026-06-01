import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  getCurrentKW, getCurrentYear, getKWDateRange,
  getActiveVariant, getNextNWeeks
} from '@/lib/utils'
import { BRANDS } from '@/lib/brands'
import { useListings } from '@/hooks/useListings'
import { useAllVariants } from '@/hooks/useVariants'
import { useDealStatus } from '@/hooks/useDealStatus'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import albatrosLogo from '@/assets/brands/albatros.png'

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen.'
  if (h < 18) return 'Guten Tag.'
  return 'Guten Abend.'
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, borderColor, loading }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E8EE',
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 10,
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {loading ? (
        <SkeletonLoader height={44} />
      ) : (
        <>
          <div style={{
            fontSize: 32, fontWeight: 700, color, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value}
          </div>
          <div style={{
            fontSize: 11, color: '#9090A8', marginTop: 6,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Diese Woche Row ─────────────────────────────────────────────────────────
function WeekRow({ listing, active }) {
  const brand = BRANDS[listing.brand]
  const variantName = typeof active === 'object' ? active.name : 'Aktiv'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0',
      borderBottom: '1px solid #E8E8EE',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: brand.color, flexShrink: 0,
      }} />
      <span style={{
        flex: 1, fontSize: 13, color: '#0A0A14',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {listing.name}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 600,
        padding: '2px 7px', borderRadius: 20,
        background: 'rgba(22,163,74,0.08)', color: '#16A34A',
        border: '1px solid rgba(22,163,74,0.2)', flexShrink: 0,
      }}>
        {variantName}
      </span>
    </div>
  )
}

// ─── 4-Week Calendar Preview ─────────────────────────────────────────────────
function CalendarPreview({ weeks, listings, variantsByListing, kw, year, loading }) {
  const relevant = useMemo(() =>
    listings.filter(l =>
      weeks.some(w => {
        const a = getActiveVariant(l, variantsByListing[l.id] || [], w.kw, w.year)
        return a && a !== 'pause'
      })
    ).slice(0, 10)
  , [listings, variantsByListing, weeks])

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E8EE',
      borderRadius: 10, padding: '14px 16px', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <h3 style={{
        fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 700,
        color: '#0A0A14', margin: '0 0 10px',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Rotation · 4 Wochen
      </h3>

      {loading ? <SkeletonLoader count={4} height={22} gap={4} /> : (
        <>
          {/* Week header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 46px)', gap: 3, marginBottom: 5 }}>
            <div />
            {weeks.map(w => (
              <div key={`h-${w.kw}`} style={{
                textAlign: 'center', fontSize: 10, fontWeight: 700,
                color: w.kw === kw && w.year === year ? '#C41E3A' : '#9090A8',
                letterSpacing: '0.03em',
              }}>
                KW {w.kw}
              </div>
            ))}
          </div>

          {/* Listing rows */}
          {relevant.map(l => {
            const brand = BRANDS[l.brand]
            return (
              <div key={l.id} style={{
                display: 'grid', gridTemplateColumns: '1fr repeat(4, 46px)',
                gap: 3, marginBottom: 3, alignItems: 'center',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  paddingLeft: 6, borderLeft: `3px solid ${brand.color}`,
                }}>
                  <span style={{
                    fontSize: 11, color: '#4A4A6A',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {l.name}
                  </span>
                </div>
                {weeks.map(w => {
                  const active = getActiveVariant(l, variantsByListing[l.id] || [], w.kw, w.year)
                  const isActive = active && active !== 'pause'
                  return (
                    <div key={w.kw} style={{
                      height: 22, borderRadius: 3,
                      background: isActive ? `${brand.color}1A` : '#F0F0F5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isActive && (
                        <span style={{ fontSize: 8, fontWeight: 700, color: brand.color, lineHeight: 1 }}>
                          {typeof active === 'object' && active.name
                            ? active.name.slice(0, 5).toUpperCase()
                            : '✓'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {relevant.length === 0 && (
            <p style={{ fontSize: 12, color: '#9090A8', textAlign: 'center', padding: '10px 0' }}>
              Keine aktiven Deals
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ─── William Briefing ────────────────────────────────────────────────────────
function WilliamBriefing({ kw, thisWeekActive, dealStatus, loading }) {
  const adsActive = dealStatus.filter(s => s.ads_active).length
  const total = thisWeekActive.length
  const pct = total > 0 ? Math.round((adsActive / total) * 100) : 0

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E8EE',
      borderRadius: 10, padding: '14px 16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{
          fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 700,
          color: '#0A0A14', margin: 0,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          William — KW {kw}
        </h3>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#16A34A',
          background: 'rgba(22,163,74,0.08)',
          padding: '2px 8px', borderRadius: 10,
          border: '1px solid rgba(22,163,74,0.2)',
        }}>
          {adsActive}/{total} geschaltet
        </span>
      </div>

      {loading ? <SkeletonLoader count={3} height={26} gap={4} /> : (
        <div>
          {thisWeekActive.slice(0, 8).map(({ listing, active }) => {
            const asin = typeof active === 'object' ? active.asin : listing.main_asin
            const status = dealStatus.find(s => s.listing_id === listing.id)
            const done = status?.ads_active || false

            return (
              <div key={listing.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 0',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: done ? 'none' : '1.5px solid #D8D8E2',
                  background: done ? '#16A34A' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {done && (
                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 800, lineHeight: 1 }}>✓</span>
                  )}
                </div>
                <span style={{
                  flex: 1, fontSize: 12,
                  color: done ? '#9090A8' : '#0A0A14',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {listing.name}
                </span>
                {asin && (
                  <code style={{ fontSize: 10, fontFamily: 'monospace', color: '#9090A8', flexShrink: 0 }}>
                    {asin}
                  </code>
                )}
              </div>
            )
          })}

          {total === 0 && (
            <p style={{ fontSize: 12, color: '#9090A8', padding: '6px 0' }}>Keine aktiven Deals</p>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginTop: 10, height: 3, background: '#E8E8EE', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: '#C41E3A', borderRadius: 2, transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const nextKW   = kw >= 52 ? 1 : kw + 1
  const nextYear = kw >= 52 ? year + 1 : year

  const { start, end } = getKWDateRange(kw, year)
  const calWeeks = useMemo(() => getNextNWeeks(4), [])

  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing, loading: variantsLoading } = useAllVariants(listingIds)
  const { dealStatus, loading: statusLoading } = useDealStatus(kw, year)

  const [albatrosClicks, setAlbatrosClicks] = useState(0)
  const [albatrosFlying, setAlbatrosFlying] = useState(false)

  const handleAlbatrosClick = () => {
    const n = albatrosClicks + 1
    setAlbatrosClicks(n)
    if (n >= 5) {
      setAlbatrosFlying(true)
      setAlbatrosClicks(0)
      setTimeout(() => setAlbatrosFlying(false), 3200)
    }
  }

  const thisWeek = listings
    .map(l => ({ listing: l, active: getActiveVariant(l, variantsByListing[l.id] || [], kw, year) }))
    .filter(({ active }) => active !== null && active !== 'pause')

  const submitted      = dealStatus.filter(s => s.submitted).length
  const stillToSend    = Math.max(0, thisWeek.length - submitted)
  const pendingWilliam = dealStatus.filter(s => s.submitted && !s.ads_active).length

  const loading = listingsLoading || variantsLoading

  const stats = [
    { label: 'Aktive Listings',   value: listings.length, color: '#0A0A14', borderColor: '#C41E3A', loading: listingsLoading },
    { label: 'Deals diese Woche', value: thisWeek.length, color: '#16A34A', borderColor: '#16A34A', loading: listingsLoading },
    { label: 'Einzureichen',      value: stillToSend,     color: '#D97706', borderColor: '#D97706', loading: statusLoading },
    { label: 'William offen',     value: pendingWilliam,  color: '#1D6FD8', borderColor: '#1D6FD8', loading: statusLoading },
  ]

  return (
    <div>
      {/* Easter Egg */}
      {albatrosFlying && (
        <motion.div
          initial={{ x: '-15vw', y: '25vh', rotate: 10 }}
          animate={{ x: '115vw', y: '15vh', rotate: -5 }}
          transition={{ duration: 2.8, ease: 'easeInOut' }}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9997, pointerEvents: 'none' }}
        >
          <img src={albatrosLogo} alt="" style={{
            width: 140, height: 140, objectFit: 'contain',
            filter: 'drop-shadow(0 0 24px rgba(196,30,58,0.5))',
          }} />
        </motion.div>
      )}

      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.38 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 34, margin: 0, color: '#0A0A14', lineHeight: 1.15 }}>
            {getGreeting()}
          </h1>
          <p style={{ fontSize: 13, color: '#9090A8', margin: '8px 0 0', lineHeight: 1.6 }}>
            KW {kw} · {format(start, 'd. MMMM', { locale: de })} – {format(end, 'd. MMMM yyyy', { locale: de })}
            {!listingsLoading && ` · ${thisWeek.length} Deals aktiv`}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, rotate: -15, scale: 0.9 }}
          animate={{ opacity: 1, rotate: -10, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          onClick={handleAlbatrosClick}
          title="5× klicken für eine Überraschung"
          style={{ cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
        >
          <img src={albatrosLogo} alt="" style={{ width: 100, height: 100, objectFit: 'contain', opacity: 0.1 }} />
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}
      >
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </motion.div>

      {/* 2-Column Layout */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}
      >
        {/* Left: Diese Woche */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #E8E8EE',
          borderRadius: 10, padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{
            fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 700,
            color: '#0A0A14', margin: '0 0 10px',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Diese Woche — KW {kw}
          </h3>
          {listingsLoading ? (
            <SkeletonLoader count={5} height={36} gap={4} />
          ) : thisWeek.length === 0 ? (
            <p style={{ color: '#9090A8', fontSize: 13 }}>Keine aktiven Deals diese Woche</p>
          ) : (
            thisWeek.map(({ listing, active }) => (
              <WeekRow key={listing.id} listing={listing} active={active} />
            ))
          )}
        </div>

        {/* Right: Calendar + William stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CalendarPreview
            weeks={calWeeks}
            listings={listings}
            variantsByListing={variantsByListing}
            kw={kw}
            year={year}
            loading={loading}
          />
          <WilliamBriefing
            kw={kw}
            thisWeekActive={thisWeek}
            dealStatus={dealStatus}
            loading={statusLoading}
          />
        </div>
      </motion.div>
    </div>
  )
}
