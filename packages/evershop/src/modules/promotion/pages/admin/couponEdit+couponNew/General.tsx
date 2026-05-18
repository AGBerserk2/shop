import Area from '@components/common/Area.js';
import { CheckboxField } from '@components/common/form/CheckboxField.js';
import { InputField } from '@components/common/form/InputField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import { TextareaField } from '@components/common/form/TextareaField.js';
import React from 'react';
import { get } from '../../../../../lib/util/get.js';
import { Setting } from './components/Setting.js';
import './General.scss';

export interface Coupon {
  coupon: string;
  status: number;
  description: string;
  discountAmount: number;
  freeShipping: number;
  startDate: { text: string; value: string };
  endDate: { text: string; value: string };
  targetProducts?: {
    products: { productId: number; productName: string }[];
    maxQty: number;
  };
  buyxGety?: {
    items: {
      productId: number;
      productName: string;
      qty: number;
      discount: number;
    }[];
  };
  discountType?: string;
  condition?: {
    orderTotal?: number;
    orderQty?: number;
    requiredProducts?: {
      key: string;
      operator: string;
      value: string;
      qty: number;
    }[];
  };
  userCondition?: {
    groups?: number[] | string[];
    emails?: string[];
    purchased: number;
  };
}

export default function General({ coupon }: { coupon?: Coupon }) {
  return (
    <Area
      id="couponFormGeneral"
      className="space-y-3"
      coreComponents={[
        {
          component: {
            default: (
              <InputField
                name="coupon"
                label="Código del cupón"
                defaultValue={coupon?.coupon || ''}
                placeholder="Ingresá el código del cupón"
                required
                validation={{
                  required: 'El código del cupón es obligatorio',
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message:
                      'El código del cupón solo puede contener letras, números, guiones bajos y guiones'
                  }
                }}
              />
            )
          },
          sortOrder: 10
        },
        {
          component: {
            default: (
              <TextareaField
                name="description"
                label="Descripción"
                defaultValue={coupon?.description || ''}
                placeholder="Ingresá la descripción"
                required
                validation={{
                  required: 'La descripción es obligatoria'
                }}
              />
            )
          },
          sortOrder: 20
        },
        {
          component: {
            default: (
              <RadioGroupField
                name="status"
                label="Estado"
                options={[
                  { label: 'Activado', value: 1 },
                  { label: 'Desactivado', value: 0 }
                ]}
                defaultValue={coupon?.status === 0 ? 0 : 1}
                required
                validation={{
                  required: 'El estado es obligatorio',
                  valueAsNumber: true
                }}
              />
            )
          },
          sortOrder: 30
        },
        {
          component: { default: Setting },
          props: {
            startDate: get(coupon, 'startDate.text', ''),
            endDate: get(coupon, 'endDate.text', ''),
            discountAmount: get(coupon, 'discountAmount', '')
          },
          sortOrder: 40
        },
        {
          component: {
            default: (
              <CheckboxField
                name="free_shipping"
                defaultValue={parseInt(get(coupon, 'freeShipping'), 10) === 1}
                label="¿Envío gratis?"
              />
            )
          },
          sortOrder: 50
        }
      ]}
    />
  );
}

export const layout = {
  areaId: 'couponEditGeneral',
  sortOrder: 10
};

export const query = `
  query Query {
    coupon(id: getContextValue('couponId', null)) {
      coupon
      status
      description
      discountAmount
      freeShipping
      startDate {
        text
      }
      endDate {
        text
      }
    }
  }
`;
