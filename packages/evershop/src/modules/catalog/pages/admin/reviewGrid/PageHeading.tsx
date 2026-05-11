import { PageHeading } from '@components/admin/PageHeading.js';
import React from 'react';

export default function ReviewGridPageHeading() {
  return (
    <PageHeading
      title="Reseñas"
      description="Aprueba o rechaza las reseñas dejadas por tus clientes."
    />
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 5
};
