import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useDealStatus(date) {
  const [dealStatus, setDealStatus] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDealStatus = useCallback(async () => {
    if (!date) { setLoading(false); return }
    const { data, error } = await supabase
      .from('deal_status')
      .select('*')
      .eq('date', date)
    if (error) toast.error('Fehler beim Laden des Deal-Status')
    else setDealStatus(data || [])
    setLoading(false)
  }, [date])

  useEffect(() => { fetchDealStatus() }, [fetchDealStatus])

  const upsertStatus = async (listingId, variantId, updates) => {
    setDealStatus(prev => {
      const exists = prev.find(s => s.listing_id === listingId)
      if (exists) return prev.map(s => s.listing_id === listingId ? { ...s, ...updates } : s)
      return [...prev, { listing_id: listingId, variant_id: variantId, date, submitted: false, ads_active: false, ...updates }]
    })
    const { error } = await supabase
      .from('deal_status')
      .upsert(
        { listing_id: listingId, variant_id: variantId, date, ...updates },
        { onConflict: 'listing_id,date' }
      )
    if (error) { toast.error('Fehler beim Speichern'); fetchDealStatus() }
  }

  const toggleSubmitted = async (listingId, variantId, currentVal) => {
    const newVal = !currentVal
    await upsertStatus(listingId, variantId, {
      submitted: newVal,
      submitted_at: newVal ? new Date().toISOString() : null,
    })
    return newVal
  }

  const toggleAdsActive = async (listingId, variantId, currentVal) => {
    const newVal = !currentVal
    await upsertStatus(listingId, variantId, {
      ads_active: newVal,
      ads_at: newVal ? new Date().toISOString() : null,
    })
    return newVal
  }

  const getStatus = (listingId) => dealStatus.find(s => s.listing_id === listingId) || null

  return { dealStatus, loading, toggleSubmitted, toggleAdsActive, getStatus, refetch: fetchDealStatus }
}

export function useMultiDayDealStatus(dates) {
  const [statusMap, setStatusMap] = useState({})
  const [loading, setLoading] = useState(true)
  const datesKey = (dates || []).join(',')

  useEffect(() => {
    if (!dates || dates.length === 0) { setLoading(false); return }
    const fetchAll = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('deal_status')
        .select('*')
        .in('date', dates)
      if (!error && data) {
        const map = {}
        data.forEach(s => {
          const key = `${s.listing_id}_${s.date}`
          map[key] = s
        })
        setStatusMap(map)
      }
      setLoading(false)
    }
    fetchAll()
  }, [datesKey])

  const getStatus = (listingId, date) => statusMap[`${listingId}_${date}`] || null

  const toggleCell = async (listingId, variantId, date, field) => {
    const key = `${listingId}_${date}`
    const current = statusMap[key]
    const currentVal = current?.[field] || false
    const newVal = !currentVal

    setStatusMap(prev => ({
      ...prev,
      [key]: {
        listing_id: listingId,
        variant_id: variantId,
        date,
        submitted: false,
        ads_active: false,
        ...current,
        [field]: newVal,
        [`${field}_at`]: newVal ? new Date().toISOString() : null,
      }
    }))

    const { error } = await supabase
      .from('deal_status')
      .upsert(
        {
          listing_id: listingId,
          variant_id: variantId,
          date,
          [field]: newVal,
          [`${field}_at`]: newVal ? new Date().toISOString() : null,
        },
        { onConflict: 'listing_id,date' }
      )
    if (error) toast.error('Fehler beim Speichern')
  }

  return { statusMap, loading, getStatus, toggleCell }
}

export async function fetchHistoricStatus(pastDates) {
  if (!pastDates.length) return {}
  const { data, error } = await supabase
    .from('deal_status')
    .select('*')
    .in('date', pastDates)
  if (error) return {}
  const grouped = {}
  data.forEach(s => {
    if (!grouped[s.date]) grouped[s.date] = []
    grouped[s.date].push(s)
  })
  return grouped
}
