import pg from 'pg';
const { Client } = pg;

const TRANS = {
  'Featured products displayed on the homepage': 'Productos destacados que se muestran en la página de inicio',
  'Hot picks for the summer season': 'Selecciones imprescindibles para la temporada de verano',
  'Stay warm and stylish this winter': 'Mantente abrigado y con estilo este invierno',
  "What's hot and trending right now": 'Lo que es tendencia ahora mismo'
};

const c = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'evershop' });
await c.connect();
const r = await c.query('SELECT collection_id, description FROM collection');
for (const row of r.rows) {
  if (!row.description) continue;
  const d = JSON.parse(row.description);
  let changed = false;
  for (const x of d) for (const col of x.columns || []) for (const b of col.data?.blocks || []) {
    if (b.data?.text && TRANS[b.data.text]) { b.data.text = TRANS[b.data.text]; changed = true; }
  }
  if (changed) {
    await c.query('UPDATE collection SET description=$1 WHERE collection_id=$2', [JSON.stringify(d), row.collection_id]);
    console.log('Actualizado:', row.collection_id);
  }
}
await c.end();
