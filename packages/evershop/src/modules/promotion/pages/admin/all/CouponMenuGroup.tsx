import { NavigationItem } from '@components/admin/NavigationItem.js';
import { GiftIcon } from 'lucide-react';
import React from 'react';

interface CouponMenuGroupProps {
  couponGrid: string;
}

export default function CouponMenuGroup({ couponGrid }: CouponMenuGroupProps) {
  return <NavigationItem Icon={GiftIcon} url={couponGrid} title="Cupones" />;
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
