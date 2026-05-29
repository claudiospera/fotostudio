-- 014_coupon_product_ids.sql
-- Aggiunge restrizione per prodotti specifici ai coupon

ALTER TABLE shop_coupons
  ADD COLUMN IF NOT EXISTS product_ids text[] NOT NULL DEFAULT '{}';
-- Array vuoto = sconto valido su tutti i prodotti
-- Array con valori = sconto valido solo sui product ID elencati
