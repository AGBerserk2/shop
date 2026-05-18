import { PageHeading } from '@components/admin/PageHeading.js';
import React from 'react';

export default function CustomerGridHeading() {
  return <PageHeading heading="Clientes" />;
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
