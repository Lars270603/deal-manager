import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useVariants(listingId) {
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listingId) {
      setVariants([])
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('variants')
      .select('*')
      .eq('listing_id', listingId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error('Fehler beim Laden der Varianten')
        else setVariants(data || [])
        setLoading(false)
      })
  }, [listingId])

  return { variants, setVariants, loading }
}

export function useAllVariants(listingIds = []) {
  const [variantsByListing, setVariantsByListing] = useState({})
  const [loading, setLoading] = useState(true)
  const prevKeyRef = useRef(null)

  useEffect(() => {
    const key = [...listingIds].sort().join(',')
    if (key === prevKeyRef.current) return
    prevKeyRef.current = key

    if (listingIds.length === 0) {
      setVariantsByListing({})
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('variants')
      .select('*')
      .in('listing_id', listingIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          const grouped = {}
          data.forEach(v => {
            if (!grouped[v.listing_id]) grouped[v.listing_id] = []
            grouped[v.listing_id].push(v)
          })
          setVariantsByListing(grouped)
        }
        setLoading(false)
      })
  }, [listingIds.join(',')])

  return { variantsByListing, loading }
}

// Returns a mapping { tempId → realUUID } for building rotation_plan after save
export async function saveVariantsForListing(listingId, formVariants) {
  const tempToReal = {}

  // Existing variants: tempId was set to real UUID when loaded
  formVariants.filter(v => v.id).forEach(v => {
    tempToReal[v.tempId] = v.id
  })

  // Fetch currently active variants in DB
  const { data: existing } = await supabase
    .from('variants')
    .select('id')
    .eq('listing_id', listingId)
    .eq('is_active', true)

  const existingIds = new Set((existing || []).map(v => v.id))
  const keepIds     = new Set(formVariants.filter(v => v.id).map(v => v.id))

  // Soft-delete removed variants
  const toDelete = [...existingIds].filter(id => !keepIds.has(id))
  if (toDelete.length > 0) {
    await supabase.from('variants').update({ is_active: false }).in('id', toDelete)
  }

  // Update existing
  for (let i = 0; i < formVariants.length; i++) {
    const v = formVariants[i]
    if (!v.id) continue
    await supabase.from('variants').update({
      listing_id: listingId,
      name: v.name,
      asin: v.asin || null,
      profit_regular: v.profit_regular !== '' ? parseFloat(v.profit_regular) : null,
      profit_deal:    v.profit_deal    !== '' ? parseFloat(v.profit_deal)    : null,
      sort_order: i,
      is_active: true,
    }).eq('id', v.id)
  }

  // Create new variants — capture the returned UUID
  for (let i = 0; i < formVariants.length; i++) {
    const v = formVariants[i]
    if (v.id) continue
    const { data: created } = await supabase
      .from('variants')
      .insert([{
        listing_id: listingId,
        name: v.name,
        asin: v.asin || null,
        profit_regular: v.profit_regular !== '' ? parseFloat(v.profit_regular) : null,
        profit_deal:    v.profit_deal    !== '' ? parseFloat(v.profit_deal)    : null,
        sort_order: i,
        is_active: true,
      }])
      .select()
      .single()

    if (created) tempToReal[v.tempId] = created.id
  }

  return tempToReal
}
