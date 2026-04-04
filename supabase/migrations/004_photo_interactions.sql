-- Preferiti foto (client anonimo identificato da session_id)
CREATE TABLE photo_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    uuid REFERENCES photos(id)   ON DELETE CASCADE NOT NULL,
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  session_id  text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(photo_id, session_id)
);

-- Commenti foto
CREATE TABLE photo_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id    uuid REFERENCES photos(id)   ON DELETE CASCADE NOT NULL,
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  session_id  text NOT NULL,
  author_name text,
  body        text NOT NULL CHECK (char_length(body) <= 1000),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE photo_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_comments  ENABLE ROW LEVEL SECURITY;

-- Chiunque (portale cliente, nessun login) può inserire e leggere
CREATE POLICY "Preferiti inserimento pubblico"
  ON photo_favorites FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Preferiti lettura pubblica"
  ON photo_favorites FOR SELECT TO public USING (true);

CREATE POLICY "Preferiti eliminazione propria"
  ON photo_favorites FOR DELETE TO public USING (true);

CREATE POLICY "Commenti inserimento pubblico"
  ON photo_comments FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Commenti lettura pubblica"
  ON photo_comments FOR SELECT TO public USING (true);
