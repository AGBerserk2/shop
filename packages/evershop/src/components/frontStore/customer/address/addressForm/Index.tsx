import { CustomerAddressForm } from '@components/frontStore/customer/address/addressForm/AddressForm.js';
import { AddressFormLoadingSkeleton } from '@components/frontStore/customer/address/addressForm/AddressFormLoadingSkeleton.js';
import { CustomerAddressGraphql } from '@evershop/evershop/types/customerAddress';
import React from 'react';
import { useQuery } from 'urql';

// We query the full country list (countries) instead of allowedCountries
// here: the address form's job is to let the customer save where they
// live, regardless of whether shipping zones are configured in the
// admin yet. The shipping-zone restriction kicks in at checkout, which
// is the right place to reject 'no podemos enviar a tu país' — not at
// the address-book step.
const CountriesQuery = `
  query Country {
    countries {
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
    query: CountriesQuery
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
