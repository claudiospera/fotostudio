-- Aggiunge colonna extra (jsonb) alla tabella clienti
-- Usata per campi specifici per tipo: indirizzi/orari matrimonio,
-- social/facebook contatti, genitori completi, album note, video dettagli.

ALTER TABLE clienti
  ADD COLUMN IF NOT EXISTS extra jsonb DEFAULT '{}';
