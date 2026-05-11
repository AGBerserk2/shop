import pg from 'pg';
const { Client } = pg;

const PAGE_TEXTS = {
  'Welcome to Our Store': 'Bienvenido a Nuestra Tienda',
  'We are passionate about bringing you high-quality ceramic and stainless steel products that combine functionality with elegant design. Our carefully curated collection features items that enhance your daily life, from morning coffee to home organization.':
    'Nos apasiona ofrecerte productos de cerámica y acero inoxidable de alta calidad que combinan funcionalidad con un diseño elegante. Nuestra colección, cuidadosamente seleccionada, incluye artículos que mejoran tu vida diaria, desde el café de la mañana hasta la organización del hogar.',
  'Our Mission': 'Nuestra Misión',
  "We believe that everyday objects should be both beautiful and practical. That's why we source products that are not only aesthetically pleasing but also durable and functional. Each item in our collection is selected with care to ensure it meets our high standards.":
    'Creemos que los objetos cotidianos deben ser bellos y prácticos a la vez. Por eso elegimos productos que no solo son estéticamente agradables, sino también duraderos y funcionales. Cada artículo de nuestra colección se selecciona con cuidado para garantizar que cumpla con nuestros altos estándares.',
  'Quality You Can Trust': 'Calidad en la que Puedes Confiar',
  "All our products are made from premium materials - from food-safe ceramics to BPA-free stainless steel. We work directly with manufacturers who share our commitment to quality and sustainability. Whether you're looking for office supplies, drinkware, or home decor, you can trust that every item has been thoughtfully designed and rigorously tested.":
    'Todos nuestros productos están hechos con materiales de primera calidad: desde cerámicas aptas para alimentos hasta acero inoxidable libre de BPA. Trabajamos directamente con fabricantes que comparten nuestro compromiso con la calidad y la sostenibilidad. Ya sea que busques artículos de oficina, vasos o decoración para el hogar, puedes confiar en que cada artículo ha sido diseñado con esmero y probado rigurosamente.',
  'Customer Satisfaction': 'Satisfacción del Cliente',
  'Your satisfaction is our top priority. We offer fast shipping, easy returns, and dedicated customer support to ensure your shopping experience is seamless. If you have any questions about our products or need assistance, our team is always here to help.':
    'Tu satisfacción es nuestra principal prioridad. Ofrecemos envío rápido, devoluciones sencillas y atención al cliente dedicada para garantizar una experiencia de compra fluida. Si tienes alguna pregunta sobre nuestros productos o necesitas ayuda, nuestro equipo siempre está disponible.',
  'Our carefully curated collection': 'Nuestra colección cuidadosamente seleccionada'
};

const c = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'evershop' });
await c.connect();

// CMS page
const r1 = await c.query("SELECT cms_page_description_id, content FROM cms_page_description WHERE name='Sobre Nosotros'");
for (const row of r1.rows) {
  const data = JSON.parse(row.content);
  for (const r of data) for (const col of r.columns || []) for (const b of col.data?.blocks || []) {
    if (b.data?.text && PAGE_TEXTS[b.data.text]) b.data.text = PAGE_TEXTS[b.data.text];
    if (b.data?.caption && PAGE_TEXTS[b.data.caption]) b.data.caption = PAGE_TEXTS[b.data.caption];
  }
  await c.query('UPDATE cms_page_description SET content=$1 WHERE cms_page_description_id=$2', [JSON.stringify(data), row.cms_page_description_id]);
  console.log('CMS About Us actualizado');
}

// Menu widget
const r2 = await c.query("SELECT widget_id, settings FROM widget WHERE type='basic_menu'");
for (const row of r2.rows) {
  const s = row.settings;
  const map = { 'Shop': 'Tienda', 'Accessories': 'Accesorios', 'About us': 'Sobre Nosotros' };
  const walk = (items) => {
    for (const m of items || []) {
      if (map[m.name]) m.name = map[m.name];
      if (m.url === '/accessories') m.url = '/accesorios', m.uuid = '/accesorios';
      if (m.children) walk(m.children);
    }
  };
  walk(s.menus);
  await c.query('UPDATE widget SET settings=$1 WHERE widget_id=$2', [JSON.stringify(s), row.widget_id]);
  console.log('Menú principal actualizado');
}

// Slideshow widget
const r3 = await c.query("SELECT widget_id, settings FROM widget WHERE type='simple_slider'");
const SLIDE = {
  'Premium Quality Products': 'Productos de Calidad Premium',
  'Discover our exquisite collection of ceramic and stainless steel products': 'Descubre nuestra exquisita colección de productos de cerámica y acero inoxidable',
  'Shop Now': 'Comprar Ahora',
  'Crafted With Care': 'Elaborado con Esmero',
  'Elegant designs that enhance your daily life, from morning coffee to home organization': 'Diseños elegantes que realzan tu vida diaria, desde el café de la mañana hasta la organización del hogar',
  'View Collection': 'Ver Colección'
};
for (const row of r3.rows) {
  const s = row.settings;
  for (const sl of s.slides || []) {
    for (const k of ['headline', 'subText', 'buttonText']) if (SLIDE[sl[k]]) sl[k] = SLIDE[sl[k]];
    if (sl.buttonLink === '/accessories') sl.buttonLink = '/accesorios';
  }
  await c.query('UPDATE widget SET settings=$1 WHERE widget_id=$2', [JSON.stringify(s), row.widget_id]);
  console.log('Slideshow actualizado');
}

// Widget names (admin labels)
await c.query("UPDATE widget SET name='Menú principal' WHERE name='Main menu'");
await c.query("UPDATE widget SET name='Carrusel de inicio' WHERE name='Homepage Slideshow'");
await c.query("UPDATE widget SET name='Productos destacados' WHERE name='Featured Products'");
console.log('Nombres de widgets actualizados');

await c.end();
