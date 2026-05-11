#!/usr/bin/env node
// Traduce strings hardcoded del panel de admin de EverShop a español.
// Edita SOLO archivos en packages/evershop/src/. No toca dist/.
// Después de correr este script, ejecutar: npm run compile && npm run build

import fs from 'fs';
import path from 'path';

const ROOT = '/Users/berserk/Documents/My/E-comerce/packages/evershop/src';

// Glosario completo: en (lowercase keys aren't used; we match case-sensitively)
// Las claves son los strings a buscar EXACTOS (con quotes); los valores son la traducción.
// Orden importa: los más largos primero para que no se canibalicen.
const GLOSSARY = [
  // Frases largas de toasts y mensajes (priorizar antes de palabras sueltas)
  ['Product created successfully', 'Producto creado correctamente'],
  ['Product updated successfully', 'Producto actualizado correctamente'],
  ['Product deleted successfully', 'Producto eliminado correctamente'],
  ['Category created successfully', 'Categoría creada correctamente'],
  ['Category updated successfully', 'Categoría actualizada correctamente'],
  ['Category deleted successfully', 'Categoría eliminada correctamente'],
  ['Collection created successfully', 'Colección creada correctamente'],
  ['Collection updated successfully', 'Colección actualizada correctamente'],
  ['Collection deleted successfully', 'Colección eliminada correctamente'],
  ['Attribute created successfully', 'Atributo creado correctamente'],
  ['Attribute updated successfully', 'Atributo actualizado correctamente'],
  ['Attribute deleted successfully', 'Atributo eliminado correctamente'],
  ['Coupon created successfully', 'Cupón creado correctamente'],
  ['Coupon updated successfully', 'Cupón actualizado correctamente'],
  ['Coupon deleted successfully', 'Cupón eliminado correctamente'],
  ['Customer created successfully', 'Cliente creado correctamente'],
  ['Customer updated successfully', 'Cliente actualizado correctamente'],
  ['Customer deleted successfully', 'Cliente eliminado correctamente'],
  ['Order updated successfully', 'Pedido actualizado correctamente'],
  ['Page created successfully', 'Página creada correctamente'],
  ['Page updated successfully', 'Página actualizada correctamente'],
  ['Page deleted successfully', 'Página eliminada correctamente'],
  ['Widget created successfully', 'Widget creado correctamente'],
  ['Widget updated successfully', 'Widget actualizado correctamente'],
  ['Widget deleted successfully', 'Widget eliminado correctamente'],
  ['Setting saved successfully', 'Configuración guardada correctamente'],
  ['Settings saved successfully', 'Configuración guardada correctamente'],
  ['Failed to save', 'No se pudo guardar'],
  ['Failed to delete', 'No se pudo eliminar'],
  ['Failed to update', 'No se pudo actualizar'],
  ['Failed to create', 'No se pudo crear'],
  ['Something went wrong', 'Algo salió mal'],
  ['An error occurred', 'Ocurrió un error'],
  ['An unexpected error occurred. Please try again.', 'Ocurrió un error inesperado. Por favor intenta de nuevo.'],
  ['Are you sure you want to delete?', '¿Seguro que quieres eliminar?'],
  ['Are you sure you want to delete this?', '¿Seguro que quieres eliminar esto?'],
  ['Are you sure?', '¿Estás seguro?'],
  ['This action cannot be undone', 'Esta acción no se puede deshacer'],
  ['No data available', 'Sin datos disponibles'],
  ['No data found', 'No se encontraron datos'],
  ['No items found', 'No se encontraron resultados'],
  ['No results found', 'No se encontraron resultados'],
  ['Loading...', 'Cargando...'],
  ['Please wait', 'Espera un momento'],
  ['Please wait...', 'Espera un momento...'],
  ['Please select', 'Por favor selecciona'],
  ['Please select...', 'Por favor selecciona...'],
  ['Please enter', 'Por favor ingresa'],
  ['Please choose', 'Por favor elige'],

  // Validaciones
  ['Product name is required', 'El nombre del producto es obligatorio'],
  ['Name is required', 'El nombre es obligatorio'],
  ['Email is required', 'El correo es obligatorio'],
  ['Password is required', 'La contraseña es obligatoria'],
  ['SKU must be unique', 'El SKU debe ser único'],
  ['SKU is required', 'El SKU es obligatorio'],
  ['Price is required', 'El precio es obligatorio'],
  ['Quantity is required', 'La cantidad es obligatoria'],
  ['Invalid email', 'Correo no válido'],
  ['Invalid email address', 'Correo no válido'],
  ['Invalid password', 'Contraseña no válida'],
  ['Invalid value', 'Valor no válido'],
  ['Field is required', 'Este campo es obligatorio'],
  ['This field is required', 'Este campo es obligatorio'],
  ['is required', 'es obligatorio'],
  ['must be unique', 'debe ser único'],
  ['must be a number', 'debe ser un número'],
  ['must be greater than', 'debe ser mayor que'],
  ['must be less than', 'debe ser menor que'],

  // Headers de páginas (h1, h2 comunes)
  ['Dashboard', 'Panel'],
  ['Customers', 'Clientes'],
  ['Customer', 'Cliente'],
  ['Products', 'Productos'],
  ['Product', 'Producto'],
  ['Categories', 'Categorías'],
  ['Category', 'Categoría'],
  ['Collections', 'Colecciones'],
  ['Collection', 'Colección'],
  ['Attributes', 'Atributos'],
  ['Attribute groups', 'Grupos de atributos'],
  ['Attribute group', 'Grupo de atributos'],
  ['Attribute', 'Atributo'],
  ['Orders', 'Pedidos'],
  ['Order', 'Pedido'],
  ['Coupons', 'Cupones'],
  ['Coupon', 'Cupón'],
  ['Pages', 'Páginas'],
  ['Page', 'Página'],
  ['Widgets', 'Widgets'],
  ['Widget', 'Widget'],
  ['Settings', 'Configuración'],
  ['Setting', 'Configuración'],
  ['Catalog', 'Catálogo'],
  ['Sale', 'Ventas'],
  ['Sales', 'Ventas'],
  ['Promotion', 'Promociones'],
  ['Promotions', 'Promociones'],
  ['Reports', 'Reportes'],
  ['Report', 'Reporte'],

  // Botones comunes
  ['Save Changes', 'Guardar cambios'],
  ['Save changes', 'Guardar cambios'],
  ['Save', 'Guardar'],
  ['Cancel', 'Cancelar'],
  ['Delete', 'Eliminar'],
  ['Edit', 'Editar'],
  ['Update', 'Actualizar'],
  ['Create', 'Crear'],
  ['Add New', 'Agregar nuevo'],
  ['Add new', 'Agregar nuevo'],
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
  ['Yes', 'Sí'],
  // 'No' es ambiguo (puede ser variable o literal); evitar reemplazo automático.

  // Auth
  ['Sign In', 'Iniciar sesión'],
  ['Sign in', 'Iniciar sesión'],
  ['Sign Out', 'Cerrar sesión'],
  ['Sign out', 'Cerrar sesión'],
  ['Log In', 'Iniciar sesión'],
  ['Log in', 'Iniciar sesión'],
  ['Login', 'Iniciar sesión'],
  ['Log Out', 'Cerrar sesión'],
  ['Log out', 'Cerrar sesión'],
  ['Logout', 'Cerrar sesión'],
  ['Forgot your password?', '¿Olvidaste tu contraseña?'],
  ['Forgot password?', '¿Olvidaste tu contraseña?'],
  ['Reset Password', 'Restablecer contraseña'],
  ['Reset password', 'Restablecer contraseña'],
  ['Change Password', 'Cambiar contraseña'],
  ['Change password', 'Cambiar contraseña'],
  ['Confirm Password', 'Confirmar contraseña'],
  ['Confirm password', 'Confirmar contraseña'],
  ['New Password', 'Nueva contraseña'],
  ['New password', 'Nueva contraseña'],
  ['Old Password', 'Contraseña actual'],
  ['Old password', 'Contraseña actual'],
  ['Welcome back', 'Bienvenido de nuevo'],

  // Campos de formulario
  ['Email Address', 'Correo electrónico'],
  ['Email address', 'Correo electrónico'],
  ['Email', 'Correo'],
  ['Password', 'Contraseña'],
  ['First Name', 'Nombre'],
  ['First name', 'Nombre'],
  ['Last Name', 'Apellido'],
  ['Last name', 'Apellido'],
  ['Full Name', 'Nombre completo'],
  ['Full name', 'Nombre completo'],
  ['Description', 'Descripción'],
  ['Short Description', 'Descripción corta'],
  ['Short description', 'Descripción corta'],
  ['Long Description', 'Descripción larga'],
  ['Long description', 'Descripción larga'],
  ['Price', 'Precio'],
  ['Old Price', 'Precio anterior'],
  ['Old price', 'Precio anterior'],
  ['Sale Price', 'Precio de oferta'],
  ['Sale price', 'Precio de oferta'],
  ['Cost', 'Costo'],
  ['Quantity', 'Cantidad'],
  ['Stock', 'Inventario'],
  ['Inventory', 'Inventario'],
  ['Weight', 'Peso'],
  ['Status', 'Estado'],
  ['Active', 'Activo'],
  ['Inactive', 'Inactivo'],
  ['Enabled', 'Habilitado'],
  ['Disabled', 'Deshabilitado'],
  ['Visible', 'Visible'],
  ['Invisible', 'Invisible'],
  ['Public', 'Público'],
  ['Private', 'Privado'],
  ['Total', 'Total'],
  ['Subtotal', 'Subtotal'],
  ['Tax', 'Impuesto'],
  ['Taxes', 'Impuestos'],
  ['Shipping', 'Envío'],
  ['Discount', 'Descuento'],
  ['Discounts', 'Descuentos'],
  ['Image', 'Imagen'],
  ['Images', 'Imágenes'],
  ['Upload', 'Subir'],
  ['Download', 'Descargar'],
  ['Date', 'Fecha'],
  ['Created at', 'Creado el'],
  ['Updated at', 'Actualizado el'],
  ['Created date', 'Fecha de creación'],
  ['Created Date', 'Fecha de creación'],
  ['Address', 'Dirección'],
  ['Address line 1', 'Dirección línea 1'],
  ['Address line 2', 'Dirección línea 2'],
  ['Address Line 1', 'Dirección línea 1'],
  ['Address Line 2', 'Dirección línea 2'],
  ['Billing Address', 'Dirección de facturación'],
  ['Billing address', 'Dirección de facturación'],
  ['Shipping Address', 'Dirección de envío'],
  ['Shipping address', 'Dirección de envío'],
  ['Payment', 'Pago'],
  ['Payments', 'Pagos'],
  ['Payment method', 'Método de pago'],
  ['Payment Method', 'Método de pago'],
  ['Shipping method', 'Método de envío'],
  ['Shipping Method', 'Método de envío'],
  ['Currency', 'Moneda'],
  ['Country', 'País'],
  ['Province', 'Provincia'],
  ['State', 'Provincia'],
  ['City', 'Ciudad'],
  ['Postcode', 'Código postal'],
  ['Postal code', 'Código postal'],
  ['Postal Code', 'Código postal'],
  ['Zip Code', 'Código postal'],
  ['Zip code', 'Código postal'],
  ['Telephone', 'Teléfono'],
  ['Phone', 'Teléfono'],
  ['Phone number', 'Número de teléfono'],
  ['Phone Number', 'Número de teléfono'],
  ['Required', 'Obligatorio'],
  ['Optional', 'Opcional'],
  ['Default', 'Por defecto'],
  ['Custom', 'Personalizado'],
  ['Type', 'Tipo'],
  ['Group', 'Grupo'],
  ['Groups', 'Grupos'],
  ['Code', 'Código'],
  ['Note', 'Nota'],
  ['Notes', 'Notas'],
  ['Comments', 'Comentarios'],
  ['Comment', 'Comentario'],

  // Navegación / pestañas comunes
  ['General', 'General'],
  ['Profile', 'Perfil'],
  ['Account', 'Cuenta'],
  ['My Account', 'Mi cuenta'],
  ['Information', 'Información'],
  ['Details', 'Detalles'],
  ['Overview', 'Resumen'],
  ['Summary', 'Resumen'],
  ['History', 'Historial'],
  ['Activity', 'Actividad'],
  ['Activities', 'Actividades'],
  ['Items', 'Artículos'],
  ['Item', 'Artículo'],
  ['SEO', 'SEO'],

  // Order/sale specific
  ['Order Status', 'Estado del pedido'],
  ['Order status', 'Estado del pedido'],
  ['Payment Status', 'Estado del pago'],
  ['Payment status', 'Estado del pago'],
  ['Shipment Status', 'Estado del envío'],
  ['Shipment status', 'Estado del envío'],
  ['Tracking number', 'Número de seguimiento'],
  ['Tracking Number', 'Número de seguimiento'],
  ['Carrier', 'Transportista'],
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

  // Tablas / grids
  ['Actions', 'Acciones'],
  ['Action', 'Acción'],
  ['Showing', 'Mostrando'],
  ['of', 'de'],
  ['results', 'resultados'],
  ['result', 'resultado'],
  ['per page', 'por página'],
  ['Sort by', 'Ordenar por'],
  ['Sort By', 'Ordenar por'],
  ['Order by', 'Ordenar por'],
  ['Asc', 'Asc'],
  ['Desc', 'Desc'],
  ['Ascending', 'Ascendente'],
  ['Descending', 'Descendente'],
];

