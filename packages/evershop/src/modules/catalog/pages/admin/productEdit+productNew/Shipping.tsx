import { CheckboxField } from '@components/common/form/CheckboxField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

interface ShippingProps {
  product:
    | {
        noShippingRequired: boolean;
        weight: {
          value: number;
          unit: string;
        };
      }
    | undefined;
  setting: {
    weightUnit: string;
  };
}
export default function Shipping({ product, setting }: ShippingProps) {
  const shipping = product || {
    noShippingRequired: undefined,
    weight: undefined
  };
  const { control } = useFormContext();
  const noShippingRequired = useWatch({
    control,
    name: 'no_shipping_required',
    defaultValue:
      (shipping.noShippingRequired !== null && shipping.noShippingRequired) ||
      false
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envío</CardTitle>
        <CardDescription>
          Gestiona la configuración de envío del producto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CheckboxField
          name="no_shipping_required"
          label="¿No requiere envío?"
          defaultValue={shipping.noShippingRequired === true}
          helperText="Seleccioná esta opción si el producto es un producto o servicio digital que no requiere envío."
          wrapperClassName="mb-0"
        />
      </CardContent>
      <CardContent>
        {!noShippingRequired && (
          <NumberField
            name="weight"
            placeholder="Ingresá el peso"
            label={`Peso`}
            defaultValue={shipping.weight?.value}
            unit={setting?.weightUnit}
            required
            validation={{
              min: {
                value: 0,
                message: 'El peso debe ser un número positivo'
              }
            }}
            helperText={'El peso debe ser un número positivo'}
          />
        )}
        {noShippingRequired && (
          <NumberField
            name="weight_no_shipping"
            placeholder="Ingresá el peso"
            label={`Peso`}
            defaultValue={shipping.weight?.value}
            unit={setting?.weightUnit}
            disabled
            helperText={'El peso debe ser un número positivo'}
          />
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      weight {
        value
        unit
      }
      noShippingRequired
    }
    setting {
      weightUnit
    }
  }
`;
