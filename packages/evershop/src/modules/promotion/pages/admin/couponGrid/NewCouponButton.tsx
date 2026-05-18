import { Button } from '@components/common/ui/Button.js';
import React from 'react';

interface NewCouponButtonProps {
  newCouponUrl: string;
}

export default function NewCouponButton({
  newCouponUrl
}: NewCouponButtonProps) {
  return (
    <Button
      onClick={() => (window.location.href = newCouponUrl)}
      title="Nuevo cupón"
    >
      {' '}
      Cupón nuevo{' '}
    </Button>
  );
}

export const layout = {
  areaId: 'pageHeadingRight',
  sortOrder: 10
};

export const query = `
  query Query {
    newCouponUrl: url(routeId: "couponNew")
  }
`;
