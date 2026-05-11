import pg from 'pg';
const { Client } = pg;

const TRANS = {
  'Start your day right with our elegant Ceramic Coffee Cup. Crafted from high-quality ceramic, this cup features a smooth finish and comfortable grip.':
    'Comienza el día con nuestra elegante Taza de Café de Cerámica. Fabricada en cerámica de alta calidad, presenta un acabado liso y un agarre cómodo.',
  'The classic design makes it perfect for both home and office use. Holds 12oz of your favorite beverage and is both microwave and dishwasher safe.':
    'Su diseño clásico la hace perfecta para uso en casa o en la oficina. Tiene capacidad de 12oz y es apta para microondas y lavavajillas.',

  'Keep your desk tidy and organized with our modern Desk Pen Holder. Features multiple compartments for pens, pencils, scissors, and other office supplies.':
    'Mantén tu escritorio ordenado con nuestro moderno Portalápices de Escritorio. Cuenta con varios compartimentos para bolígrafos, lápices, tijeras y otros artículos de oficina.',
  'Made from durable materials with a sleek finish that complements any workspace. Perfect for home office or corporate settings.':
    'Fabricado con materiales duraderos y un acabado elegante que combina con cualquier espacio de trabajo. Perfecto para la oficina en casa o entornos corporativos.',

  'Add a touch of elegance to your table with our Ceramic Candy Bowl. Perfect for serving candy, nuts, or small snacks at parties and gatherings.':
    'Añade un toque de elegancia a tu mesa con nuestro Bol de Cerámica para Dulces. Perfecto para servir caramelos, frutos secos o pequeños aperitivos en fiestas y reuniones.',
  'The smooth ceramic finish and timeless design make it both functional and decorative. Also great for holding keys, jewelry, or other small items.':
    'Su acabado cerámico liso y diseño atemporal lo hacen funcional y decorativo. También es ideal para guardar llaves, joyas u otros objetos pequeños.',

  'Elevate your home decor with our Modern Ceramic Vase. The sleek, contemporary design complements any interior style, from minimalist to traditional.':
    'Realza la decoración de tu hogar con nuestro Jarrón de Cerámica Moderno. Su diseño contemporáneo y elegante combina con cualquier estilo interior, desde minimalista hasta tradicional.',
  'Perfect for displaying fresh flowers, dried arrangements, or as a standalone decorative piece. The sturdy ceramic construction ensures long-lasting beauty.':
    'Perfecto para exhibir flores frescas, arreglos secos o como pieza decorativa por sí solo. Su robusta construcción cerámica garantiza una belleza duradera.',

  'Keep your beverages at the perfect temperature with our Stainless Steel Thermos. Double-wall vacuum insulation keeps drinks hot for 12 hours or cold for 24 hours.':
    'Mantén tus bebidas a la temperatura perfecta con nuestro Termo de Acero Inoxidable. Su aislamiento al vacío de doble pared conserva las bebidas calientes hasta 12 horas o frías hasta 24 horas.',
  'The leak-proof lid and durable stainless steel construction make it perfect for travel, work, or outdoor activities. BPA-free and easy to clean.':
    'Su tapa hermética y la duradera construcción en acero inoxidable lo hacen perfecto para viajar, trabajar o realizar actividades al aire libre. Libre de BPA y fácil de limpiar.'
};

const client = new Client({
  host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'evershop'
});

await client.connect();
const res = await client.query('SELECT product_description_id, description FROM product_description');
let updated = 0;
const unmatched = new Set();
for (const row of res.rows) {
  if (!row.description) continue;
  let desc;
  try { desc = JSON.parse(row.description); } catch { continue; }
  let changed = false;
  for (const r of desc) {
    for (const c of r.columns || []) {
      for (const b of c.data?.blocks || []) {
        if (b.type === 'paragraph' && b.data?.text) {
          if (TRANS[b.data.text]) {
            b.data.text = TRANS[b.data.text];
            changed = true;
          } else if (!Object.values(TRANS).includes(b.data.text)) {
            unmatched.add(b.data.text);
          }
        }
      }
    }
  }
  if (changed) {
    await client.query('UPDATE product_description SET description=$1 WHERE product_description_id=$2', [JSON.stringify(desc), row.product_description_id]);
    updated++;
  }
}
console.log(`Updated: ${updated}`);
console.log(`Unmatched: ${unmatched.size}`);
for (const s of unmatched) console.log('  -', s.slice(0, 120));
await client.end();
