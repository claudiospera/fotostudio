-- 012_shop_orders_and_carts.sql
-- Tabelle per lo shop pubblico (clienti esterni, non fotografo)

-- Ordini shop ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text,                        -- Clerk user ID (nullable = guest)
  status            text NOT NULL DEFAULT 'pending',   -- pending | confirmed | ready | delivered | cancelled
  payment_method    text NOT NULL,               -- 'online' | 'studio'
  payment_status    text NOT NULL DEFAULT 'unpaid',    -- 'unpaid' | 'paid'
  stripe_session_id text,
  customer_name     text NOT NULL,
  customer_email    text NOT NULL,
  customer_phone    text NOT NULL,
  notes             text,
  items             jsonb NOT NULL DEFAULT '[]',
  total             integer NOT NULL,            -- in centesimi
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_orders_user_id_idx   ON shop_orders(user_id);
CREATE INDEX IF NOT EXISTS shop_orders_email_idx     ON shop_orders(customer_email);
CREATE INDEX IF NOT EXISTS shop_orders_status_idx    ON shop_orders(status);
CREATE INDEX IF NOT EXISTS shop_orders_created_idx   ON shop_orders(created_at DESC);

-- Carrelli salvati (solo utenti registrati) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_carts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL UNIQUE,               -- Clerk user ID
  items      jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_carts_user_id_idx ON shop_carts(user_id);
