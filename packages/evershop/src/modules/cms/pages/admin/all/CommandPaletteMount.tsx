import CommandPalette from '@components/admin/CommandPalette.js';
import React from 'react';

// Mount the global ⌘K palette in every admin page via the 'body' area so the
// keyboard shortcut works anywhere in /admin without each page importing it.
export default function CommandPaletteMount() {
  return <CommandPalette />;
}

export const layout = {
  areaId: 'body',
  sortOrder: 100
};
