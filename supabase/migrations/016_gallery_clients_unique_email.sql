-- Add unique constraint on (gallery_id, email) so ON CONFLICT works for auto-registration
ALTER TABLE gallery_clients
  ADD CONSTRAINT gallery_clients_gallery_id_email_key UNIQUE (gallery_id, email);
