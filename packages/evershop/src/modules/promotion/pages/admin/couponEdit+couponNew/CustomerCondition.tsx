import Area from '@components/common/Area.js';
import { NumberField } from '@components/common/form/NumberField.js';
import { ReactSelectCreatableField } from '@components/common/form/ReactSelectCreatableField.js';
import { ReactSelectField } from '@components/common/form/ReactSelectField.js';
import React from 'react';
import { Coupon } from './General.js';

const customStyles = {
  container: (provided) => ({
    ...provided,
    zIndex: 1000
  })
};

interface CustomerConditionProps {
  coupon?: Coupon;
  groups: {
    items: {
      value: number;
      name: string;
    }[];
  };
}

export default function CustomerCondition({
  coupon,
  groups: { items: customerGroups }
}: CustomerConditionProps) {
  const condition = coupon?.userCondition;
  const selectedGroups = condition?.groups || [];

  return (
    <Area
      id="couponCustomerCondition"
      className="space-y-3"
      coreComponents={[
        {
          component: {
            default: () => (
              <ReactSelectField
                label="Grupos de clientes"
                name="user_condition.groups"
                options={customerGroups.map((group) => ({
                  value: group.value.toString(),
                  label: group.name
                }))}
                hideSelectedOptions
                isMulti={true}
                defaultValue={selectedGroups}
                styles={customStyles}
              />
            )
          },
          props: {},
          sortOrder: 10,
          id: 'couponCustomerConditionGroup'
        },
        {
          component: {
            default: (
              <ReactSelectCreatableField
                name="user_condition.emails"
                label="Correos de clientes"
                placeholder="Ingresá los correos de clientes"
                isMulti={true}
                options={(condition?.emails || []).map((email) => ({
                  value: email as string,
                  label: email as string
                }))}
                defaultValue={condition?.emails || []}
              />
            )
          },
          sortOrder: 20,
          id: 'couponCustomerConditionEmail'
        },
        {
          component: {
            default: (
              <NumberField
                label="Compras del cliente"
                placeholder="Ingresá el monto comprado"
                defaultValue={
                  parseInt(condition?.purchased as unknown as string) || 0
                }
                name="user_condition.purchased"
                min={0}
                helperText="Monto mínimo comprado. Esto solo aplica a clientes registrados."
              />
            )
          },
          sortOrder: 30,
          id: 'couponCustomerConditionPurchased'
        }
      ]}
    />
  );
}

export const layout = {
  areaId: 'couponEditRight',
  sortOrder: 10
};

export const query = `
  query Query {
    coupon(id: getContextValue('couponId', null)) {
      userCondition {
        groups
        emails
        purchased
      }
    }
    groups: customerGroups {
      items {
        value: customerGroupId
        name: groupName
      }
    }
  }
`;
