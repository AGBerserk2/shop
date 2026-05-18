import Area from '@components/common/Area.js';
import { InputField } from '@components/common/form/InputField.js';
import { TextareaField } from '@components/common/form/TextareaField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface SEOProps {
  product:
    | {
        urlKey: string;
        metaTitle: string;
        metaKeywords: string;
        metaDescription: string;
      }
    | undefined;
}
export default function SEO({ product }: SEOProps) {
  const fields = [
    {
      component: {
        default: (
          <InputField
            name="url_key"
            label="Clave de URL"
            placeholder="Ingresá la clave de URL"
            required
            defaultValue={product?.urlKey}
            validation={{
              required: 'La clave de URL es obligatoria',
              pattern: {
                value: /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/,
                message:
                  'La clave de URL debe estar en minúsculas y solo puede contener letras, números y guiones'
              }
            }}
          />
        )
      },
      sortOrder: 0
    },
    {
      component: {
        default: (
          <InputField
            name="meta_title"
            label="Meta título"
            placeholder="Ingresá el meta título"
            required
            defaultValue={product?.metaTitle}
            validation={{
              required: 'El meta título es obligatorio'
            }}
          />
        )
      },
      sortOrder: 10
    },
    {
      component: {
        default: (
          <InputField
            type="hidden"
            name="meta_keywords"
            defaultValue={product?.metaKeywords}
          />
        )
      },
      sortOrder: 20
    },
    {
      component: {
        default: (
          <TextareaField
            name="meta_description"
            label="Meta descripción"
            placeholder="Ingresá la meta descripción"
            defaultValue={product?.metaDescription || ''}
          />
        )
      },
      sortOrder: 30
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO</CardTitle>
        <CardDescription>Gestiona la configuración de SEO.</CardDescription>
      </CardHeader>
      <CardContent>
        <Area
          id="productEditSeo"
          coreComponents={fields}
          className="flex flex-col gap-2"
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 60
};

export const query = `
  query Query {
    product(id: getContextValue('productId', null)) {
      urlKey
      metaTitle
      metaKeywords
      metaDescription
    }
  }
`;
