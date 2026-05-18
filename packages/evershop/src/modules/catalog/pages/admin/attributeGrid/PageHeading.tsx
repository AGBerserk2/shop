import { PageHeading } from '@components/admin/PageHeading.js';
import React from 'react';

export interface AttributGridPageHeadingProps {
  backUrl?: string;
}
export default function AttributGridPageHeading() {
  return <PageHeading heading="Atributos" />;
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
