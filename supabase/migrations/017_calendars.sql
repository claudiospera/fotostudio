-- 017_calendars.sql
-- Calendari fotografici 2027: catalogo modelli + impostazioni banner

CREATE TABLE IF NOT EXISTS calendar_models (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  title       text,
  format      text NOT NULL DEFAULT 'foglio_30x45',
  category    text NOT NULL DEFAULT '',
  photo_slots int NOT NULL DEFAULT 1,
  image_key   text NOT NULL,   -- R2 key anteprima 1200px con watermark
  thumb_key   text NOT NULL,   -- R2 key miniatura 400px
  source_hash text,            -- hash del jpeg originale, per import idempotente
  active      boolean NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_settings (
  id          smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- riga singola
  banner_text text,
  banner_date date,
  updated_at  timestamptz DEFAULT now()
);
