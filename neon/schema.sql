-- FotoStudio — Schema Neon (Clerk Auth, no Supabase RLS)
-- Profilo fotografo (id = Clerk userId, e.g. "user_abc123")
CREATE TABLE IF NOT EXISTS profiles (
  id          text PRIMARY KEY,  -- Clerk user ID
  name        text,
  studio_name text,
  plan        text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'professional')),
  telefono    text,
  email       text,
  iban        text,
  created_at  timestamptz DEFAULT now()
);

-- Gallerie
CREATE TABLE IF NOT EXISTS galleries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  subtitle    text,
  type        text,
  date        date,
  status      text DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  cover_color text DEFAULT '#2a3830',
  cover_url   text,
  settings    jsonb DEFAULT '{
    "preferiti": true,
    "commenti": true,
    "social": false,
    "servizio_stampa": false,
    "download_singolo": true,
    "download_hd": false,
    "download_zip": false,
    "watermark": false,
    "nome_file": false,
    "pagamenti": {"negozio": false, "paypal": false, "bonifico": false}
  }'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Foto (riferimenti a Cloudflare R2)
CREATE TABLE IF NOT EXISTS photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id   uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  url          text,
  filename     text,
  size_bytes   bigint,
  width        int,
  height       int,
  order_index  int DEFAULT 0,
  folder       text DEFAULT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photos_folder_idx ON photos(gallery_id, folder);

-- Clienti ospiti per galleria
CREATE TABLE IF NOT EXISTS gallery_clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id    uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  name          text NOT NULL,
  email         text NOT NULL,
  password_hash text,
  active        boolean DEFAULT true,
  favorites     int DEFAULT 0,
  comments      int DEFAULT 0,
  orders        int DEFAULT 0,
  last_access   timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- Timeline giornata
CREATE TABLE IF NOT EXISTS timeline_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  time        time NOT NULL,
  label       text NOT NULL,
  order_index int DEFAULT 0
);

-- Preventivi
CREATE TABLE IF NOT EXISTS preventivi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  gallery_id  uuid REFERENCES galleries(id) ON DELETE SET NULL,
  cliente     text NOT NULL,
  email       text,
  servizio    text,
  data_evento date,
  voci        jsonb DEFAULT '[]',
  totale      numeric DEFAULT 0,
  stato       text DEFAULT 'bozza' CHECK (stato IN ('bozza', 'inviato', 'accettato', 'rifiutato')),
  note        text,
  created_at  timestamptz DEFAULT now()
);

-- Preventivi pubblici (link condivisibili)
CREATE TABLE IF NOT EXISTS preventivi_pubblici (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token       text UNIQUE NOT NULL,
  cliente     text,
  email       text,
  servizio    text,
  data_evento date,
  voci        jsonb DEFAULT '[]',
  totale      numeric DEFAULT 0,
  stato       text DEFAULT 'bozza',
  note        text,
  expires_at  timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- Template preventivi
CREATE TABLE IF NOT EXISTS preventivo_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  categoria   text NOT NULL,
  sezioni     jsonb DEFAULT '[]',
  updated_at  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, categoria)
);

-- Link upload clienti
CREATE TABLE IF NOT EXISTS upload_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  gallery_id uuid REFERENCES galleries(id) ON DELETE SET NULL,
  nome       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  expires_at timestamptz,
  max_photos int,
  uploads    int DEFAULT 0,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Preferiti foto
CREATE TABLE IF NOT EXISTS photo_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  session_id  text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(photo_id, session_id)
);

-- Commenti foto
CREATE TABLE IF NOT EXISTS photo_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  session_id  text NOT NULL,
  author_name text,
  body        text NOT NULL CHECK (char_length(body) <= 1000),
  created_at  timestamptz DEFAULT now()
);

-- Ordini stampe
CREATE TABLE IF NOT EXISTS print_orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id   uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  session_id   text NOT NULL,
  client_name  text,
  client_email text,
  items        jsonb NOT NULL DEFAULT '[]',
  total        numeric NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'nuovo',
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- Clienti (anagrafica completa)
CREATE TABLE IF NOT EXISTS clienti (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text REFERENCES profiles(id) ON DELETE CASCADE,
  categoria       text NOT NULL,
  data_evento     date,
  luogo_evento    text,
  nome1           text NOT NULL,
  tel1            text,
  email1          text,
  whatsapp1       text,
  indirizzo1      text,
  citta1          text,
  nome2           text,
  tel2            text,
  email2          text,
  whatsapp2       text,
  indirizzo2      text,
  citta2          text,
  genitore1_nome  text,
  genitore1_tel   text,
  genitore2_nome  text,
  genitore2_tel   text,
  album_tipo      text,
  album_formato   text,
  album_pagine    int,
  album_copertina text,
  video           boolean DEFAULT false,
  video_tipo      text,
  pacchetti       jsonb DEFAULT '[]',
  importo_totale  numeric DEFAULT 0,
  acconto         numeric DEFAULT 0,
  data_acconto    date,
  saldo           numeric DEFAULT 0,
  data_saldo      date,
  gallery_id      uuid REFERENCES galleries(id) ON DELETE SET NULL,
  note            text,
  colore          text DEFAULT '#8ec9b0',
  extra           jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clienti_data_evento_idx ON clienti (data_evento);
CREATE INDEX IF NOT EXISTS clienti_user_id_idx ON clienti (user_id);

-- Calendari appuntamenti
CREATE TABLE IF NOT EXISTS calendari_appuntamenti (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            text REFERENCES profiles(id) ON DELETE CASCADE,
  nome               text NOT NULL,
  data_inizio        date,
  data_fine          date,
  colore             text DEFAULT '#3dba8a',
  attivo             boolean DEFAULT true,
  descrizione        text,
  mostra_descrizione boolean DEFAULT false,
  inizia_settimana   text DEFAULT 'lunedi',
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- Prenotazioni appuntamenti
CREATE TABLE IF NOT EXISTS prenotazioni_appuntamenti (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        text REFERENCES profiles(id) ON DELETE CASCADE,
  calendario_id  uuid REFERENCES calendari_appuntamenti(id) ON DELETE CASCADE,
  cliente_nome   text NOT NULL,
  cliente_email  text,
  cliente_tel    text,
  data           date NOT NULL,
  ora_inizio     time NOT NULL,
  ora_fine       time NOT NULL,
  note           text,
  stato          text DEFAULT 'confermata',
  created_at     timestamptz DEFAULT now()
);

-- Trigger: aggiorna updated_at su galleries
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER clienti_updated_at
  BEFORE UPDATE ON clienti
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER calendari_updated_at
  BEFORE UPDATE ON calendari_appuntamenti
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
