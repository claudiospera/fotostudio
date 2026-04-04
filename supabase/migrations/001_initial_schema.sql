-- FotoStudio — Schema iniziale
-- Versione: 001

-- Profilo fotografo (estende auth.users)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  studio_name text,
  plan        text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'professional')),
  created_at  timestamptz DEFAULT now()
);

-- Gallerie
CREATE TABLE galleries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  subtitle    text,
  type        text,
  date        date,
  status      text DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  cover_color text DEFAULT '#2a3830',
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

-- Foto (riferimenti a Supabase Storage)
CREATE TABLE photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id   uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  url          text,
  filename     text,
  size_bytes   bigint,
  width        int,
  height       int,
  order_index  int DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- Clienti ospiti per galleria
CREATE TABLE gallery_clients (
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
CREATE TABLE timeline_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  time        time NOT NULL,
  label       text NOT NULL,
  order_index int DEFAULT 0
);

-- Preventivi
CREATE TABLE preventivi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Link upload clienti
CREATE TABLE upload_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  gallery_id uuid REFERENCES galleries(id) ON DELETE SET NULL,
  nome       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  expires_at timestamptz,
  max_photos int,
  uploads    int DEFAULT 0,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Trigger: aggiorna updated_at su galleries
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS (Row Level Security)
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventivi     ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_links   ENABLE ROW LEVEL SECURITY;

-- Policy: ogni utente vede solo i propri dati
CREATE POLICY "Profilo personale"      ON profiles       FOR ALL USING (auth.uid() = id);
CREATE POLICY "Gallerie personali"     ON galleries      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Foto delle mie gallerie" ON photos        FOR ALL USING (
  gallery_id IN (SELECT id FROM galleries WHERE user_id = auth.uid())
);
CREATE POLICY "Clienti delle mie gallerie" ON gallery_clients FOR ALL USING (
  gallery_id IN (SELECT id FROM galleries WHERE user_id = auth.uid())
);
CREATE POLICY "Timeline delle mie gallerie" ON timeline_items FOR ALL USING (
  gallery_id IN (SELECT id FROM galleries WHERE user_id = auth.uid())
);
CREATE POLICY "Preventivi personali"   ON preventivi     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Upload links personali" ON upload_links   FOR ALL USING (auth.uid() = user_id);

-- Trigger: crea profilo automaticamente alla registrazione
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
