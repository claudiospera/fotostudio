-- 018_shop_shipping.sql
-- Spedizione a domicilio per lo shop pubblico (in alternativa al ritiro in studio)

ALTER TABLE shop_orders
  ADD COLUMN IF NOT EXISTS delivery_method   text NOT NULL DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS shipping_cost     integer NOT NULL DEFAULT 0,  -- centesimi
  ADD COLUMN IF NOT EXISTS shipping_address  jsonb,                      -- nome, indirizzo, CAP, città, provincia, telefono, note citofono
  ADD COLUMN IF NOT EXISTS tracking_number   text;

ALTER TABLE shop_orders
  ADD CONSTRAINT shop_orders_delivery_method_check CHECK (delivery_method IN ('pickup', 'shipping'));

-- Gli ordini esistenti restano 'pickup' / shipping_cost 0 grazie ai DEFAULT sopra.
