import { Button } from '@components/common/ui/Button.js';
import React from 'react';

interface NewProductButtonProps {
  newProductUrl: string;
}
export default function NewProductButton({
  newProductUrl
}: NewProductButtonProps) {
  return (
    <Button
      onClick={() => (window.location.href = newProductUrl)}
      title="Nuevo producto"
    >
      Nuevo producto
    </Button>
  );
}

export const layout = {
  areaId: 'pageHeadingRight',
  sortOrder: 10
};

export const query = `
  query Query {
    newProductUrl: url(routeId: "productNew")
  }
`;
