import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .order('brand', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      toast.error('Fehler beim Laden der Listings')
      console.error(error)
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const createListing = async (data) => {
    const { data: newListing, error } = await supabase
      .from('listings')
      .insert([data])
      .select()
      .single()

    if (error) {
      toast.error('Fehler beim Erstellen des Listings')
      throw error
    }
    setListings(prev => [...prev, newListing].sort((a, b) =>
      a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)
    ))
    return newListing
  }

  const updateListing = async (id, updates) => {
    const { data: updated, error } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      toast.error('Fehler beim Aktualisieren')
      throw error
    }
    setListings(prev => prev.map(l => l.id === id ? updated : l))
    return updated
  }

  const deleteListing = async (id) => {
    let removed
    setListings(prev => {
      removed = prev.find(l => l.id === id)
      return prev.filter(l => l.id !== id)
    })

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) {
      setListings(prev =>
        [...prev, removed].sort((a, b) =>
          a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)
        )
      )
      toast.error('Fehler beim Löschen')
      throw error
    }
    toast.success('Listing gelöscht')
  }

  return { listings, loading, createListing, updateListing, deleteListing, refetch: fetchListings }
}
