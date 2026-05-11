#!/usr/bin/env node
// Segundo pase: traduce más patrones que el script v1 no cubrió.
// - Texto entre cualquier par de tags JSX: >X< (no solo h1-h6/p/span/etc)
// - Atributos extra: header, description, tooltip, caption, legend
// - Enums tipo "Sale Statistics", "Add Products" mediante un glosario expandido
// - All-caps button labels (SIGN IN, SAVE, etc.)

import fs from 'fs';
import path from 'path';

const ROOT = '/Users/berserk/Documents/My/E-comerce/packages/evershop/src';

// Glosario expandido v2
const GLOSSARY_RAW = [
  // Multi-palabra primero (orden importa para overlap)
  ['Add Products', 'Agregar productos'],
  ['Add Product', 'Agregar producto'],
  ['New Widget', 'Nuevo widget'],
  ['New Product', 'Nuevo producto'],
  ['New Category', 'Nueva categoría'],
  ['New Collection', 'Nueva colección'],
  ['New Attribute', 'Nuevo atributo'],
  ['New Coupon', 'Nuevo cupón'],
  ['New Customer', 'Nuevo cliente'],
  ['New Page', 'Nueva página'],
  ['Cancel Order', 'Cancelar pedido'],
  ['Cancel order', 'Cancelar pedido'],
  ['General Information', 'Información general'],
  ['General information', 'Información general'],
  ['Sale Statistics', 'Estadísticas de venta'],
  ['Lifetime Sales', 'Ventas totales'],
  ['Total Orders', 'Total de pedidos'],
  ['Total Customers', 'Total de clientes'],
  ['Total Products', 'Total de productos'],
  ['Total Sales', 'Total de ventas'],
  ['Total revenue', 'Ingresos totales'],
  ['Average Order Value', 'Valor promedio de pedido'],
  ['Recent Orders', 'Pedidos recientes'],
  ['Recent Customers', 'Clientes recientes'],
  ['Recent Activity', 'Actividad reciente'],
  ['Top Selling Products', 'Productos más vendidos'],
  ['Best Sellers', 'Más vendidos'],
  ['Top Categories', 'Categorías top'],
  ['Widget Settings', 'Configuración del widget'],
  ['Page Settings', 'Configuración de página'],
  ['Store Setting', 'Configuración de tienda'],
  ['Store Settings', 'Configuración de tienda'],
  ['Tax Setting', 'Configuración de impuestos'],
  ['Tax Settings', 'Configuración de impuestos'],
  ['Shipping Setting', 'Configuración de envío'],
  ['Shipping Settings', 'Configuración de envío'],
  ['Payment Setting', 'Configuración de pagos'],
  ['Payment Settings', 'Configuración de pagos'],
  ['Tax Class', 'Clase de impuesto'],
  ['Tax Classes', 'Clases de impuestos'],
  ['Tax Rate', 'Tasa de impuesto'],
  ['Tax Rates', 'Tasas de impuesto'],
  ['Shipping Zone', 'Zona de envío'],
  ['Shipping Zones', 'Zonas de envío'],
  ['Shipping Method', 'Método de envío'],
  ['Shipping Methods', 'Métodos de envío'],
  ['Payment Method', 'Método de pago'],
  ['Payment Methods', 'Métodos de pago'],
  ['Payment Status', 'Estado del pago'],
  ['Shipment Status', 'Estado del envío'],
  ['Order Status', 'Estado del pedido'],
  ['Product Status', 'Estado del producto'],
  ['Variant Group', 'Grupo de variantes'],
  ['Variant Groups', 'Grupos de variantes'],
  ['Product Type', 'Tipo de producto'],
  ['Product type', 'Tipo de producto'],
  ['Custom Options', 'Opciones personalizadas'],
  ['Custom Option', 'Opción personalizada'],
  ['Inventory Management', 'Manejo de inventario'],
  ['SEO Information', 'Información SEO'],
  ['SEO Setting', 'Configuración SEO'],
  ['Search engine optimize', 'Optimización para buscadores'],
  ['Manage stock', 'Manejar inventario'],
  ['Manage inventory', 'Manejar inventario'],
  ['Stock availability', 'Disponibilidad'],
  ['Out of stock', 'Sin inventario'],
  ['In stock', 'Disponible'],
  ['Low stock', 'Inventario bajo'],
  ['Stock status', 'Estado del inventario'],

  // Confirmaciones, alertas
  ['You have no products to display', 'No hay productos para mostrar'],
  ['You have no collections to display', 'No hay colecciones para mostrar'],
  ['You have no categories to display', 'No hay categorías para mostrar'],
  ['You have no attribute groups to display', 'No hay grupos de atributos para mostrar'],
  ['You have no orders to display', 'No hay pedidos para mostrar'],
  ['You have no customers to display', 'No hay clientes para mostrar'],
  ['You have no coupons to display', 'No hay cupones para mostrar'],
  ['You have no pages to display', 'No hay páginas para mostrar'],
  ['You have no widgets to display', 'No hay widgets para mostrar'],
  ['There is no category', 'No hay categorías'],
  ['There are no items', 'No hay artículos'],
  ['Select Parent Category', 'Seleccionar categoría padre'],
  ['Select Category', 'Seleccionar categoría'],
  ['Select the list of attribute', 'Seleccionar la lista de atributos'],
  ['Select groups the attribute belongs to', 'Seleccionar grupos a los que pertenece el atributo'],

  // Comunes single-word
  ['Status', 'Estado'],
  ['Total', 'Total'],
  ['Subtotal', 'Subtotal'],
  ['Stock', 'Inventario'],
  ['Inventory', 'Inventario'],
  ['Price', 'Precio'],
  ['Quantity', 'Cantidad'],
  ['Qty', 'Cant.'],
  ['Cost', 'Costo'],
  ['Weight', 'Peso'],
  ['Tax', 'Impuesto'],
  ['Taxes', 'Impuestos'],
  ['Discount', 'Descuento'],
  ['Discounts', 'Descuentos'],
  ['Shipping', 'Envío'],
  ['Shipping Address', 'Dirección de envío'],
  ['Billing Address', 'Dirección de facturación'],
  ['General', 'General'],
  ['Setting', 'Configuración'],
  ['Settings', 'Configuración'],
  ['Configuration', 'Configuración'],
  ['Description', 'Descripción'],
  ['Type', 'Tipo'],
  ['Group', 'Grupo'],
  ['Groups', 'Grupos'],
  ['Code', 'Código'],
  ['Note', 'Nota'],
  ['Notes', 'Notas'],
  ['Date', 'Fecha'],
  ['Time', 'Hora'],
  ['Active', 'Activo'],
  ['Inactive', 'Inactivo'],
  ['Enabled', 'Habilitado'],
  ['Disabled', 'Deshabilitado'],
  ['Visible', 'Visible'],
  ['Required', 'Obligatorio'],
  ['Optional', 'Opcional'],
  ['Default', 'Por defecto'],
  ['Custom', 'Personalizado'],
  ['Pending', 'Pendiente'],
  ['Processing', 'Procesando'],
  ['Completed', 'Completado'],
  ['Cancelled', 'Cancelado'],
  ['Canceled', 'Cancelado'],
  ['Closed', 'Cerrado'],
  ['Paid', 'Pagado'],
  ['Failed', 'Fallido'],
  ['Shipped', 'Enviado'],
  ['Delivered', 'Entregado'],
  ['Refunded', 'Reembolsado'],
  ['Unknown', 'Desconocido'],
  ['Simple', 'Simple'],
  ['Configurable', 'Configurable'],
  ['Show', 'Mostrar'],
  ['Hide', 'Ocultar'],
  ['Yes', 'Sí'],
  ['Open', 'Abrir'],
  ['Save', 'Guardar'],
  ['Cancel', 'Cancelar'],
  ['Delete', 'Eliminar'],
  ['Edit', 'Editar'],
  ['Update', 'Actualizar'],
  ['Create', 'Crear'],
  ['Add', 'Agregar'],
  ['New', 'Nuevo'],
  ['Close', 'Cerrar'],
  ['Confirm', 'Confirmar'],
  ['Submit', 'Enviar'],
  ['Search', 'Buscar'],
  ['Filter', 'Filtrar'],
  ['Filters', 'Filtros'],
  ['Reset', 'Restablecer'],
  ['Clear', 'Limpiar'],
  ['Apply', 'Aplicar'],
  ['Back', 'Volver'],
  ['Next', 'Siguiente'],
  ['Previous', 'Anterior'],
  ['Continue', 'Continuar'],
  ['View', 'Ver'],
  ['Customers', 'Clientes'],
  ['Customer', 'Cliente'],
  ['Products', 'Productos'],
  ['Product', 'Producto'],
  ['Categories', 'Categorías'],
  ['Category', 'Categoría'],
  ['Collections', 'Colecciones'],
  ['Collection', 'Colección'],
  ['Attributes', 'Atributos'],
  ['Attribute', 'Atributo'],
  ['Orders', 'Pedidos'],
  ['Order', 'Pedido'],
  ['Coupons', 'Cupones'],
  ['Coupon', 'Cupón'],
  ['Pages', 'Páginas'],
  ['Page', 'Página'],
  ['Widgets', 'Widgets'],
  ['Widget', 'Widget'],
  ['Catalog', 'Catálogo'],
  ['Sale', 'Ventas'],
  ['Sales', 'Ventas'],
  ['Promotion', 'Promociones'],
  ['Promotions', 'Promociones'],
  ['Dashboard', 'Panel'],
  ['Reports', 'Reportes'],
  ['Report', 'Reporte'],
  ['Image', 'Imagen'],
  ['Images', 'Imágenes'],
  ['Upload', 'Subir'],
  ['Download', 'Descargar'],
  ['Address', 'Dirección'],
  ['Country', 'País'],
  ['Province', 'Provincia'],
  ['State', 'Provincia'],
  ['City', 'Ciudad'],
  ['Phone', 'Teléfono'],
  ['Telephone', 'Teléfono'],
  ['Currency', 'Moneda'],
  ['Carrier', 'Transportista'],
  ['Method', 'Método'],
  ['Methods', 'Métodos'],
  ['Email', 'Correo'],
  ['Password', 'Contraseña'],
  ['Name', 'Nombre'],
  ['Account', 'Cuenta'],
  ['Profile', 'Perfil'],
  ['Items', 'Artículos'],
  ['Item', 'Artículo'],
  ['Actions', 'Acciones'],
  ['Action', 'Acción'],
  ['Thumbnail', 'Miniatura'],
  ['Title', 'Título'],
  ['Layout', 'Diseño'],
  ['Theme', 'Tema'],
  ['Logo', 'Logo'],
  ['URL', 'URL'],
  ['Weekly', 'Semanal'],
  ['Daily', 'Diario'],
  ['Monthly', 'Mensual'],
  ['Yearly', 'Anual'],
];

