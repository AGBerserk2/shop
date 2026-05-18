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

interface CmsPageSeoProps {
  page?: {
    urlKey?: string;
    metaTitle?: string;
    metaKeywords?: string;
    metaDescription?: string;
  };
}

export default function Seo({ page }: CmsPageSeoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información SEO</CardTitle>
        <CardDescription>
          Ingresá los datos de SEO de la página.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <InputField
            id="urlKey"
            name="url_key"
            label="Clave de URL"
            placeholder="Ingresá la clave de URL"
            defaultValue={page?.urlKey}
            required
            validation={{ required: 'La clave de URL es obligatoria' }}
            helperText="Esta es la ruta de URL de la página."
          />

          <InputField
            id="metaTitle"
            name="meta_title"
            label="Meta título"
            placeholder="Ingresá el meta título"
            defaultValue={page?.metaTitle}
            required
            validation={{ required: 'El meta título es obligatorio' }}
            helperText="Este es el meta título de la página."
          />

          <TextareaField
            name="meta_description"
            label="Meta descripción"
            placeholder="Ingresá la meta descripción"
            defaultValue={page?.metaDescription}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'wideScreen',
  sortOrder: 30
};

export const query = `
  query Query {
    page: cmsPage(id: getContextValue('cmsPageId', null)) {
      urlKey
      metaTitle
      metaKeywords
      metaDescription
    }
  }
`;
