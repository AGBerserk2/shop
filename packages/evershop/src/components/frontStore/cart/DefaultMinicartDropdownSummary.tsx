import Area from '@components/common/Area.js';
import { Button } from '@components/common/ui/Button.js';
import React from 'react';

export function DefaultMiniCartDropdownSummary({
  total,
  cartUrl,
  checkoutUrl,
  totalQty
}: {
  total: string;
  cartUrl: string;
  checkoutUrl: string;
  totalQty: number;
}) {
  return (
    <>
      <div className="minicart__summary flex justify-between items-center mb-3">
        <span className="font-medium text-gray-900">Subtotal:</span>
        <span className="font-semibold text-lg text-gray-900">
          {total || '—'}
        </span>
      </div>
      <Area id="miniCartSummaryViewCartButtonBefore" noOuter />
      <Button
        variant={'outline'}
        size={'lg'}
        onClick={() => {
          if (cartUrl) {
            window.location.href = cartUrl;
          }
        }}
        className="minicart__viewcart__button w-full "
      >
        Ver carrito ({totalQty})
      </Button>
      <Area id="miniCartSummaryViewCartButtonAfter" noOuter />
      <Area id="miniCartSummaryCheckoutButtonBefore" noOuter />
      <Button
        variant={'default'}
        size={'lg'}
        onClick={() => {
          if (checkoutUrl) {
            window.location.href = checkoutUrl;
          }
        }}
        className="minicart__checkout__button w-full "
      >
        Pagar
      </Button>
      <Area id="miniCartSummaryCheckoutButtonAfter" noOuter />
    </>
  );
}
