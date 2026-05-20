import { getISOWeek, getYear, startOfISOWeek, addWeeks, format } from 'date-fns'
import { de } from 'date-fns/locale'

export const getCurrentKW = () => getISOWeek(new Date())
export const getCurrentYear = () => getYear(new Date())

// Global rotation start — all listings share the same reference point
const GLOBAL_START_KW   = 22
const GLOBAL_START_YEAR = 2025

export const getActiveVariant = (listing, variants, kw, year) => {
  if (!listing) return null

  const totalWeeksOffset =
    (year - GLOBAL_START_YEAR) * 52 + (kw - GLOBAL_START_KW)

  if (listing.type === 'einzel') {
    const cycleLength = listing.cycle_type === '14/14' ? 2 : 1
    const position = Math.floor(totalWeeksOffset / cycleLength) % 2
    return position === 0 ? 'aktiv' : 'pause'
  }

  if (listing.type === 'varianten') {
    // Manual rotation plan (array of variant UUIDs or null for pause)
    if (listing.rotation_plan && listing.rotation_plan.length > 0) {
      const plan = listing.rotation_plan
      const idx = ((totalWeeksOffset % plan.length) + plan.length) % plan.length
      const variantId = plan[idx]
      if (variantId === null) return 'pause'
      const found = (variants || []).find(v => v.id === variantId)
      return found || null
    }
    // Fallback: round-robin by sort_order
    if (!variants || variants.length === 0) return null
    const activeVariants = variants
      .filter(v => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
    if (activeVariants.length === 0) return null
    const idx =
      ((totalWeeksOffset % activeVariants.length) + activeVariants.length) %
      activeVariants.length
    return activeVariants[idx]
  }

  return null
}

export const getKWDateRange = (kw, year) => {
  const jan4 = new Date(year, 0, 4)
  const monday = startOfISOWeek(jan4)
  const weekStart = addWeeks(monday, kw - 1)
  const weekEnd = addWeeks(weekStart, 1)
  weekEnd.setDate(weekEnd.getDate() - 1)
  return { start: weekStart, end: weekEnd }
}

export const getNextNWeeks = (n = 12) => {
  const weeks = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const date = addWeeks(now, i)
    weeks.push({ kw: getISOWeek(date), year: getYear(date) })
  }
  return weeks
}

export const formatKWLabel = (kw, year) => {
  const { start } = getKWDateRange(kw, year)
  return format(start, 'd. MMM', { locale: de })
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export const formatCurrency = (value) => {
  if (value == null) return '–'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}
