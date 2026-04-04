-- Seed dati di test (da eseguire dopo aver creato un utente via Supabase Auth)
-- Sostituisci 'YOUR_USER_ID' con l'UUID dell'utente creato

-- Profilo
UPDATE profiles SET name = 'Claudio', studio_name = 'FotoStudio Napoli', plan = 'pro'
WHERE id = 'YOUR_USER_ID';

-- Gallerie di esempio
INSERT INTO galleries (user_id, name, subtitle, type, date, status, cover_color) VALUES
  ('YOUR_USER_ID', 'Marco & Sofia', 'Villa Rufolo, Ravello', 'Matrimonio', '2026-06-15', 'active',  '#2a3830'),
  ('YOUR_USER_ID', 'Ritratto Elena', 'Studio Napoli',         'Ritratto',   '2026-03-20', 'active',  '#2a2a38'),
  ('YOUR_USER_ID', 'Famiglia Russo', 'Parco Virgiliano',      'Famiglia',   '2026-03-08', 'draft',   '#38302a');