// Sort by length descending so longer matches first
const GLOSSARY = GLOSSARY_RAW.sort((a, b) => b[0].length - a[0].length);

// All caps versions: SAVE, CANCEL, SIGN IN, etc.
const ALL_CAPS = [
  ['SIGN IN', 'INICIAR SESIÓN'],
  ['SIGN OUT', 'CERRAR SESIÓN'],
  ['LOG IN', 'INICIAR SESIÓN'],
  ['LOG OUT', 'CERRAR SESIÓN'],
  ['LOGIN', 'INICIAR SESIÓN'],
  ['LOGOUT', 'CERRAR SESIÓN'],
  ['SAVE', 'GUARDAR'],
  ['CANCEL', 'CANCELAR'],
  ['DELETE', 'ELIMINAR'],
  ['EDIT', 'EDITAR'],
  ['SUBMIT', 'ENVIAR'],
  ['CREATE', 'CREAR'],
  ['UPDATE', 'ACTUALIZAR'],
  ['CONTINUE', 'CONTINUAR'],
  ['SEARCH', 'BUSCAR'],
  ['ADD', 'AGREGAR'],
  ['VIEW', 'VER'],
  ['CONFIRM', 'CONFIRMAR'],
];

function translateLiteral(s) {
  const trimmed = s.trim();
  for (const [en, es] of GLOSSARY) {
    if (trimmed === en) {
      const left = s.match(/^\s*/)[0];
      const right = s.match(/\s*$/)[0];
      return left + es + right;
    }
  }
  return null;
}

