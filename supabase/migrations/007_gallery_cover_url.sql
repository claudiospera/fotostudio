-- Aggiunge colonna cover_url alla tabella galleries
-- Contiene l'URL della foto scelta manualmente come cover
ALTER TABLE galleries ADD COLUMN IF NOT EXISTS cover_url text DEFAULT NULL;
