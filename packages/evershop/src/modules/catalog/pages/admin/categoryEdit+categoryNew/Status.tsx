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
          Manage the status settings of the category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroupField
          name="status"
          label="Estado"
          options={[
            { label: 'Disabled', value: 0 },
            { label: 'Enabled', value: 1 }
          ]}
          defaultValue={category?.status === 0 ? 0 : 1}
          validation={{
            required: 'This field is required'
          }}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="include_in_nav"
          label="Include in Store Menu?"
          options={[
            { label: 'No', value: 0 },
            { label: 'Yes', value: 1 }
          ]}
          defaultValue={category?.includeInNav === 0 ? 0 : 1}
          validation={{
            required: 'This field is required'
          }}
        />
      </CardContent>
      <CardContent className="pt-6 border-t border-border">
        <RadioGroupField
          name="show_products"
          label="Show products?"
          options={[
            { label: 'No', value: 0 },
            { label: 'Yes', value: 1 }
          ]}
          defaultValue={category?.showProducts === 0 ? 0 : 1}
          validation={{
            required: 'This field is required'
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
