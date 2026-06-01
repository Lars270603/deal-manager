import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useListings } from '@/hooks/useListings'
import { useAllVariants } from '@/hooks/useVariants'
import BrandLogo from '@/components/ui/BrandLogo'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { BRANDS } from '@/lib/brands'
import { formatCurrency } from '@/lib/utils'

const cardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
}
const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
  return sortDir === 'asc'
    ? <ArrowUp size={13} style={{ color: 'var(--accent)' }} />
    : <ArrowDown size={13} style={{ color: 'var(--accent)' }} />
}

export default function Profit() {
  const { listings, loading: listingsLoading } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing, loading: variantsLoading } = useAllVariants(listingIds)

  const [sortField, setSortField] = useState('profit_deal')
  const [sortDir,   setSortDir]   = useState('desc')

  const loading = listingsLoading || variantsLoading

  // Build flat rows: one per variant (if varianten) or one per listing (if einzel)
  const rows = useMemo(() => {
    const result = []
    for (const listing of listings) {
      const variants = variantsByListing[listing.id] || []
      if (listing.type === 'varianten' && variants.length > 0) {
        for (const v of variants) {
          if (v.profit_regular != null || v.profit_deal != null) {
            result.push({
              id: v.id,
              brand: listing.brand,
              listingName: listing.name,
              variantName: v.name,
              profit_regular: v.profit_regular,
              profit_deal: v.profit_deal,
              diff: (v.profit_deal ?? 0) - (v.profit_regular ?? 0),
              diffPct: v.profit_regular
                ? (((v.profit_deal ?? 0) - v.profit_regular) / v.profit_regular) * 100
                : null,
            })
          }
        }
      } else if (listing.type === 'einzel') {
        // Einzel listings without variant profit data — skip if no data
      }
    }
    return result
  }, [listings, variantsByListing])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortField] ?? -Infinity
      const bv = b[sortField] ?? -Infinity
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [rows, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  // Hero stats
  const avgDeal = rows.length
    ? rows.reduce((s, r) => s + (r.profit_deal ?? 0), 0) / rows.length
    : 0
  const bestRow  = rows.reduce((best, r) => (!best || (r.profit_deal ?? 0) > (best.profit_deal ?? 0)) ? r : best, null)
  const bestDiff = rows.reduce((best, r) => (!best || r.diff > best.diff) ? r : best, null)

  const cols = [
    { label: 'Marke', field: null },
    { label: 'Listing', field: null },
    { label: 'Variante', field: null },
    { label: 'Regulär', field: 'profit_regular', right: true },
    { label: 'Mit Deal', field: 'profit_deal', right: true },
    { label: 'Differenz €', field: 'diff', right: true },
    { label: 'Differenz %', field: 'diffPct', right: true },
  ]

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 800, marginBottom: 24 }}
      >
        Gewinnübersicht
      </motion.h1>

      {/* Hero Stats */}
      <motion.div
        variants={cardStagger}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}
      >
        <motion.div variants={cardItem} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>
            {loading ? '–' : formatCurrency(avgDeal)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Ø Gewinn mit Deal</div>
        </motion.div>
        <motion.div variants={cardItem} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>
            {loading || !bestRow ? '–' : formatCurrency(bestRow.profit_deal)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
            Bester Deal{bestRow ? ` — ${bestRow.variantName}` : ''}
          </div>
        </motion.div>
        <motion.div variants={cardItem} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ fontFamily: 'Playfair Display', fontSize: 32, fontWeight: 800, color: 'var(--yellow)' }}>
            {loading || !bestDiff ? '–' : `+${bestDiff.diffPct != null ? bestDiff.diffPct.toFixed(0) : '?'}%`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
            Größte Margensteigerung{bestDiff ? ` — ${bestDiff.variantName}` : ''}
          </div>
        </motion.div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {cols.map(col => (
                  <th
                    key={col.label}
                    onClick={() => col.field && toggleSort(col.field)}
                    style={{
                      padding: '12px 16px',
                      textAlign: col.right ? 'right' : 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor: col.field ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.field && <SortIcon field={col.field} sortField={sortField} sortDir={sortDir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24 }}>
                    <SkeletonLoader count={8} height={36} gap={4} />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    Noch keine Variantengewinne hinterlegt
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => {
                  const diffPositive = row.diff > 0
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <BrandLogo brand={row.brand} size={24} />
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-primary)', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.listingName}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {row.variantName}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                        {formatCurrency(row.profit_regular)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                        {formatCurrency(row.profit_deal)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: diffPositive ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                        {diffPositive ? '+' : ''}{formatCurrency(row.diff)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: diffPositive ? 'var(--green)' : 'var(--red)', textAlign: 'right' }}>
                        {row.diffPct != null
                          ? `${diffPositive ? '+' : ''}${row.diffPct.toFixed(1)}%`
                          : '–'}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
