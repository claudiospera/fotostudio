import postgres from 'postgres'

const DATABASE_URL = 'postgresql://neondb_owner:npg_GwBV5b3JTkXq@ep-soft-pine-alpaayny.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'
const sql = postgres(DATABASE_URL)

try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS shop_orders (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      status            text NOT NULL DEFAULT 'pending',
      payment_method    text NOT NULL DEFAULT 'studio',
      payment_status    text NOT NULL DEFAULT 'unpaid',
      customer_name     text NOT NULL,
      customer_email    text NOT NULL,
      customer_phone    text NOT NULL,
      notes             text,
      items             jsonb NOT NULL DEFAULT '[]',
      total             integer NOT NULL DEFAULT 0,
      stripe_session_id text,
      created_at        timestamptz DEFAULT now(),
      updated_at        timestamptz DEFAULT now()
    )
  `)
  console.log('✅ Tabella shop_orders creata')
} catch (e) {
  console.error('Errore:', e.message)
} finally {
  await sql.end()
}
