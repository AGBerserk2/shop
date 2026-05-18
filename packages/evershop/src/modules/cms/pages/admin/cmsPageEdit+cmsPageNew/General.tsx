import { Editor, Row } from '@components/common/form/Editor.js';
import { InputField } from '@components/common/form/InputField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React from 'react';

interface CmsPageGeneralProps {
  page?: {
    cmsPageId?: string;
    name?: string;
    status?: number;
    sortOrder?: number;
    content?: Row[];
  };
}

export default function General({ page }: CmsPageGeneralProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información general</CardTitle>
        <CardDescription>
          Ingresá la información básica de la página.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <InputField
              id="cms_page_name"
              name="name"
              label="Nombre de la página"
              placeholder="Ingresá el nombre de la página"
              defaultValue={page?.name}
              required
              validation={{ required: 'El nombre de la página es obligatorio' }}
              helperText="Este es el nombre de la página que se muestra en el panel de administración."
            />
          </div>
          <div className="space-y-2">
            <RadioGroupField
              name="status"
              label="Estado"
              options={[
                { value: 1, label: 'Habilitada' },
                { value: 0, label: 'Deshabilitada' }
              ]}
              defaultValue={page?.status}
              required
              helperText="Habilitá esta página para que sea visible en la tienda."
            />
          </div>
          <div>
            <label htmlFor="content" className="block mb-2 font-medium">
              Contenido
            </label>
            <Editor name="content" value={page?.content || []} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'wideScreen',
  sortOrder: 10
};

export const query = `
  query Query {
    page: cmsPage(id: getContextValue("cmsPageId", null)) {
      cmsPageId
      name
      status
      sortOrder
      content
    }
  }
`;
