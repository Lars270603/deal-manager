-- ============================================================
-- DEAL MANAGER MIGRATION
-- Ausführen im Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Profit-Spalten aus variants entfernen
ALTER TABLE variants DROP COLUMN IF EXISTS profit_regular;
ALTER TABLE variants DROP COLUMN IF EXISTS profit_deal;

-- 2. cycle_type aus listings entfernen
ALTER TABLE listings DROP COLUMN IF EXISTS cycle_type;

-- 3. Alte rotation_plan-Einträge leeren
--    (Format ändert sich von Array of UUIDs auf Array of Objects)
UPDATE listings SET rotation_plan = '[]'::jsonb;

-- 4. deal_status auf date-Spalte umstellen
-- 4a. date-Spalte hinzufügen
ALTER TABLE deal_status ADD COLUMN IF NOT EXISTS date DATE;

-- 4b. Bestehende kw/year-Einträge → ISO-Wochenmontag als Datum
--     Formel: Montag von KW W in Jahr Y =
--             date_trunc('week', make_date(Y, 1, 4)) + (W-1) * 7 Tage
UPDATE deal_status
SET date = (
  date_trunc('week', make_date(year::int, 1, 4))::date
  + ((kw - 1) * 7)::int
)
WHERE date IS NULL;

-- 4c. date NOT NULL setzen
ALTER TABLE deal_status ALTER COLUMN date SET NOT NULL;

-- 4d. Alte Unique-Constraint entfernen
--     Falls der Name abweicht: im Supabase Dashboard unter
--     Table Editor → deal_status → Constraints nachschauen
ALTER TABLE deal_status DROP CONSTRAINT IF EXISTS deal_status_listing_id_kw_year_key;
-- Fallback falls die Constraint anders heißt:
-- ALTER TABLE deal_status DROP CONSTRAINT IF EXISTS deal_status_pkey;
-- (und dann unten neu setzen)

-- 4e. Neue Unique-Constraint auf (listing_id, date)
ALTER TABLE deal_status ADD CONSTRAINT deal_status_listing_id_date_key
  UNIQUE (listing_id, date);

-- 4f. kw und year Spalten entfernen
ALTER TABLE deal_status DROP COLUMN IF EXISTS kw;
ALTER TABLE deal_status DROP COLUMN IF EXISTS year;

-- ============================================================
-- Fertig. Danach:
-- - App deployen (npm run build / GitHub Pages)
-- - Im Listings-Modal für jedes Listing den Rotationsplan
--   neu setzen (Zeitraum hinzufügen → Start- und Enddatum wählen)
-- ============================================================
