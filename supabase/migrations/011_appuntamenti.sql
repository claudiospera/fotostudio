-- Calendari appuntamenti
CREATE TABLE IF NOT EXISTS calendari_appuntamenti (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nome             text NOT NULL,
  data_inizio      date,
  data_fine        date,
  colore           text DEFAULT '#3dba8a',
  attivo           boolean DEFAULT true,
  descrizione      text,
  mostra_descrizione boolean DEFAULT false,
  inizia_settimana text DEFAULT 'lunedi',  -- 'lunedi' | 'domenica'
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE calendari_appuntamenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "utente vede i propri calendari"
  ON calendari_appuntamenti FOR ALL
  USING (auth.uid() = user_id);

-- Prenotazioni
CREATE TABLE IF NOT EXISTS prenotazioni_appuntamenti (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  calendario_id   uuid REFERENCES calendari_appuntamenti(id) ON DELETE CASCADE,
  cliente_nome    text NOT NULL,
  cliente_email   text,
  cliente_tel     text,
  data            date NOT NULL,
  ora_inizio      time NOT NULL,
  ora_fine        time NOT NULL,
  note            text,
  stato           text DEFAULT 'confermata',  -- 'confermata' | 'in_attesa' | 'annullata'
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE prenotazioni_appuntamenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "utente vede le proprie prenotazioni"
  ON prenotazioni_appuntamenti FOR ALL
  USING (auth.uid() = user_id);
