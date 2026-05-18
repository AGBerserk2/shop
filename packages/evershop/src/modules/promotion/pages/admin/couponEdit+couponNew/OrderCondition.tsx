import { NumberField } from '@components/common/form/NumberField.js';
import React from 'react';
import {
  RequiredProduct,
  RequiredProducts
} from './components/RequireProducts.js';

interface OrderConditionProps {
  coupon?: {
    condition?: {
      orderTotal?: number;
      orderQty?: number;
      requiredProducts?: RequiredProduct[];
    };
  };
}
export default function OrderCondition({ coupon = {} }: OrderConditionProps) {
  const condition = coupon?.condition || {};

  return (
    <div className="space-y-2">
      <NumberField
        name="condition.order_total"
        label="Monto mínimo de compra"
        placeholder="Monto mínimo de compra"
        defaultValue={condition.orderTotal || 0}
        helperText="El monto total mínimo requerido para que el pedido califique para este cupón."
      />

      <NumberField
        name="condition.order_qty"
        label="Cantidad mínima de compra"
        placeholder="Cantidad mínima de compra"
        defaultValue={condition.orderQty || 0}
        helperText="La cantidad mínima de artículos requerida en el pedido para que califique para este cupón."
        allowDecimals={false}
        min={0}
      />
      <RequiredProducts requiredProducts={condition.requiredProducts || []} />
    </div>
  );
}

export const layout = {
  areaId: 'couponEditLeft',
  sortOrder: 10
};

export const query = `
  query Query {
    coupon(id: getContextValue('couponId', null)) {
      condition {
        orderTotal
        orderQty
        requiredProducts {
          key
          operator
          value
          qty
        }
      }
    }
  }
`;
