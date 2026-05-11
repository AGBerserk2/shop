#!/usr/bin/env node
// Revierte traducciones que cayeron en constantes de código (HTTP methods, etc.)
// Solo toca strings en SINGLE QUOTES — esos suelen ser código, no UI.
// UI legítima usa: JSX text (>ELIMINAR<) o double quotes ("ELIMINAR").

import fs from 'fs';
import path from 'path';

const ROOT = '/Users/berserk/Documents/My/E-comerce/packages/evershop/src';

const REVERT_MAP = {
  'ELIMINAR': 'DELETE',
  'GUARDAR': 'SAVE',
  'CANCELAR': 'CANCEL',
  'CREAR': 'CREATE',
  'ACTUALIZAR': 'UPDATE',
  'EDITAR': 'EDIT',
  'ENVIAR': 'SUBMIT',
  'CONTINUAR': 'CONTINUE',
  'BUSCAR': 'SEARCH',
  'AGREGAR': 'ADD',
  'CONFIRMAR': 'CONFIRM',
  'INICIAR SESIÓN': 'SIGN IN',
  'CERRAR SESIÓN': 'SIGN OUT',
};

function shouldSkipFile(fp) {
  if (fp.includes('/migration/')) return true;
  if (fp.endsWith('.graphql')) return true;
  return false;
}

function listFiles(dir) {
  const exts = ['.tsx', '.jsx', '.ts', '.js', '.json'];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      out.push(...listFiles(full));
    } else if (e.isFile() && exts.includes(path.extname(e.name)) && !shouldSkipFile(full)) {
      out.push(full);
    }
  }
  return out;
}

let totalFiles = 0;
let totalReplacements = 0;

for (const f of listFiles(ROOT)) {
  const orig = fs.readFileSync(f, 'utf8');
  let content = orig;
  for (const [esp, eng] of Object.entries(REVERT_MAP)) {
    // Solo single-quoted exact matches
    const re = new RegExp(`'${esp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g');
    content = content.replace(re, `'${eng}'`);
  }
  if (content !== orig) {
    const count = (orig.match(/'(?:ELIMINAR|GUARDAR|CANCELAR|CREAR|ACTUALIZAR|EDITAR|ENVIAR|CONTINUAR|BUSCAR|AGREGAR|CONFIRMAR|INICIAR SESIÓN|CERRAR SESIÓN)'/g) || []).length;
    fs.writeFileSync(f, content, 'utf8');
    totalFiles++;
    totalReplacements += count;
  }
}

console.log(`Revert completo: ${totalFiles} archivos, ${totalReplacements} reemplazos.`);
