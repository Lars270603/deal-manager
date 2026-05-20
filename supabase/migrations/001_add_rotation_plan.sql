-- Add rotation_plan column for manual variant rotation scheduling
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rotation_plan JSONB DEFAULT '[]';

-- Remove legacy cycle_start columns (no longer used — global start is KW 22 / 2025)
ALTER TABLE listings DROP COLUMN IF EXISTS cycle_start_kw;
ALTER TABLE listings DROP COLUMN IF EXISTS cycle_start_year;
