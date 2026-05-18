import { Button } from '@components/common/ui/Button.js';
import React from 'react';

interface NewPageButtonProps {
  newPageUrl: string;
}

export default function NewPageButton({ newPageUrl }: NewPageButtonProps) {
  return (
    <Button onClick={() => (window.location.href = newPageUrl)}>
      Nueva página
    </Button>
  );
}

export const layout = {
  areaId: 'pageHeadingRight',
  sortOrder: 10
};

export const query = `
  query Query {
    newPageUrl: url(routeId: "cmsPageNew")
  }
`;
