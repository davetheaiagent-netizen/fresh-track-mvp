-- Stores table (for B2B)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  address TEXT,
  api_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add store_id to items for B2B tracking
ALTER TABLE items ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

-- B2B Users table
CREATE TABLE IF NOT EXISTS b2b_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  store_id UUID REFERENCES stores(id),
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'retailer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Aggregate waste stats view
CREATE OR REPLACE VIEW waste_stats_summary AS
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE status = 'wasted') as wasted_items,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'wasted')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as waste_percentage
FROM items
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- Category waste breakdown view
CREATE OR REPLACE VIEW category_waste_stats AS
SELECT 
  COALESCE(category, 'other') as category,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE status = 'wasted') as wasted_items,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'wasted')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as waste_percentage
FROM items
GROUP BY COALESCE(category, 'other')
ORDER BY waste_percentage DESC;

-- Top wasted products view
CREATE OR REPLACE VIEW top_wasted_products AS
SELECT 
  name,
  COALESCE(category, 'other') as category,
  COUNT(*) as waste_count
FROM items
WHERE status = 'wasted'
GROUP BY name, COALESCE(category, 'other')
ORDER BY waste_count DESC
LIMIT 20;

-- Insert demo store
INSERT INTO stores (name, region, api_key) 
VALUES ('Demo Supermarket', 'South East', 'demo-api-key-123')
ON CONFLICT (api_key) DO NOTHING;
