-- Crea il bucket "photos" per Supabase Storage
-- public = true → le URL delle foto sono accessibili senza token (CDN pubblico)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  26214400,  -- 25 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: il fotografo autenticato può caricare nella propria cartella
-- Path struttura: {user_id}/{gallery_id}/{filename}
CREATE POLICY "Fotografo upload foto proprie"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: lettura pubblica (clienti possono vedere le foto via URL)
CREATE POLICY "Foto lettura pubblica"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- Policy: il fotografo può eliminare solo le proprie foto
CREATE POLICY "Fotografo elimina foto proprie"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: il fotografo può aggiornare (replace) le proprie foto
CREATE POLICY "Fotografo aggiorna foto proprie"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
