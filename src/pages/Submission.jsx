import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import {
  getCurrentKW, getCurrentYear, getKWDateRange,
  getActiveVariant, copyToClipboard
} from '@/lib/utils'
import { useListings } from '@/hooks/useListings'
import { useAllVariants } from '@/hooks/useVariants'
import { useDealStatus, fetchHistoricStatus } from '@/hooks/useDealStatus'
import BrandLogo from '@/components/ui/BrandLogo'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { BRANDS } from '@/lib/brands'

function CopyCell({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = async (e) => {
    e.stopPropagation()
    const ok = await copyToClipboard(text)
    if (ok) { setCopied(true); toast.success('Kopiert!'); setTimeout(() => setCopied(false), 2000) }
  }
  if (!text) return <span style={{ color: 'var(--text-muted)' }}>–</span>
  return (
    <button
      onClick={handle}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        color: 'var(--text-primary)', padding: 0,
        fontFamily: 'monospace', fontSize: 13,
      }}
    >
      <span>{text}</span>
      {copied ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} style={{ color: 'var(--text-muted)' }} />}
    </button>
  )
}

function SubmitButton({ submitted, onClick, loading }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileTap={{ scale: 0.93 }}
      animate={submitted ? {
        scale: [1, 1.18, 0.95, 1.05, 1],
        transition: { duration: 0.5 }
      } : {}}
      style={{
        padding: '6px 16px',
        borderRadius: 8,
        cursor: loading ? 'default' : 'pointer',
        fontWeight: 600,
        fontSize: 12,
        background: submitted ? 'var(--green-muted)' : 'var(--yellow-muted)',
        color: submitted ? 'var(--green)' : 'var(--yellow)',
        border: `1px solid ${submitted ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
        transition: 'background 0.2s, color 0.2s',
        minWidth: 120,
        opacity: loading ? 0.7 : 1,
        fontFamily: 'inherit',
      }}
    >
      {submitted ? '✓ Eingereicht' : 'Einreichen'}
    </motion.button>
  )
}

// Past 8 weeks for history
function getPastWeeks(n = 8) {
  const weeks = []
  const kw   = getCurrentKW()
  const year = getCurrentYear()
  for (let i = 1; i <= n; i++) {
    let w = kw - i
    let y = year
    if (w <= 0) { w += 52; y -= 1 }
    weeks.push({ kw: w, year: y })
  }
  return weeks
}

function HistoryAccordion({ week, listings, variantsByListing, statusByListing }) {
  const [open, setOpen] = useState(false)
  const { start, end } = getKWDateRange(week.kw, week.year)

  const activeEntries = listings
    .map(l => {
      const active = getActiveVariant(l, variantsByListing[l.id] || [], week.kw, week.year)
      const status = statusByListing[l.id]
      return active && active !== 'pause' ? { listing: l, active, status } : null
    })
    .filter(Boolean)

  const submitted = activeEntries.filter(e => e.status?.submitted).length
  const pct = activeEntries.length > 0 ? Math.round((submitted / activeEntries.length) * 100) : 0

  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'var(--bg-elevated)', border: 'none',
          cursor: 'pointer', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          color: 'var(--text-primary)', fontFamily: 'inherit',
        }}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 14 }}>KW {week.kw} · {week.year}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {format(start, 'd. MMM', { locale: de })} – {format(end, 'd. MMM', { locale: de })}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ height: 4, width: 80, background: 'var(--bg-overlay)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: pct === 100 ? 'var(--green)' : 'var(--text-secondary)', minWidth: 40 }}>
            {submitted}/{activeEntries.length}
          </span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {activeEntries.map(({ listing, active, status }) => {
                const asin = typeof active === 'object' ? active.asin : listing.main_asin
                return (
                  <div key={listing.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    <BrandLogo brand={listing.brand} size={20} />
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{listing.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{asin || '–'}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: status?.submitted ? 'var(--green)' : 'var(--text-muted)',
                      padding: '2px 8px', borderRadius: 20,
                      background: status?.submitted ? 'var(--green-muted)' : 'transparent',
                    }}>
                      {status?.submitted ? '✓ Eingereicht' : 'Nicht eingereicht'}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Submission() {
  const [activeTab, setActiveTab] = useState('current')
  const [submitLoading, setSubmitLoading] = useState({})
  const [historyData, setHistoryData] = useState({})
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [hoveredRow, setHoveredRow] = useState(null)

  const kw   = getCurrentKW()
  const year = getCurrentYear()
  const { start, end } = getKWDateRange(kw, year)

  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing, loading: variantsLoading } = useAllVariants(listingIds)
  const { dealStatus, loading: statusLoading, toggleSubmitted } = useDealStatus(kw, year)

  const loading = listingsLoading || variantsLoading || statusLoading

  const activeEntries = useMemo(() => {
    return listings
      .map(l => {
        const active = getActiveVariant(l, variantsByListing[l.id] || [], kw, year)
        return active && active !== 'pause' ? { listing: l, active } : null
      })
      .filter(Boolean)
  }, [listings, variantsByListing, kw, year])

  const submittedCount = dealStatus.filter(s => s.submitted).length
  const total = activeEntries.length
  const pct = total > 0 ? Math.round((submittedCount / total) * 100) : 0
  const allSubmitted = total > 0 && submittedCount === total

  // Confetti when all submitted
  useEffect(() => {
    if (allSubmitted) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#5B5BD6', '#22C55E', '#F59E0B', '#EF4444', '#A855F7'],
      })
    }
  }, [allSubmitted])

  // Load history when tab opens
  useEffect(() => {
    if (activeTab === 'history' && !historyLoaded && listings.length > 0) {
      const past = getPastWeeks(8)
      fetchHistoricStatus(past).then(data => {
        // data = { 'kw_year': [statusRecords] }
        setHistoryData(data)
        setHistoryLoaded(true)
      })
    }
  }, [activeTab, historyLoaded, listings.length])

  const handleSubmit = async (listingId, variantId, currentSubmitted) => {
    setSubmitLoading(prev => ({ ...prev, [listingId]: true }))
    try {
      const newVal = await toggleSubmitted(listingId, variantId, currentSubmitted)
      if (newVal) toast.success('Eingereicht!')
    } finally {
      setSubmitLoading(prev => ({ ...prev, [listingId]: false }))
    }
  }

  const pastWeeks = useMemo(() => getPastWeeks(8), [])

  // Build statusByListing from historyData for each week
  const getStatusByListing = (kw, year) => {
    const key = `${kw}_${year}`
    const records = historyData[key] || []
    const map = {}
    records.forEach(r => { map[r.listing_id] = r })
    return map
  }

  const tabStyle = (tab) => ({
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    background: activeTab === tab ? 'var(--accent-muted)' : 'transparent',
    color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  })

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}
      >
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 800, margin: 0 }}>Einreichung</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            KW {kw} · {format(start, 'd. MMMM', { locale: de })} – {format(end, 'd. MMMM yyyy', { locale: de })}
          </p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 4, gap: 2 }}>
          <button style={tabStyle('current')} onClick={() => setActiveTab('current')}>Diese Woche</button>
          <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>Historie</button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'current' ? (
          <motion.div
            key="current"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Progress Bar */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: `1px solid ${allSubmitted ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 12,
              padding: '16px 20px',
              marginBottom: 20,
              transition: 'border-color 0.3s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: allSubmitted ? 'var(--green)' : 'var(--text-primary)' }}>
                  {allSubmitted
                    ? '🎉 Alle Deals eingereicht!'
                    : `${submittedCount} von ${total} eingereicht`}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: allSubmitted ? 'var(--green)' : 'var(--text-secondary)' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-overlay)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: allSubmitted ? 'var(--green)' : 'var(--accent)',
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    {['Marke', 'Listing', 'Aktive Variante', 'ASIN', 'Status'].map(col => (
                      <th key={col} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: 24 }}><SkeletonLoader count={6} height={40} gap={4} /></td></tr>
                  ) : activeEntries.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                      Keine aktiven Deals diese Woche
                    </td></tr>
                  ) : activeEntries.map(({ listing, active }, rowIndex) => {
                    const asin = typeof active === 'object' ? active.asin : listing.main_asin
                    const variantId = typeof active === 'object' ? active.id : null
                    const status = dealStatus.find(s => s.listing_id === listing.id)
                    const isSubmitted = status?.submitted || false

                    return (
                      <tr
                        key={listing.id}
                        onMouseEnter={() => setHoveredRow(listing.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: hoveredRow === listing.id
                            ? 'rgba(196,30,58,0.02)'
                            : isSubmitted
                              ? 'rgba(34,197,94,0.03)'
                              : rowIndex % 2 === 1 ? '#F9F9FB' : '#FFFFFF',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <BrandLogo brand={listing.brand} size={24} />
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {listing.name}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {typeof active === 'object' ? active.name : '✓ Aktiv'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <CopyCell text={asin} />
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <SubmitButton
                            submitted={isSubmitted}
                            loading={submitLoading[listing.id]}
                            onClick={() => handleSubmit(listing.id, variantId, isSubmitted)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pastWeeks.map(week => (
                <HistoryAccordion
                  key={`${week.kw}-${week.year}`}
                  week={week}
                  listings={listings}
                  variantsByListing={variantsByListing}
                  statusByListing={getStatusByListing(week.kw, week.year)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
