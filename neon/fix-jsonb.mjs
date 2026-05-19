import postgres from 'postgres'

const sql = postgres('postgresql://neondb_owner:npg_GwBV5b3JTkXq@ep-soft-pine-alpaayny.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require')

const fixes = [
  ['clienti.pacchetti',          sql`UPDATE clienti SET pacchetti = (pacchetti #>> '{}')::jsonb WHERE jsonb_typeof(pacchetti) = 'string'`],
  ['clienti.extra',              sql`UPDATE clienti SET extra = (extra #>> '{}')::jsonb WHERE jsonb_typeof(extra) = 'string'`],
  ['preventivi.voci',            sql`UPDATE preventivi SET voci = (voci #>> '{}')::jsonb WHERE jsonb_typeof(voci) = 'string'`],
  ['galleries.settings',         sql`UPDATE galleries SET settings = (settings #>> '{}')::jsonb WHERE settings IS NOT NULL AND jsonb_typeof(settings) = 'string'`],
  ['print_orders.items',         sql`UPDATE print_orders SET items = (items #>> '{}')::jsonb WHERE jsonb_typeof(items) = 'string'`],
  ['preventivo_templates.sezioni', sql`UPDATE preventivo_templates SET sezioni = (sezioni #>> '{}')::jsonb WHERE jsonb_typeof(sezioni) = 'string'`],
  ['preventivi_pubblici.voci',   sql`UPDATE preventivi_pubblici SET voci = (voci #>> '{}')::jsonb WHERE jsonb_typeof(voci) = 'string'`],
]

const results = await Promise.all(fixes.map(([, q]) => q))
fixes.forEach(([name], i) => console.log(`✓ ${name} → ${results[i].count} righe corrette`))

await sql.end()
console.log('\n✅ Done')
