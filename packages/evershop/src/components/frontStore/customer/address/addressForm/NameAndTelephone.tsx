import { InputField } from '@components/common/form/InputField.js';
import { TelField } from '@components/common/form/TelField.js';
import React from 'react';

interface NameAndTelephoneProps {
  fullName?: string;
  telephone?: string;
  getFieldName?: (fieldName: string) => string;
}
export function NameAndTelephone({
  fullName,
  telephone,
  getFieldName
}: NameAndTelephoneProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <InputField
          name={getFieldName ? getFieldName('full_name') : 'full_name'}
          defaultValue={fullName}
          label="Nombre completo"
          placeholder="Tu nombre"
          required
          validation={{
            required: 'El nombre es obligatorio'
          }}
        />
      </div>
      <div>
        <TelField
          name={getFieldName ? getFieldName('telephone') : 'telephone'}
          defaultValue={telephone}
          label="Teléfono"
          placeholder="809 000 0000"
          required
          validation={{
            required: 'El teléfono es obligatorio'
          }}
        />
      </div>
    </div>
  );
}
