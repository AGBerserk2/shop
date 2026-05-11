import { NavigationItemGroup } from '@components/admin/NavigationItemGroup.js';
import { GiftIcon } from 'lucide-react';
import React from 'react';

interface CouponMenuGroupProps {
  couponGrid: string;
}

export default function CatalogMenuGroup({ couponGrid }: CouponMenuGroupProps) {
  return (
    <NavigationItemGroup
      id="couponMenuGroup"
      name="Promociones"
      items={[
        {
          Icon: GiftIcon,
          url: couponGrid,
          title: 'Cupones'
        }
      ]}
    />
  );
}

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 50
};

export const query = `
  query Query {
    couponGrid: url(routeId:"couponGrid")
  }
`;
