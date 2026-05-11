import { NavigationItemGroup } from '@components/admin/NavigationItemGroup.js';
import { Package } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export default function OmsMenuGroup({ orderGrid }) {
  return (
    <NavigationItemGroup
      id="omsMenuGroup"
      name="Ventas"
      items={[
        {
          Icon: Package,
          url: orderGrid,
          title: 'Pedidos'
        }
      ]}
    />
  );
}

OmsMenuGroup.propTypes = {
  orderGrid: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 30
};

export const query = `
  query Query {
    orderGrid: url(routeId:"orderGrid")
  }
`;
