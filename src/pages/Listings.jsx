import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Search, Edit2, Copy, GripVertical, X, Check, Trash2, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCurrentKW, getCurrentYear, getActiveVariant, copyToClipboard } from '@/lib/utils'
import { BRANDS, BRAND_ORDER } from '@/lib/brands'
import { useListings } from '@/hooks/useListings'
import { useAllVariants, saveVariantsForListing } from '@/hooks/useVariants'
import { useDealStatus } from '@/hooks/useDealStatus'
import { supabase } from '@/lib/supabase'
import BrandLogo from '@/components/ui/BrandLogo'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

// ─── Sortable Variant Row (2-Zeilen-Layout) ─────────────────────────────────
function SortableVariantRow({ variant, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: variant.tempId })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.45 : 1 }}
    >
      <div style={{
        display: 'flex', gap: 8, padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
        alignItems: 'flex-start',
      }}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab', color: 'var(--text-muted)', flexShrink: 0,
            padding: '8px 2px', display: 'flex', alignItems: 'center',
          }}
        >
          <GripVertical size={15} />
        </div>

        {/* Two rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Zeile 1: Name + ASIN */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={variant.name}
              onChange={e => onUpdate('name', e.target.value)}
              placeholder="z.B. SARA, LINA, SC350 …"
              style={inputStyle({ flex: 2, minWidth: 0 })}
            />
            <input
              value={variant.asin}
              onChange={e => onUpdate('asin', e.target.value)}
              placeholder="B0XXXXXXXX"
              style={inputStyle({ flex: 1, fontFamily: 'monospace', minWidth: 0 })}
            />
          </div>
          {/* Zeile 2: Gewinne */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ohne Angebot
              </span>
              <input
                value={variant.profit_regular}
                onChange={e => onUpdate('profit_regular', e.target.value)}
                placeholder="0.00"
                type="number" step="0.01" min="0"
                style={inputStyle({ flex: 1, minWidth: 0 })}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>€</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Mit Angebot
              </span>
              <input
                value={variant.profit_deal}
                onChange={e => onUpdate('profit_deal', e.target.value)}
                placeholder="0.00"
                type="number" step="0.01" min="0"
                style={inputStyle({ flex: 1, minWidth: 0 })}
              />
              <span style={{ fontSize: 11, color: 'var(--green)', flexShrink: 0 }}>€</span>
            </div>
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={onRemove}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', flexShrink: 0, padding: '6px 4px',
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

const inputStyle = (extra = {}) => ({
  padding: '7px 10px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  ...extra,
})

const defaultForm = {
  brand: '',
  name: '',
  main_asin: '',
  image_url: '',
  type: 'varianten',
  cycle_type: '7/7',
  notes: '',
}

const newSlot = () => ({ id: Math.random().toString(36).slice(2), variantTempId: null })

// ─── Listing Modal ──────────────────────────────────────────────────────────
function ListingModal({ open, onClose, editing, onSave }) {
  const [form, setForm]               = useState(defaultForm)
  const [formVariants, setFormVariants] = useState([])
  const [rotationSlots, setRotationSlots] = useState([])
  const [saving, setSaving]           = useState(false)
  const [imgError, setImgError]       = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        brand: editing.brand,
        name: editing.name,
        main_asin: editing.main_asin || '',
        image_url: editing.image_url || '',
        type: editing.type,
        cycle_type: editing.cycle_type || '7/7',
        notes: editing.notes || '',
      })
      setImgError(false)
      // Load existing variants and rotation plan
      supabase
        .from('variants')
        .select('*')
        .eq('listing_id', editing.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          setFormVariants((data || []).map(v => ({
            ...v,
            tempId: v.id,   // tempId = real UUID for existing variants
            profit_regular: v.profit_regular?.toString() || '',
            profit_deal:    v.profit_deal?.toString()    || '',
          })))
          // Build rotation slots from stored plan (array of UUID | null)
          const plan = editing.rotation_plan || []
          setRotationSlots(plan.map(variantId => ({
            id: Math.random().toString(36).slice(2),
            variantTempId: variantId, // null → Pause, UUID → existing variant
          })))
        })
    } else {
      setForm({ ...defaultForm })
      setFormVariants([])
      setRotationSlots([])
      setImgError(false)
    }
  }, [open, editing])

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const addVariant = () => {
    setFormVariants(prev => [...prev, {
      tempId: Math.random().toString(36).slice(2),
      id: null,
      name: '',
      asin: '',
      profit_regular: '',
      profit_deal: '',
    }])
  }

  const updateVariant = (index, field, value) => {
    setFormVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const removeVariant = (index) => {
    const removed = formVariants[index]
    setFormVariants(prev => prev.filter((_, i) => i !== index))
    // Remove all rotation slots that referenced the deleted variant
    setRotationSlots(prev => prev.filter(s => s.variantTempId !== removed.tempId))
  }

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      setFormVariants(prev => {
        const oldIdx = prev.findIndex(v => v.tempId === active.id)
        const newIdx = prev.findIndex(v => v.tempId === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  const handleSave = async () => {
    if (!form.brand) { toast.error('Bitte eine Marke auswählen'); return }
    if (!form.name.trim()) { toast.error('Name ist Pflichtfeld'); return }
    if (form.type === 'varianten' && formVariants.length === 0) {
      toast.error('Mindestens eine Variante hinzufügen'); return
    }
    if (form.type === 'varianten') {
      const empty = formVariants.find(v => !v.name.trim())
      if (empty) { toast.error('Alle Varianten brauchen einen Namen'); return }
    }

    setSaving(true)
    try {
      await onSave(form, formVariants, rotationSlots, editing)
      onClose()
    } catch {
      // Error already shown by hook
    } finally {
      setSaving(false)
    }
  }

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  }

  const fullInputStyle = {
    ...inputStyle(),
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Listing bearbeiten' : 'Neues Listing'}
      width="680px"
    >
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Brand */}
        <div>
          <label style={labelStyle}>Marke *</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BRAND_ORDER.map(key => {
              const b = BRANDS[key]
              const sel = form.brand === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setField('brand', key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: `1px solid ${sel ? b.color : 'var(--border-default)'}`,
                    background: sel ? `${b.color}18` : 'var(--bg-overlay)',
                    color: sel ? b.color : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: sel ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  <img src={b.logo} alt={b.label} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  {b.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Name + ASIN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Produktname" style={fullInputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Haupt-ASIN</label>
            <input value={form.main_asin} onChange={e => setField('main_asin', e.target.value)} placeholder="B0XXXXXXXX" style={{ ...fullInputStyle, fontFamily: 'monospace' }} />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label style={labelStyle}>Produktbild-URL (optional)</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <input
              value={form.image_url}
              onChange={e => { setField('image_url', e.target.value); setImgError(false) }}
              placeholder="https://…"
              style={{ ...fullInputStyle, flex: 1 }}
            />
            {form.image_url && !imgError && (
              <img
                src={form.image_url}
                alt="Vorschau"
                onError={() => setImgError(true)}
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-default)', flexShrink: 0 }}
              />
            )}
            {imgError && (
              <div style={{ width: 56, height: 56, borderRadius: 8, border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Image size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Type */}
        <div>
          <label style={labelStyle}>Typ *</label>
          <div style={{ display: 'flex', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 3, gap: 2, width: 'fit-content' }}>
            {['varianten', 'einzel'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setField('type', t)}
                style={{
                  padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  background: form.type === t ? 'var(--accent)' : 'transparent',
                  color: form.type === t ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'varianten' ? 'Varianten' : 'Einzel'}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional: cycle (einzel) or variants */}
        {form.type === 'einzel' && (
          <div>
            <label style={labelStyle}>Rotationszyklus</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['7/7', '14/14'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setField('cycle_type', c)}
                  style={{
                    padding: '7px 18px', borderRadius: 8, border: `1px solid ${form.cycle_type === c ? 'var(--accent)' : 'var(--border-default)'}`,
                    background: form.cycle_type === c ? 'var(--accent-muted)' : 'var(--bg-overlay)',
                    color: form.cycle_type === c ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: form.cycle_type === c ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {c} Wochen
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              7/7 = jede 2. Woche aktiv · 14/14 = jede 4. Woche aktiv
            </p>
          </div>
        )}

        {form.type === 'varianten' && (
          <>
            {/* ── Varianten ── */}
            <div>
              <label style={labelStyle}>Varianten</label>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={formVariants.map(v => v.tempId)} strategy={verticalListSortingStrategy}>
                  {formVariants.map((variant, index) => (
                    <SortableVariantRow
                      key={variant.tempId}
                      variant={variant}
                      onUpdate={(field, val) => updateVariant(index, field, val)}
                      onRemove={() => removeVariant(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <button
                type="button"
                onClick={addVariant}
                style={{
                  marginTop: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: '1px dashed var(--border-default)',
                  borderRadius: 8, padding: '8px 16px',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'inherit', width: '100%',
                  justifyContent: 'center', transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <Plus size={14} />
                Variante hinzufügen
              </button>
            </div>

            {/* ── Rotationsplan ── */}
            <div style={{ background: 'var(--bg-overlay)', borderRadius: 10, padding: '16px 16px 12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Rotationsplan</label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {rotationSlots.length > 0
                    ? `${rotationSlots.length} Wochen · danach Wiederholung`
                    : 'noch keine Slots'}
                  {' · '}Start global KW 22 / 2025
                </span>
              </div>

              {rotationSlots.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Noch kein Plan definiert. Füge Wochen-Slots hinzu.
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rotationSlots.map((slot, idx) => {
                  const namedVariants = formVariants.filter(v => v.name.trim())
                  return (
                    <div
                      key={slot.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 7,
                        border: `1px solid ${slot.variantTempId ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: 'var(--text-muted)', minWidth: 58,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        Woche {idx + 1}
                      </span>
                      <select
                        value={slot.variantTempId || ''}
                        onChange={e => {
                          const val = e.target.value
                          setRotationSlots(prev => prev.map(s =>
                            s.id === slot.id ? { ...s, variantTempId: val || null } : s
                          ))
                        }}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 6,
                          color: slot.variantTempId ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: 13,
                          fontFamily: 'inherit',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">— Pause —</option>
                        {namedVariants.map(v => (
                          <option key={v.tempId} value={v.tempId}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setRotationSlots(prev => prev.filter(s => s.id !== slot.id))}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', display: 'flex', padding: '3px 4px', flexShrink: 0,
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>

              {rotationSlots.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 10px 2px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>↩</span>
                  <span>
                    Woche {rotationSlots.length + 1} startet wieder mit Woche 1
                    {rotationSlots[0]?.variantTempId
                      ? ` (${formVariants.find(v => v.tempId === rotationSlots[0].variantTempId)?.name || '…'})`
                      : ' (Pause)'}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setRotationSlots(prev => [...prev, newSlot()])}
                style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: '1px dashed var(--border-default)',
                  borderRadius: 8, padding: '7px 14px',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontSize: 12, fontFamily: 'inherit',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <Plus size={13} />
                Woche hinzufügen
              </button>
            </div>
          </>
        )}

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notizen (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            placeholder="Interne Notizen…"
            rows={3}
            style={{ ...fullInputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Speichere…' : editing ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Listing Card ───────────────────────────────────────────────────────────
function ListingCard({ listing, variants, kw, year, onEdit, onDelete, dealStatus }) {
  const [hovered, setHovered] = useState(false)
  const [copiedAsin, setCopiedAsin] = useState(false)
  const brand = BRANDS[listing.brand]
  const active = getActiveVariant(listing, variants, kw, year)
  const asin = listing.main_asin

  const handleCopyAsin = async (e) => {
    e.stopPropagation()
    if (!asin) return
    const ok = await copyToClipboard(asin)
    if (ok) { setCopiedAsin(true); toast.success('ASIN kopiert!'); setTimeout(() => setCopiedAsin(false), 2000) }
  }

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border-subtle)',
        borderTop: `4px solid ${brand.color}`,
        boxShadow: hovered ? `0 0 0 1px var(--border-default), 0 4px 16px rgba(0,0,0,0.25)` : 'none',
        transition: 'box-shadow 0.15s',
        cursor: 'default',
      }}
    >
      {/* Card image/brand area */}
      <div style={{
        height: 90,
        position: 'relative',
        background: 'var(--bg-overlay)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <img
            src={brand.logo}
            alt={brand.label}
            style={{ width: 60, height: 60, objectFit: 'contain', opacity: 0.35 }}
          />
        )}
        {/* Brand logo badge (always shown) */}
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(8,8,14,0.7)', borderRadius: 6, padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <img src={brand.logo} alt={brand.label} style={{ width: 16, height: 16, objectFit: 'contain' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: brand.color }}>{brand.label}</span>
        </div>
        {/* Edit + Delete buttons */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}
            >
              <button
                onClick={e => { e.stopPropagation(); onEdit(listing) }}
                style={{
                  background: 'rgba(8,8,14,0.8)', border: '1px solid var(--border-default)',
                  borderRadius: 6, padding: 5, cursor: 'pointer', color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation()
                  if (window.confirm('Listing wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                    onDelete(listing.id)
                  }
                }}
                style={{
                  background: 'rgba(8,8,14,0.8)', border: '1px solid var(--border-default)',
                  borderRadius: 6, padding: 5, cursor: 'pointer', color: '#ef4444',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card content */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
          <h3 style={{
            fontFamily: 'Playfair Display', fontSize: 14, fontWeight: 600, margin: 0,
            color: '#FFFFFF', lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {listing.name}
          </h3>
          <Badge color={listing.type === 'varianten' ? 'var(--accent)' : 'var(--text-muted)'} style={{ flexShrink: 0 }}>
            {listing.type === 'varianten' ? 'Varianten' : 'Einzel'}
          </Badge>
        </div>

        {/* Active this week */}
        {active && active !== 'pause' && (
          <div style={{
            padding: '5px 10px',
            background: 'var(--green-muted)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 6,
            marginBottom: 8,
            fontSize: 12,
            color: 'var(--green)',
            fontWeight: 600,
          }}>
            ✓ Diese Woche: {typeof active === 'object' ? active.name : 'Aktiv'}
          </div>
        )}

        {/* Variants pills */}
        {listing.type === 'varianten' && variants.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {variants.map(v => (
              <span
                key={v.id}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: (typeof active === 'object' && active.id === v.id) ? 'var(--green-muted)' : `${brand.color}15`,
                  border: `1px solid ${(typeof active === 'object' && active.id === v.id) ? 'rgba(34,197,94,0.25)' : `${brand.color}30`}`,
                  color: (typeof active === 'object' && active.id === v.id) ? 'var(--green)' : brand.color,
                }}
              >
                {v.name}
              </span>
            ))}
          </div>
        )}

        {/* ASIN */}
        {asin && (
          <button
            onClick={handleCopyAsin}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 0, color: 'var(--text-muted)',
            }}
          >
            <code style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{asin}</code>
            {copiedAsin
              ? <Check size={11} style={{ color: 'var(--green)' }} />
              : <Copy size={11} />}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
const cardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}
const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export default function Listings() {
  const [search, setSearch]   = useState('')
  const [brandFilter, setBrandFilter] = useState(null)
  const [typeFilter, setTypeFilter]   = useState(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editingListing, setEditingListing] = useState(null)

  const kw   = getCurrentKW()
  const year = getCurrentYear()

  const { listings, loading, createListing, updateListing, deleteListing } = useListings()
  const listingIds = listings.map(l => l.id)
  const { variantsByListing } = useAllVariants(listingIds)
  const { dealStatus } = useDealStatus(kw, year)

  const filtered = useMemo(() => {
    return listings.filter(l => {
      if (brandFilter && l.brand !== brandFilter) return false
      if (typeFilter  && l.type  !== typeFilter)  return false
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [listings, brandFilter, typeFilter, search])

  const grouped = useMemo(() => {
    const g = {}
    for (const l of filtered) {
      if (!g[l.brand]) g[l.brand] = []
      g[l.brand].push(l)
    }
    return g
  }, [filtered])

  const openCreate = () => { setEditingListing(null); setModalOpen(true) }
  const openEdit   = (l)  => { setEditingListing(l);  setModalOpen(true) }

  const handleSave = async (form, formVariants, rotationSlots, editing) => {
    if (editing) {
      const basePayload = {
        brand: form.brand,
        name: form.name,
        main_asin: form.main_asin || null,
        image_url: form.image_url || null,
        type: form.type,
        cycle_type: form.type === 'einzel' ? form.cycle_type : null,
        notes: form.notes || null,
      }
      if (form.type === 'varianten') {
        const tempToReal = await saveVariantsForListing(editing.id, formVariants)
        const rotationPlan = rotationSlots.map(s =>
          s.variantTempId ? (tempToReal[s.variantTempId] || s.variantTempId) : null
        )
        await updateListing(editing.id, { ...basePayload, rotation_plan: rotationPlan })
      } else {
        await updateListing(editing.id, { ...basePayload, rotation_plan: null })
      }
      toast.success('Listing gespeichert')
    } else {
      const basePayload = {
        brand: form.brand,
        name: form.name,
        main_asin: form.main_asin || null,
        image_url: form.image_url || null,
        type: form.type,
        cycle_type: form.type === 'einzel' ? form.cycle_type : null,
        notes: form.notes || null,
        rotation_plan: null,
      }
      const newListing = await createListing(basePayload)
      if (form.type === 'varianten' && formVariants.length > 0) {
        const tempToReal = await saveVariantsForListing(newListing.id, formVariants)
        const rotationPlan = rotationSlots.map(s =>
          s.variantTempId ? (tempToReal[s.variantTempId] || s.variantTempId) : null
        )
        await updateListing(newListing.id, { rotation_plan: rotationPlan })
      }
      toast.success('Listing erstellt')
    }
  }

  const brandKeys = BRAND_ORDER.filter(b =>
    listings.some(l => l.brand === b)
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 800, margin: 0 }}
        >
          Listings
          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 10, fontFamily: 'Inter' }}>
            {listings.length}
          </span>
        </motion.h1>
        <Button variant="primary" onClick={openCreate} size="md">
          <Plus size={15} />
          Neues Listing
        </Button>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', gap: 10, alignItems: 'center',
          marginBottom: 24, flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: 180, maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen…"
            style={{
              width: '100%', padding: '8px 10px 8px 32px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Brand filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setBrandFilter(null)}
            style={{
              padding: '6px 12px', borderRadius: 8, border: `1px solid ${!brandFilter ? 'var(--accent)' : 'var(--border-default)'}`,
              background: !brandFilter ? 'var(--accent-muted)' : 'var(--bg-elevated)',
              color: !brandFilter ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            Alle
          </button>
          {brandKeys.map(key => {
            const b = BRANDS[key]
            const active = brandFilter === key
            return (
              <button
                key={key}
                onClick={() => setBrandFilter(active ? null : key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8,
                  border: `1px solid ${active ? b.color : 'var(--border-default)'}`,
                  background: active ? `${b.color}18` : 'var(--bg-elevated)',
                  color: active ? b.color : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <img src={b.logo} alt={b.label} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                {b.label}
              </button>
            )
          })}
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 3, gap: 2 }}>
          {[null, 'varianten', 'einzel'].map(t => (
            <button
              key={String(t)}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 12, fontFamily: 'inherit', fontWeight: typeFilter === t ? 600 : 400,
                background: typeFilter === t ? 'var(--bg-overlay)' : 'transparent',
                color: typeFilter === t ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {t === null ? 'Alle' : t === 'varianten' ? 'Varianten' : 'Einzel'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 10, height: 200, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <SkeletonLoader height={90} radius={0} />
              <div style={{ padding: 14 }}>
                <SkeletonLoader count={3} height={14} gap={6} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 16 }}>Keine Listings gefunden</p>
          <p style={{ fontSize: 13, marginTop: 6 }}>Passe die Filter an oder erstelle ein neues Listing</p>
        </div>
      ) : (
        BRAND_ORDER.filter(b => grouped[b]).map(brand => (
          <div key={brand} style={{ marginBottom: 32 }}>
            {/* Brand group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
              padding: '8px 0', borderBottom: `2px solid ${BRANDS[brand].color}33`,
            }}>
              <img src={BRANDS[brand].logo} alt={BRANDS[brand].label} style={{ width: 28, height: 28, objectFit: 'contain' }} />
              <span style={{ fontFamily: 'Playfair Display', fontSize: 16, fontWeight: 700, color: BRANDS[brand].color }}>
                {BRANDS[brand].label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                {grouped[brand].length} Listings
              </span>
            </div>
            <motion.div
              variants={cardStagger}
              initial="hidden"
              animate="visible"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
            >
              {grouped[brand].map(listing => (
                <motion.div key={listing.id} variants={cardItem}>
                  <ListingCard
                    listing={listing}
                    variants={variantsByListing[listing.id] || []}
                    kw={kw}
                    year={year}
                    onEdit={openEdit}
                    onDelete={deleteListing}
                    dealStatus={dealStatus.find(s => s.listing_id === listing.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))
      )}

      <ListingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editingListing}
        onSave={handleSave}
      />
    </div>
  )
}
