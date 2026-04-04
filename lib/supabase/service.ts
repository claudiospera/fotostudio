import { createClient } from '@supabase/supabase-js'

// Usa il service role key — bypassa RLS.
// Solo lato server, mai esporre al client.
export const createServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
