import { Meta } from '@components/common/Meta.js';
import { Title } from '@components/common/Title.js';
import React from 'react';

export default function SeoMeta() {
  return (
    <>
      <Title title="Página no encontrada" />
      <Meta name="description" content="Página no encontrada" />
    </>
  );
}

export const layout = {
  areaId: 'head',
  sortOrder: 1
};
