import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useDealStatus(kw, year) {
  const [dealStatus, setDealStatus] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDealStatus = useCallback(async () => {
    if (!kw || !year) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('deal_status')
      .select('*')
      .eq('kw', kw)
      .eq('year', year)

    if (error) toast.error('Fehler beim Laden des Deal-Status')
    else setDealStatus(data || [])
    setLoading(false)
  }, [kw, year])

  useEffect(() => {
    fetchDealStatus()
  }, [fetchDealStatus])

  const upsertStatus = async (listingId, variantId, updates) => {
    // Optimistic update
    setDealStatus(prev => {
      const exists = prev.find(s => s.listing_id === listingId)
      if (exists) {
        return prev.map(s => s.listing_id === listingId ? { ...s, ...updates } : s)
      }
      return [...prev, { listing_id: listingId, variant_id: variantId, kw, year, submitted: false, ads_active: false, ...updates }]
    })

    const { error } = await supabase
      .from('deal_status')
      .upsert(
        { listing_id: listingId, variant_id: variantId, kw, year, ...updates },
        { onConflict: 'listing_id,kw,year' }
      )

    if (error) {
      toast.error('Fehler beim Speichern')
      fetchDealStatus()
    }
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

  const getStatus = (listingId) =>
    dealStatus.find(s => s.listing_id === listingId) || null

  return { dealStatus, loading, toggleSubmitted, toggleAdsActive, getStatus, refetch: fetchDealStatus }
}

export function useMultiWeekDealStatus(weeks) {
  const [statusMap, setStatusMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!weeks || weeks.length === 0) {
      setLoading(false)
      return
    }

    const fetchAll = async () => {
      setLoading(true)
      // Build OR filter for kw+year combinations
      const filters = weeks
        .map(w => `and(kw.eq.${w.kw},year.eq.${w.year})`)
        .join(',')

      const { data, error } = await supabase
        .from('deal_status')
        .select('*')
        .or(filters)

      if (!error && data) {
        const map = {}
        data.forEach(s => {
          const key = `${s.listing_id}_${s.kw}_${s.year}`
          map[key] = s
        })
        setStatusMap(map)
      }
      setLoading(false)
    }

    fetchAll()
  }, [weeks.map(w => `${w.kw}-${w.year}`).join(',')])

  const getStatus = (listingId, kw, year) =>
    statusMap[`${listingId}_${kw}_${year}`] || null

  const toggleCell = async (listingId, variantId, kw, year, field) => {
    const key = `${listingId}_${kw}_${year}`
    const current = statusMap[key]
    const currentVal = current?.[field] || false
    const newVal = !currentVal

    // Optimistic update
    setStatusMap(prev => ({
      ...prev,
      [key]: {
        listing_id: listingId,
        variant_id: variantId,
        kw,
        year,
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
          kw,
          year,
          [field]: newVal,
          [`${field}_at`]: newVal ? new Date().toISOString() : null,
        },
        { onConflict: 'listing_id,kw,year' }
      )

    if (error) toast.error('Fehler beim Speichern')
  }

  return { statusMap, loading, getStatus, toggleCell }
}

export async function fetchHistoricStatus(pastWeeks) {
  if (!pastWeeks.length) return {}

  const filters = pastWeeks
    .map(w => `and(kw.eq.${w.kw},year.eq.${w.year})`)
    .join(',')

  const { data, error } = await supabase
    .from('deal_status')
    .select('*')
    .or(filters)

  if (error) return {}

  const grouped = {}
  data.forEach(s => {
    const key = `${s.kw}_${s.year}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(s)
  })
  return grouped
}
