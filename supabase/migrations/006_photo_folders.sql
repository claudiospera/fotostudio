-- Aggiunge colonna folder alla tabella photos
ALTER TABLE photos ADD COLUMN IF NOT EXISTS folder text DEFAULT NULL;

-- Indice per filtrare le foto per cartella
CREATE INDEX IF NOT EXISTS photos_folder_idx ON photos(gallery_id, folder);
