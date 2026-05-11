import { NavigationItemGroup } from '@components/admin/NavigationItemGroup';
import { User } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export default function CustomerMenuGroup({ customerGrid }) {
  return (
    <NavigationItemGroup
      id="customerMenuGroup"
      name="Clientes"
      items={[
        {
          Icon: User,
          url: customerGrid,
          title: 'Clientes'
        }
      ]}
    />
  );
}

CustomerMenuGroup.propTypes = {
  customerGrid: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 40
};

export const query = `
  query Query {
    customerGrid: url(routeId:"customerGrid")
  }
`;
