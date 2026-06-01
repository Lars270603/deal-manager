import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCurrentKW, getCurrentYear, getKWDateRange, getActiveVariant, copyToClipboard, formatCurrency } from '@/lib/utils'
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
  const profitDeal = typeof active === 'object' ? active.profit_deal : null

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
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {listing.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
            {variantName}
          </div>
        </div>
        {profitDeal != null && (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>
            {formatCurrency(profitDeal)}
          </div>
        )}
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
  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const nextKW   = kw >= 52 ? 1 : kw + 1
  const nextYear = kw >= 52 ? year + 1 : year
  const { start, end }         = getKWDateRange(kw, year)
  const { start: nextStart }   = getKWDateRange(nextKW, nextYear)
  const { start: nextEnd }     = getKWDateRange(nextKW, nextYear)

  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing } = useAllVariants(listingIds)
  const { dealStatus, loading: statusLoading, toggleAdsActive } = useDealStatus(kw, year)

  const loading = listingsLoading || statusLoading

  const thisWeekActive = listings
    .map(l => {
      const active = getActiveVariant(l, variantsByListing[l.id] || [], kw, year)
      return active && active !== 'pause' ? { listing: l, active } : null
    })
    .filter(Boolean)

  const nextWeekActive = listings
    .map(l => {
      const active = getActiveVariant(l, variantsByListing[l.id] || [], nextKW, nextYear)
      return active && active !== 'pause' ? { listing: l, active } : null
    })
    .filter(Boolean)

  const adsActive = dealStatus.filter(s => s.ads_active).length
  const total     = thisWeekActive.length
  const allDone   = total > 0 && adsActive === total

  // Toast when all ads are set
  useEffect(() => {
    if (allDone) {
      toast.success('William ist informiert 🎯', { duration: 4000 })
    }
  }, [allDone])

  const getStatus = (listingId) => dealStatus.find(s => s.listing_id === listingId) || null

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, margin: 0 }}>
          Ads Briefing · KW {kw}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
          {format(start, 'd. MMMM', { locale: de })} – {format(end, 'd. MMMM yyyy', { locale: de })}
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
        {/* Diese Woche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Diese Woche — Jetzt schalten
            </h2>
          </div>
          {loading ? (
            <SkeletonLoader count={4} height={100} gap={10} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {thisWeekActive.map(({ listing, active }) => (
                <DealCard
                  key={listing.id}
                  listing={listing}
                  active={active}
                  status={getStatus(listing.id)}
                  onToggleAds={toggleAdsActive}
                />
              ))}
              {thisWeekActive.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine aktiven Deals diese Woche</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Nächste Woche */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              Nächste Woche — Vorbereiten (KW {nextKW})
            </h2>
          </div>
          {loading ? (
            <SkeletonLoader count={4} height={100} gap={10} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nextWeekActive.map(({ listing, active }) => (
                <DealCard
                  key={listing.id}
                  listing={listing}
                  active={active}
                  status={null}
                  onToggleAds={() => {}}
                  dim
                />
              ))}
              {nextWeekActive.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine geplanten Deals</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
