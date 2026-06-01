import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { getCurrentKW, getCurrentYear, getKWDateRange, getActiveVariant } from '@/lib/utils'
import { useListings } from '@/hooks/useListings'
import { useAllVariants } from '@/hooks/useVariants'
import { useDealStatus } from '@/hooks/useDealStatus'
import BrandLogo from '@/components/ui/BrandLogo'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import albatrosLogo from '@/assets/brands/albatros.png'

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen.'
  if (h < 18) return 'Guten Tag.'
  return 'Guten Abend.'
}

const cardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
}
const cardItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
}

function StatCard({ label, value, color, loading }) {
  return (
    <motion.div
      variants={cardItem}
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 10,
        padding: '20px 24px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {loading ? (
        <SkeletonLoader height={44} />
      ) : (
        <>
          <div style={{ fontFamily: 'Playfair Display', fontWeight: 800, fontSize: 40, color, lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>
            {label}
          </div>
        </>
      )}
    </motion.div>
  )
}

function WeekList({ entries, dim = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entries.map(({ listing, active }) => (
        <div
          key={listing.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: 'var(--bg-overlay)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            opacity: dim ? 0.7 : 1,
          }}
        >
          <BrandLogo brand={listing.brand} size={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 500,
              color: dim ? 'var(--text-secondary)' : 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {listing.name}
            </div>
            <div style={{ fontSize: 11, color: dim ? 'var(--text-muted)' : 'var(--green)', marginTop: 1 }}>
              {typeof active === 'object' ? active.name : active === 'aktiv' ? '✓ Aktiv' : active}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const nextKW   = kw >= 52 ? 1 : kw + 1
  const nextYear = kw >= 52 ? year + 1 : year

  const { start, end } = getKWDateRange(kw, year)

  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing } = useAllVariants(listingIds)
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

  const nextWeek = listings
    .map(l => ({ listing: l, active: getActiveVariant(l, variantsByListing[l.id] || [], nextKW, nextYear) }))
    .filter(({ active }) => active !== null && active !== 'pause')

  const submitted   = dealStatus.filter(s => s.submitted).length
  const stillToSend = Math.max(0, thisWeek.length - submitted)
  const pendingWilliam = dealStatus.filter(s => s.submitted && !s.ads_active).length

  const stats = [
    { label: 'Aktive Listings',           value: listings.length,  color: 'var(--accent)', loading: listingsLoading },
    { label: 'Deals aktiv diese Woche',    value: thisWeek.length,  color: 'var(--green)',  loading: listingsLoading },
    { label: 'Noch einzureichen',          value: stillToSend,      color: 'var(--yellow)', loading: statusLoading },
    { label: 'Ausstehend bei William',     value: pendingWilliam,   color: 'var(--red)',    loading: statusLoading },
  ]

  return (
    <div>
      {/* Flying Albatros */}
      {albatrosFlying && (
        <motion.div
          initial={{ x: '-15vw', y: '25vh', rotate: 10 }}
          animate={{ x: '115vw', y: '15vh', rotate: -5 }}
          transition={{ duration: 2.8, ease: 'easeInOut' }}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9997, pointerEvents: 'none' }}
        >
          <img
            src={albatrosLogo}
            alt=""
            style={{
              width: 140, height: 140, objectFit: 'contain',
              filter: 'drop-shadow(0 0 24px rgba(196,30,58,0.7))',
            }}
          />
        </motion.div>
      )}

      {/* Hero */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h1 style={{ fontFamily: 'Playfair Display', fontWeight: 800, fontSize: 36, margin: 0, lineHeight: 1 }}>
            {getGreeting()}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '10px 0 0' }}>
            KW {kw} · {format(start, 'd. MMMM', { locale: de })} – {format(end, 'd. MMMM yyyy', { locale: de })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, rotate: -15, scale: 0.9 }}
          animate={{ opacity: 1, rotate: -10, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
          onClick={handleAlbatrosClick}
          title="5× klicken für eine Überraschung"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <img
            src={albatrosLogo}
            alt="Albatros"
            style={{ width: 120, height: 120, objectFit: 'contain', opacity: 0.15 }}
          />
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        variants={cardStagger}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}
      >
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </motion.div>

      {/* Weekly Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Diese Woche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 12,
            padding: 20,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Diese Woche — KW {kw}
          </h3>
          {listingsLoading ? (
            <SkeletonLoader count={5} height={42} gap={6} />
          ) : thisWeek.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine aktiven Deals diese Woche</p>
          ) : (
            <WeekList entries={thisWeek} />
          )}
        </motion.div>

        {/* Nächste Woche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 12,
            padding: 20,
            opacity: 0.65,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Nächste Woche — KW {nextKW}
          </h3>
          {listingsLoading ? (
            <SkeletonLoader count={5} height={42} gap={6} />
          ) : nextWeek.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine geplanten Deals</p>
          ) : (
            <WeekList entries={nextWeek} dim />
          )}
        </motion.div>
      </div>
    </div>
  )
}
