import Area from '@components/common/Area.js';
import { InputField } from '@components/common/form/InputField.js';
import { SelectField } from '@components/common/form/SelectField.js';
import { NameAndTelephone } from '@components/frontStore/customer/address/addressForm/NameAndTelephone.js';
import { ProvinceAndPostcode } from '@components/frontStore/customer/address/addressForm/ProvinceAndPostcode.js';
import { CustomerAddressGraphql } from '@evershop/evershop/types/customerAddress';
import React from 'react';
import { useFormContext } from 'react-hook-form';

interface CustomerAddressFormProps {
  allowCountries: {
    value: string;
    label: string;
    provinces: {
      value: string;
      label: string;
    }[];
  }[];
  address?: CustomerAddressGraphql;
  areaId?: string;
  fieldNamePrefix?: string;
}
export function CustomerAddressForm({
  allowCountries = [],
  address = {},
  areaId = 'customerAddressForm',
  fieldNamePrefix = 'address'
}: CustomerAddressFormProps) {
  const { watch, setValue } = useFormContext();

  const getFieldName = (fieldName: string) => {
    return fieldNamePrefix ? `${fieldNamePrefix}.${fieldName}` : fieldName;
  };

  // If only one country is allowed (e.g. RD only), pre-select it so the
  // customer doesn't have to open the dropdown for a single option.
  const onlyCountry =
    allowCountries.length === 1 ? allowCountries[0].value : '';

  const selectedCountry = watch(
    getFieldName('country'),
    address?.country?.code || onlyCountry
  );
  return (
    <Area
      id={areaId}
      className="space-y-3"
      coreComponents={[
        {
          component: {
            default: (
              <NameAndTelephone
                fullName={address?.fullName || ''}
                telephone={address?.telephone || ''}
                getFieldName={getFieldName}
              />
            )
          },
          sortOrder: 10
        },
        {
          component: {
            default: (
              <InputField
                name={getFieldName('address_1')}
                label="Dirección"
                placeholder="Calle, número, sector"
                defaultValue={address?.address1 || ''}
                required
                validation={{
                  required: 'La dirección es obligatoria'
                }}
              />
            )
          },
          sortOrder: 20
        },
        {
          component: {
            default: (
              <InputField
                name={getFieldName('address_2')}
                label="Dirección 2 (opcional)"
                placeholder="Apto, edificio, referencias"
                defaultValue={address?.address2 || ''}
              />
            )
          },
          sortOrder: 30
        },
        {
          component: {
            default: (
              <InputField
                name={getFieldName('city')}
                label="Ciudad"
                placeholder="Ciudad"
                required
                validation={{ required: 'La ciudad es obligatoria' }}
                defaultValue={address?.city || ''}
              />
            )
          },
          sortOrder: 40
        },
        {
          component: {
            default: (
              <SelectField
                defaultValue={address?.country?.code || onlyCountry}
                label="País"
                name={getFieldName('country')}
                placeholder="Selecciona tu país"
                onChange={(value) => {
                  setValue(getFieldName('country'), value);
                  setValue(getFieldName('province'), '');
                }}
                required
                validation={{ required: 'El país es obligatorio' }}
                options={allowCountries}
              />
            )
          },
          sortOrder: 50
        },
        {
          component: {
            default: (
              <ProvinceAndPostcode
                key={selectedCountry}
                provinces={
                  allowCountries.find(
                    (country) => country.value === selectedCountry
                  )?.provinces || []
                }
                province={address?.province || { code: '' }}
                postcode={address?.postcode || ''}
                getFieldName={getFieldName}
              />
            )
          },
          sortOrder: 60
        }
      ]}
    />
  );
}
