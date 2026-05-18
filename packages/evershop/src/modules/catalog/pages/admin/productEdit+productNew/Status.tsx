import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface StatusProps {
  product:
    | {
        status: number;
        visibility: number;
      }
    | undefined;
}
export default function Status({ product }: StatusProps) {
  return (
    <Card className="bg-popover">
      <CardHeader>
        <CardTitle>Estado del producto</CardTitle>
        <CardDescription>
          Definí el estado y la visibilidad del producto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="status"
          label="Estado"
          options={[
            { value: 0, label: 'Desactivado' },
            { value: 1, label: 'Activado' }
          ]}
          defaultValue={product?.status === 0 ? 0 : 1}
          required
          helperText="Los productos desactivados no se mostrarán en la tienda y no se pueden comprar."
        />
      </CardContent>
      <CardContent className="border-t border-t-border pt-6">
        <RadioGroupField
          name="visibility"
          label="Visibilidad"
          options={[
            { value: 0, label: 'No visible individualmente' },
            { value: 1, label: 'Catálogo, Búsqueda' }
          ]}
          defaultValue={product?.visibility === 0 ? 0 : 1}
          required
          helperText="La visibilidad determina dónde aparece el producto en la tienda. No afecta la posibilidad de venderlo."
        />
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 10
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      status
      visibility
      category {
        value: categoryId
        label: name
      }
    }
  }
`;
