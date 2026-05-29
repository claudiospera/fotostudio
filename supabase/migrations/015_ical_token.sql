-- 015_ical_token.sql
-- Aggiunge colonna ical_token alla tabella profiles per il feed calendario iCal

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ical_token text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_ical_token_idx ON profiles (ical_token) WHERE ical_token IS NOT NULL;
