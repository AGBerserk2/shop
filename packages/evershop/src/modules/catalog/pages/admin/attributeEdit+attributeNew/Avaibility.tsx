import { NumberField } from '@components/common/form/NumberField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface GeneralProps {
  attribute?: {
    displayOnFrontend?: number;
    isFilterable?: number;
    isRequired?: number;
    sortOrder?: number;
  };
}
export default function General({ attribute }: GeneralProps) {
  return (
    <Card className="bg-popover">
      <CardHeader>
        <CardTitle>Configuración</CardTitle>
        <CardDescription>Gestiona la configuración del atributo.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="is_required"
          label="¿Obligatorio?"
          options={[
            { value: 0, label: 'No' },
            { value: 1, label: 'Sí' }
          ]}
          required
          validation={{
            required: 'Este campo es obligatorio'
          }}
          defaultValue={attribute?.isRequired === 0 ? 0 : 1}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="is_filterable"
          label="¿Filtrable?"
          options={[
            { value: 0, label: 'No' },
            { value: 1, label: 'Sí' }
          ]}
          required
          validation={{
            required: 'Este campo es obligatorio'
          }}
          defaultValue={attribute?.isFilterable === 1 ? 1 : 0}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="display_on_frontend"
          label="¿Mostrar en la tienda?"
          options={[
            { value: 0, label: 'No' },
            { value: 1, label: 'Sí' }
          ]}
          required
          validation={{
            required: 'Este campo es obligatorio'
          }}
          defaultValue={attribute?.displayOnFrontend === 1 ? 1 : 0}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <NumberField
          name="sort_order"
          label="Orden"
          placeholder="Orden"
          required
          validation={{
            required: 'El orden es obligatorio',
            min: {
              value: 0,
              message: 'El orden debe ser un número positivo'
            }
          }}
          defaultValue={attribute?.sortOrder}
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 10
};

export const query = `
  query Query {
    attribute(id: getContextValue("attributeId", null)) {
      attributeId
      isFilterable
      isRequired
      displayOnFrontend
      sortOrder
    }
  }
`;
