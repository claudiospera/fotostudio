-- 013_shop_coupons.sql
-- Codici sconto per lo shop

CREATE TABLE IF NOT EXISTS shop_coupons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,                        -- es. ESTATE25
  type        text NOT NULL CHECK (type IN ('percent', 'fixed')),  -- 'percent' | 'fixed'
  value       integer NOT NULL,                            -- percent: 1-100 | fixed: centesimi
  valid_from  date,                                        -- NULL = nessun limite inizio
  valid_until date,                                        -- NULL = nessun limite fine
  max_uses    integer,                                     -- NULL = illimitato
  used_count  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Aggiungi colonne coupon agli ordini
ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount    integer NOT NULL DEFAULT 0;
