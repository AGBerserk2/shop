import { InputField } from '@components/common/form/InputField.js';
import { SelectField } from '@components/common/form/SelectField.js';
import React from 'react';

interface ProvinceAndPostcodeProps {
  provinces: {
    value: string;
    label: string;
  }[];
  province?: {
    code: string;
  };
  postcode?: string;
  getFieldName?: (fieldName: string) => string;
}
export function ProvinceAndPostcode({
  provinces,
  province,
  postcode,
  getFieldName
}: ProvinceAndPostcodeProps) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <div>
        <SelectField
          defaultValue={province?.code}
          name={getFieldName ? getFieldName('province') : 'address.province'}
          label="Provincia"
          placeholder="Selecciona tu provincia"
          required
          validation={{
            required: 'La provincia es obligatoria'
          }}
          options={provinces}
        />
      </div>
      <div>
        <InputField
          name={getFieldName ? getFieldName('postcode') : 'postcode'}
          defaultValue={postcode}
          label="Código postal"
          placeholder="Código postal"
          required
          validation={{
            required: 'El código postal es obligatorio'
          }}
        />
      </div>
    </div>
  );
}
