import { NavigationItem } from '@components/admin/NavigationItem.js';
import { User } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export default function CustomerMenuGroup({ customerGrid }) {
  return <NavigationItem Icon={User} url={customerGrid} title="Clientes" />;
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
