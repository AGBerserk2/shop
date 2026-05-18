import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

export interface CategoryStatusProps {
  category?: {
    status?: number;
    includeInNav?: number;
    showProducts?: number;
  };
}

export default function Status({ category }: CategoryStatusProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado</CardTitle>
        <CardDescription>
          Administra la configuración de estado de la categoría.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="status"
          label="Estado"
          options={[
            { label: 'Desactivado', value: 0 },
            { label: 'Activado', value: 1 }
          ]}
          defaultValue={category?.status === 0 ? 0 : 1}
          validation={{
            required: 'Este campo es obligatorio'
          }}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="include_in_nav"
          label="¿Incluir en el menú de la tienda?"
          options={[
            { label: 'No', value: 0 },
            { label: 'Sí', value: 1 }
          ]}
          defaultValue={category?.includeInNav === 0 ? 0 : 1}
          validation={{
            required: 'Este campo es obligatorio'
          }}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="show_products"
          label="¿Mostrar productos?"
          options={[
            { label: 'No', value: 0 },
            { label: 'Sí', value: 1 }
          ]}
          defaultValue={category?.showProducts === 0 ? 0 : 1}
          validation={{
            required: 'Este campo es obligatorio'
          }}
        />
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
    category(id: getContextValue("categoryId", null)) {
      status
      includeInNav
      showProducts
    }
  }
`;
