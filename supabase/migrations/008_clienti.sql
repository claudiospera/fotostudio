-- Tabella clienti (anagrafica completa)
CREATE TABLE clienti (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,

  -- Dati evento
  categoria     text NOT NULL,  -- 'Matrimonio' | 'Battesimo' | 'Comunione' | '1 Anno' | '18 Anni' | 'Anniversario' | 'Shooting Fotografico' | 'Altra Cerimonia'
  data_evento   date,
  luogo_evento  text,

  -- Persona 1
  nome1         text NOT NULL,
  tel1          text,
  email1        text,
  whatsapp1     text,
  indirizzo1    text,
  citta1        text,

  -- Persona 2 (coniuge/partner — solo per matrimoni/anniversari)
  nome2         text,
  tel2          text,
  email2        text,
  whatsapp2     text,
  indirizzo2    text,
  citta2        text,

  -- Genitori (battesimi, comunioni, 1 anno, 18 anni)
  genitore1_nome  text,
  genitore1_tel   text,
  genitore2_nome  text,
  genitore2_tel   text,

  -- Album fotografico
  album_tipo      text,   -- es. 'Standard' | 'Luxury' | 'Flush Mount'
  album_formato   text,   -- es. '30x30' | '40x40'
  album_pagine    int,
  album_copertina text,

  -- Video
  video           boolean DEFAULT false,
  video_tipo      text,

  -- Pacchetti scelti (array di stringhe)
  pacchetti       jsonb DEFAULT '[]',  -- [{ nome, prezzo }]

  -- Pagamenti
  importo_totale  numeric DEFAULT 0,
  acconto         numeric DEFAULT 0,
  data_acconto    date,
  saldo           numeric DEFAULT 0,
  data_saldo      date,

  -- Collegamento galleria (opzionale)
  gallery_id      uuid REFERENCES galleries(id) ON DELETE SET NULL,

  -- Note
  note            text,

  -- Colore categoria (per il calendario)
  colore          text DEFAULT '#8ec9b0',

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clienti_own" ON clienti
  FOR ALL USING (auth.uid() = user_id);

-- Indice per data evento (calendario)
CREATE INDEX clienti_data_evento_idx ON clienti (data_evento);
CREATE INDEX clienti_user_id_idx ON clienti (user_id);
