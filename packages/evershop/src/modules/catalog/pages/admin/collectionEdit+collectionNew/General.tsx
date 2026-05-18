import Area from '@components/common/Area.js';
import { Editor, Row } from '@components/common/form/Editor.js';
import { InputField } from '@components/common/form/InputField.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import './General.scss';
import React from 'react';

interface GeneralProps {
  collection?: {
    collectionId?: string;
    name?: string;
    code?: string;
    description?: Row[];
  };
}

export default function General({ collection }: GeneralProps) {
  const fields = [
    {
      component: {
        default: (
          <InputField
            name="name"
            label="Nombre de la colección"
            placeholder="Escribe el nombre de la colección"
            defaultValue={collection?.name || ''}
            required
          />
        )
      },
      sortOrder: 10,
      id: 'name'
    },
    {
      component: {
        default: (
          <InputField
            name="code"
            label="Código de la colección"
            defaultValue={collection?.code || ''}
            required
            validation={{
              required: 'El código de la colección es obligatorio',
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message:
                  'El código de la colección debe ser alfanumérico y puede incluir guiones bajos o guiones.'
              }
            }}
            placeholder="Código de la colección"
          />
        )
      },
      sortOrder: 15,
      id: 'code'
    },
    {
      component: {
        default: (
          <Editor
            name="description"
            label="Descripción"
            value={collection?.description || []}
          />
        )
      },
      sortOrder: 30
    }
  ];

  return (
    <Card title="General">
      <CardHeader>
        <CardTitle>Información general</CardTitle>
        <CardDescription>
          Administra la información general de la colección.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Area
          id="collectionEditGeneral"
          coreComponents={fields}
          className="space-y-2"
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'collectionFormInner',
  sortOrder: 10
};

export const query = `
  query Query {
    collection(code: getContextValue("collectionCode", null)) {
      collectionId
      name
      code
      description
    }
  }
`;
