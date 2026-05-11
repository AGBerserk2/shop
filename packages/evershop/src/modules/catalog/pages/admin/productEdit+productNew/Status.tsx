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
          Set the status and visibility of the product.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="status"
          label="Estado"
          options={[
            { value: 0, label: 'Disabled' },
            { value: 1, label: 'Enabled' }
          ]}
          defaultValue={product?.status === 0 ? 0 : 1}
          required
          helperText="Disabled products will not be visible in the store and cannot be purchased."
        />
      </CardContent>
      <CardContent className="border-t border-t-border pt-6">
        <RadioGroupField
          name="visibility"
          label="Visibility"
          options={[
            { value: 0, label: 'Not visible individually' },
            { value: 1, label: 'Catalog, Search' }
          ]}
          defaultValue={product?.visibility === 0 ? 0 : 1}
          required
          helperText="Visibility determines where the product appears in the store. It does not affect the saleability of the product."
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
