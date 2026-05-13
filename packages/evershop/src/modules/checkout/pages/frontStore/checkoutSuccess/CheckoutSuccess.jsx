import Area from '@components/common/Area';
import React from 'react';
import './CheckoutSuccess.scss';

export default function CheckoutSuccessPage() {
  return (
    <div className="anroy-thanks">
      <div className="anroy-thanks__wrap">
        <Area id="checkoutSuccessPageLeft" />
        <Area id="checkoutSuccessPageRight" />
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
