-- Add contact and payment fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telefono  text,
  ADD COLUMN IF NOT EXISTS email     text,
  ADD COLUMN IF NOT EXISTS iban      text;
