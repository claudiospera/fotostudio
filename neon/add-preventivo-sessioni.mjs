import postgres from 'postgres'

const DATABASE_URL = 'postgresql://neondb_owner:npg_GwBV5b3JTkXq@ep-soft-pine-alpaayny.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
const sql = postgres(DATABASE_URL)

try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS preventivo_sessioni (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug          text UNIQUE NOT NULL,
      user_id       text NOT NULL,
      template_id   text NOT NULL,
      template_nome text NOT NULL,
      colore        text DEFAULT '#8ec9b0',
      voci          jsonb NOT NULL DEFAULT '[]',
      selected      jsonb NOT NULL DEFAULT '[]',
      created_at    timestamptz DEFAULT now(),
      expires_at    timestamptz DEFAULT now() + interval '30 days'
    )
  `)
  console.log('✅ Tabella preventivo_sessioni creata')
} catch (e) {
  console.error('Errore:', e.message)
} finally {
  await sql.end()
}
