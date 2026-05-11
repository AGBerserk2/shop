import { TableCell } from '@components/common/ui/Table.js';
import React from 'react';

interface WidgetTypeRowProps {
  code: string;
  types: Array<{
    code: string;
    name: string;
  }>;
}

export function WidgetTypeRow({ code, types }: WidgetTypeRowProps) {
  const type = types.find((t) => t.code === code);
  if (!type) {
    return (
      <TableCell>
        <div>Desconocido</div>
      </TableCell>
    );
  } else {
    return (
      <TableCell>
        <div>{type.name}</div>
      </TableCell>
    );
  }
}
