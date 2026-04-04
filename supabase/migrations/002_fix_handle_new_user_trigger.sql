-- Fix trigger handle_new_user
-- Problema: mancava SET search_path e ON CONFLICT DO NOTHING
-- Causa: utenti creati via admin API / service role non ottengono il profilo

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ricrea il trigger (per sicurezza)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Se info@claudiofotografo.com esiste già in auth.users ma non ha il profilo,
-- crea il profilo manualmente (idempotente)
INSERT INTO public.profiles (id, name, studio_name, plan)
SELECT
  u.id,
  'Claudio',
  'FotoStudio Napoli',
  'pro'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'info@claudiofotografo.com'
  AND p.id IS NULL;