function translateAllCaps(s) {
  const trimmed = s.trim();
  for (const [en, es] of ALL_CAPS) {
    if (trimmed === en) {
      const left = s.match(/^\s*/)[0];
      const right = s.match(/\s*$/)[0];
      return left + es + right;
    }
  }
  return null;
}

function shouldSkipFile(filePath) {
  if (filePath.includes('/pages/frontStore/')) return true;
  if (filePath.includes('/migration/')) return true;
  if (filePath.includes('__tests__')) return true;
  if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) return true;
  if (filePath.endsWith('.graphql')) return true;
  return false;
}

function listFiles(dir, exts = ['.tsx', '.jsx', '.ts', '.js']) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      out.push(...listFiles(full, exts));
    } else if (entry.isFile() && exts.includes(path.extname(entry.name))) {
      if (!shouldSkipFile(full)) out.push(full);
    }
  }
  return out;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;
  const stats = { attrs: 0, jsxText: 0, allcaps: 0, toasts: 0, validations: 0 };

  // 1. Atributos extendidos (incluye header, description, tooltip)
  content = content.replace(
    /(\b(?:placeholder|title|label|aria-label|alt|name|header|description|tooltip|caption|legend)\s*=\s*)(['"])([^'"]+?)\2/g,
    (m, prefix, q, val) => {
      const t = translateLiteral(val);
      if (t === null) return m;
      stats.attrs++;
      return `${prefix}${q}${t}${q}`;
    }
  );

  // 2. Texto JSX entre cualquier par de tags ABIERTOS y CERRADOS del MISMO nombre
  // Match >TEXT< donde TEXT no contiene < ni > ni { (ni newlines complejas)
  content = content.replace(/>([^<>{}\n]+)</g, (m, text) => {
    if (!text.trim()) return m;
    const t = translateLiteral(text);
    if (t === null) return m;
    stats.jsxText++;
    return `>${t}<`;
  });

  // 3. Texto JSX en mayúsculas (botones, headers)
  content = content.replace(/>([A-Z][A-Z ]+[A-Z])</g, (m, text) => {
    const t = translateAllCaps(text);
    if (t === null) return m;
    stats.allcaps++;
    return `>${t}<`;
  });
  // También en strings sueltos (raros pero existen)
  content = content.replace(/(['"])(SIGN IN|SIGN OUT|LOG IN|LOG OUT|LOGIN|LOGOUT|SAVE|CANCEL|DELETE|EDIT|SUBMIT|CREATE|UPDATE|CONTINUE|SEARCH|ADD|VIEW|CONFIRM)\1/g,
    (m, q, text) => {
      const t = translateAllCaps(text);
      if (t === null) return m;
      stats.allcaps++;
      return `${q}${t}${q}`;
    }
  );

  // 4. Toast calls extendidos (ya cubiertos en pase 1, pero por si queda algo)
  content = content.replace(
    /(toast\.(?:success|error|info|warning|warn)\s*\(\s*)(['"])([^'"]+?)\2/g,
    (m, prefix, q, val) => {
      const t = translateLiteral(val);
      if (t === null) return m;
      stats.toasts++;
      return `${prefix}${q}${t}${q}`;
    }
  );

  // 5. Validaciones en formularios react-hook-form: required: 'X is required', etc.
  // Patrones: required: 'X', validate: () => '...'
  content = content.replace(
    /(required\s*:\s*)(['"])([^'"]+?)\2/g,
    (m, prefix, q, val) => {
      // Conservar booleanos: required: true (no es string)
      const t = translateLiteral(val);
      if (t === null) return m;
      stats.validations++;
      return `${prefix}${q}${t}${q}`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return stats;
  }
  return null;
}

const files = listFiles(ROOT);
console.log(`Pase 2: revisando ${files.length} archivos.`);

let totalFiles = 0;
const totals = { attrs: 0, jsxText: 0, allcaps: 0, toasts: 0, validations: 0 };

for (const f of files) {
  const r = processFile(f);
  if (r) {
    totalFiles++;
    for (const k of Object.keys(totals)) totals[k] += r[k];
  }
}

console.log(`\nResumen pase 2:`);
console.log(`  Archivos modificados:   ${totalFiles}`);
console.log(`  Atributos:              ${totals.attrs}`);
console.log(`  Texto JSX:              ${totals.jsxText}`);
console.log(`  All-caps:               ${totals.allcaps}`);
console.log(`  Toasts:                 ${totals.toasts}`);
console.log(`  Validaciones (required):${totals.validations}`);
const sum = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(`  Total:                  ${sum}`);
