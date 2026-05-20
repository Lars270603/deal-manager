CREATE TABLE listings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  brand            TEXT NOT NULL CHECK (brand IN ('sommertal','arensberger','albatros','ravino','burggraf','stahlmann')),
  type             TEXT NOT NULL CHECK (type IN ('varianten','einzel')),
  main_asin        TEXT,
  image_url        TEXT,
  cycle_type       TEXT CHECK (cycle_type IN ('7/7','14/14')),
  rotation_plan    JSONB DEFAULT '[]',
  notes            TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE variants (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id     UUID REFERENCES listings(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  asin           TEXT,
  sort_order     INTEGER DEFAULT 0,
  profit_regular DECIMAL(10,2),
  profit_deal    DECIMAL(10,2),
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deal_status (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id   UUID REFERENCES listings(id) ON DELETE CASCADE,
  variant_id   UUID REFERENCES variants(id) ON DELETE SET NULL,
  kw           INTEGER NOT NULL,
  year         INTEGER NOT NULL,
  submitted    BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  submitted_by TEXT,
  ads_active   BOOLEAN DEFAULT false,
  ads_at       TIMESTAMPTZ,
  UNIQUE(listing_id, kw, year)
);

CREATE INDEX idx_listings_brand ON listings(brand);
CREATE INDEX idx_variants_listing ON variants(listing_id);
CREATE INDEX idx_dealstatus_kw ON deal_status(kw, year);
CREATE INDEX idx_dealstatus_listing ON deal_status(listing_id);