const TARGETS = [
  // Atributos JSX comunes
  /(\b(?:placeholder|title|label|aria-label|alt|name)\s*=\s*)(['"])([^'"]+?)\2/g,
  // toast.* calls
  /(toast\.(?:success|error|info|warning|warn)\s*\(\s*)(['"])([^'"]+?)\2/g,
  // Texto entre etiquetas JSX simples (h1-h6, p, span, label, button, a, td, th, li)
  // Capturamos tag de apertura, texto y tag de cierre
];

// Para texto JSX entre tags abiertos/cerrados (multilínea posible)
const JSX_TEXT_RE = /(<(h[1-6]|p|span|label|button|a|td|th|li|strong|em|small|legend|caption|figcaption)([^>]*)>)([^<>{]+?)(<\/\2>)/g;

function translateLiteral(s) {
  let out = s;
  // Caso especial: "X is required" → "X es obligatorio" pero mantener el sujeto.
  // Ya cubierto por el glosario para casos comunes.
  // Match exacto primero
  for (const [en, es] of GLOSSARY) {
    if (out === en) return es;
  }
  // Match con espacios alrededor (frases)
  for (const [en, es] of GLOSSARY) {
    if (out.trim() === en) {
      const left = out.match(/^\s*/)[0];
      const right = out.match(/\s*$/)[0];
      return left + es + right;
    }
  }
  return null; // no match
}

function shouldSkipFile(filePath) {
  // No tocar archivos de la storefront
  if (filePath.includes('/pages/frontStore/')) return true;
  // No tocar archivos de migration
  if (filePath.includes('/migration/')) return true;
  // No tocar tests
  if (filePath.includes('__tests__') || filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx')) return true;
  // No tocar GraphQL schema
  if (filePath.endsWith('.graphql')) return true;
  return false;
}

function listFiles(dir, exts = ['.tsx', '.jsx', '.ts', '.js']) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules
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
  const stats = { attrs: 0, toasts: 0, jsxText: 0 };

  // 1. Atributos JSX/HTML: placeholder, title, label, aria-label, alt, name
  content = content.replace(
    /(\b(?:placeholder|title|label|aria-label|alt|name)\s*=\s*)(['"])([^'"]+?)\2/g,
    (m, prefix, q, val) => {
      const t = translateLiteral(val);
      if (t === null) return m;
      stats.attrs++;
      return `${prefix}${q}${t}${q}`;
    }
  );

  // 2. toast.success/error/info/warning/warn calls
  content = content.replace(
    /(toast\.(?:success|error|info|warning|warn)\s*\(\s*)(['"])([^'"]+?)\2/g,
    (m, prefix, q, val) => {
      const t = translateLiteral(val);
      if (t === null) return m;
      stats.toasts++;
      return `${prefix}${q}${t}${q}`;
    }
  );

  // 3. Texto entre etiquetas JSX simples
  content = content.replace(JSX_TEXT_RE, (m, openTag, tagName, attrs, text, closeTag) => {
    // Skip if text contains JSX expressions or is whitespace-only
    if (!text.trim()) return m;
    if (text.includes('${')) return m;
    const t = translateLiteral(text);
    if (t === null) return m;
    stats.jsxText++;
    return `${openTag}${t}${closeTag}`;
  });

  // 4. NavigationItemGroup name="..." y otros componentes específicos:
  // patrón {name: 'X', title: 'Y'} en items arrays — ya cubierto por el atributo `title` y `name` de arriba.

  // 5. PageHeading title prop (component): ya cubierto por el atributo title.

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return stats;
  }
  return null;
}

const files = listFiles(ROOT);
console.log(`Encontrados ${files.length} archivos para revisar.`);

let totalFiles = 0;
let totalAttrs = 0;
let totalToasts = 0;
let totalJsx = 0;

for (const f of files) {
  const r = processFile(f);
  if (r) {
    totalFiles++;
    totalAttrs += r.attrs;
    totalToasts += r.toasts;
    totalJsx += r.jsxText;
  }
}

console.log(`\nResumen:`);
console.log(`  Archivos modificados: ${totalFiles}`);
console.log(`  Atributos traducidos: ${totalAttrs}`);
console.log(`  Toasts traducidos:    ${totalToasts}`);
console.log(`  Texto JSX traducido:  ${totalJsx}`);
console.log(`  Total replacements:   ${totalAttrs + totalToasts + totalJsx}`);
