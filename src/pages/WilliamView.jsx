import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO, addDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getToday, getActiveVariant, copyToClipboard } from '@/lib/utils'
import { useListings } from '@/hooks/useListings'
import { useAllVariants } from '@/hooks/useVariants'
import { useDealStatus } from '@/hooks/useDealStatus'
import BrandLogo from '@/components/ui/BrandLogo'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e) => {
    e.stopPropagation()
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      toast.success('ASIN kopiert!')
      setTimeout(() => setCopied(false), 2000)
    }
  }
  return (
    <button
      onClick={handleCopy}
      title="ASIN kopieren"
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: copied ? 'var(--green)' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 4,
        transition: 'color 0.15s',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

function DealCard({ listing, active, status, onToggleAds, dim = false }) {
  const asin = typeof active === 'object' ? active.asin : listing.main_asin
  const variantName = typeof active === 'object' ? active.name : 'Aktiv'

  return (
    <motion.div
      layout
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${status?.ads_active ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: '16px 18px',
        opacity: dim ? 0.55 : 1,
        transition: 'border-color 0.2s, opacity 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <BrandLogo brand={listing.brand} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {listing.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
            {variantName}
          </div>
        </div>
      </div>

      {asin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <code style={{
            fontSize: 14, fontFamily: 'monospace', fontWeight: 700,
            color: 'var(--text-primary)', background: 'var(--bg-overlay)',
            padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-default)',
            flex: 1, letterSpacing: '0.05em',
          }}>
            {asin}
          </code>
          <CopyButton text={asin} />
        </div>
      )}

      {!dim && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <motion.input
            type="checkbox"
            checked={status?.ads_active || false}
            onChange={() => onToggleAds(listing.id, typeof active === 'object' ? active.id : null, status?.ads_active || false)}
            style={{ accentColor: 'var(--green)', width: 15, height: 15, cursor: 'pointer' }}
          />
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: status?.ads_active ? 'var(--green)' : 'var(--text-muted)',
            transition: 'color 0.15s',
          }}>
            {status?.ads_active ? '✓ Ads geschaltet' : 'Ads schalten'}
          </span>
        </label>
      )}
    </motion.div>
  )
}

export default function WilliamView() {
  const today    = getToday()
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const todayLabel    = format(parseISO(today), 'd. MMMM yyyy', { locale: de })
  const tomorrowLabel = format(parseISO(tomorrow), 'd. MMMM', { locale: de })

  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing } = useAllVariants(listingIds)
  const { dealStatus, loading: statusLoading, toggleAdsActive } = useDealStatus(today)

  const loading = listingsLoading || statusLoading

  const todayActive = useMemo(() =>
    listings
      .map(l => {
        const active = getActiveVariant(l, variantsByListing[l.id] || [], today)
        return active && active !== 'pause' ? { listing: l, active } : null
      })
      .filter(Boolean)
  , [listings, variantsByListing, today])

  const tomorrowActive = useMemo(() =>
    listings
      .map(l => {
        const active = getActiveVariant(l, variantsByListing[l.id] || [], tomorrow)
        return active && active !== 'pause' ? { listing: l, active } : null
      })
      .filter(Boolean)
  , [listings, variantsByListing, tomorrow])

  const adsActive = dealStatus.filter(s => s.ads_active).length
  const total     = todayActive.length
  const allDone   = total > 0 && adsActive === total

  useEffect(() => {
    if (allDone) {
      toast.success('William ist informiert 🎯', { duration: 4000 })
    }
  }, [allDone])

  const getStatus = (listingId) => dealStatus.find(s => s.listing_id === listingId) || null

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          Ads Briefing
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
          {todayLabel}
        </p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: allDone ? 'var(--green)' : 'var(--text-primary)' }}>
              {allDone ? '✓ Alle Ads geschaltet!' : `${adsActive} von ${total} Ads geschaltet`}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {total > 0 ? Math.round((adsActive / total) * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-overlay)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: total > 0 ? `${(adsActive / total) * 100}%` : '0%' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ height: '100%', background: allDone ? 'var(--green)' : 'var(--accent)', borderRadius: 3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Heute */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{
              fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 700,
              color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
            }}>
              Heute — Jetzt schalten
            </h2>
          </div>
          {loading ? (
            <SkeletonLoader count={4} height={100} gap={10} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayActive.map(({ listing, active }) => (
                <DealCard
                  key={listing.id}
                  listing={listing}
                  active={active}
                  status={getStatus(listing.id)}
                  onToggleAds={toggleAdsActive}
                />
              ))}
              {todayActive.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine aktiven Deals heute</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Morgen */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{
              fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 700,
              color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
            }}>
              Morgen — Vorbereiten ({tomorrowLabel})
            </h2>
          </div>
          {loading ? (
            <SkeletonLoader count={4} height={100} gap={10} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tomorrowActive.map(({ listing, active }) => (
                <DealCard
                  key={listing.id}
                  listing={listing}
                  active={active}
                  status={null}
                  onToggleAds={() => {}}
                  dim
                />
              ))}
              {tomorrowActive.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine geplanten Deals morgen</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
