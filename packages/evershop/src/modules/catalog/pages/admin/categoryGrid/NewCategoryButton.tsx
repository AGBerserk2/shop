import { Button } from '@components/common/ui/Button.js';
import React from 'react';

interface NewCategoryButtonProps {
  newCateoryUrl: string;
}
export default function NewCategoryButton({
  newCateoryUrl
}: NewCategoryButtonProps) {
  return (
    <Button onClick={() => (window.location.href = newCateoryUrl)}>
      Nueva categoría
    </Button>
  );
}

export const layout = {
  areaId: 'pageHeadingRight',
  sortOrder: 10
};

export const query = `
  query Query {
    newCateoryUrl: url(routeId: "categoryNew")
  }
`;
