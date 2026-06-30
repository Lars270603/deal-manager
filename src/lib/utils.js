import { format, addDays, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

export const getToday = () => format(new Date(), 'yyyy-MM-dd')

export const getNextNDays = (n = 30) => {
  const days = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    days.push(format(addDays(today, i), 'yyyy-MM-dd'))
  }
  return days
}

export const getActiveVariant = (listing, variants, dateStr) => {
  if (!listing || !dateStr) return null
  const plan = listing.rotation_plan || []
  if (!Array.isArray(plan) || plan.length === 0) return null

  const entry = plan.find(p =>
    p && p.start_date && p.end_date &&
    dateStr >= p.start_date && dateStr <= p.end_date
  )
  if (!entry) return null

  if (listing.type === 'einzel') return 'aktiv'

  if (listing.type === 'varianten') {
    if (!entry.variant_id) return 'pause'
    return (variants || []).find(v => v.id === entry.variant_id) || null
  }

  return null
}

export const formatDateLabel = (dateStr) => {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'd. MMM', { locale: de })
  } catch {
    return dateStr
  }
}

export const formatDateFull = (dateStr) => {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'd. MMMM yyyy', { locale: de })
  } catch {
    return dateStr
  }
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
