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

interface CategorySeoProps {
  category?: {
    urlKey?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
}
export default function Seo({ category }: CategorySeoProps) {
  const fields = [
    {
      component: {
        default: (
          <InputField
            name="url_key"
            label="Clave de URL"
            placeholder="Escribe la clave de URL"
            defaultValue={category?.urlKey || ''}
            required
            validation={{
              required: 'La clave de URL es obligatoria',
              pattern: {
                value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message:
                  'La clave de URL debe estar en minúsculas y solo puede contener caracteres alfanuméricos y guiones'
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
            placeholder="Escribe el meta título"
            defaultValue={category?.metaTitle || ''}
            required
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
          <TextareaField
            name="meta_description"
            label="Meta descripción"
            placeholder="Escribe la meta descripción"
            defaultValue={category?.metaDescription || ''}
            required
            validation={{
              required: 'La meta descripción es obligatoria'
            }}
          />
        )
      },
      sortOrder: 30
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimización para buscadores</CardTitle>
        <CardDescription>
          Administra la configuración SEO de la categoría.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Area
          id="categoryEditSeo"
          coreComponents={fields}
          className="space-y-2"
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
    category(id: getContextValue('categoryId', null)) {
      urlKey
      metaTitle
      metaKeywords
      metaDescription
    }
  }
`;
