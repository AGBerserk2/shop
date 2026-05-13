import { CustomerAddressForm } from '@components/frontStore/customer/address/addressForm/AddressForm.js';
import { AddressFormLoadingSkeleton } from '@components/frontStore/customer/address/addressForm/AddressFormLoadingSkeleton.js';
import { CustomerAddressGraphql } from '@evershop/evershop/types/customerAddress';
import React from 'react';
import { useQuery } from 'urql';

// Anroy ships only inside the Dominican Republic for now. The form's
// country dropdown is hard-restricted here to ["DO"] so the customer
// can't pick anywhere else. Once we expand internationally we'll
// either widen this list or swap back to `allowedCountries` once
// shipping zones are configured in the admin.
const ALLOWED_COUNTRY_CODES = ['DO'];

const CountriesQuery = `
  query Country($only: [String]) {
    countries(countries: $only) {
      value: code
      label: name
      provinces {
        label: name
        value: code
      }
    }
  }
`;

interface IndexProps {
  address?: CustomerAddressGraphql;
  areaId?: string;
  fieldNamePrefix?: string;
}

export default function Index({
  address = {},
  areaId = 'customerAddressForm',
  fieldNamePrefix = 'address'
}: IndexProps) {
  const [result] = useQuery({
    query: CountriesQuery,
    variables: { only: ALLOWED_COUNTRY_CODES }
  });

  const { data, fetching, error } = result;

  if (fetching) return <AddressFormLoadingSkeleton />;
  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  return (
    <CustomerAddressForm
      address={address}
      areaId={areaId}
      allowCountries={data.countries}
      fieldNamePrefix={fieldNamePrefix}
    />
  );
}
