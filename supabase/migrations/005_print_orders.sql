CREATE TABLE print_orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id  uuid REFERENCES galleries(id) ON DELETE CASCADE NOT NULL,
  session_id  text NOT NULL,
  client_name text,
  client_email text,
  items       jsonb NOT NULL DEFAULT '[]',
  total       numeric NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'nuovo', -- 'nuovo' | 'confermato' | 'spedito' | 'completato'
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;

-- Il cliente (anonimo) può inserire ordini
CREATE POLICY "Ordini inserimento pubblico"
  ON print_orders FOR INSERT TO public WITH CHECK (true);

-- Il fotografo autenticato può leggere solo gli ordini delle sue gallerie
CREATE POLICY "Ordini lettura fotografo"
  ON print_orders FOR SELECT TO authenticated
  USING (gallery_id IN (SELECT id FROM galleries WHERE user_id = auth.uid()));

-- Il fotografo può aggiornare lo stato degli ordini
CREATE POLICY "Ordini aggiornamento fotografo"
  ON print_orders FOR UPDATE TO authenticated
  USING (gallery_id IN (SELECT id FROM galleries WHERE user_id = auth.uid()));
