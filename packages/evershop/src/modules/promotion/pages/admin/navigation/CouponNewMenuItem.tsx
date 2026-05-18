import { NavigationItem } from '@components/admin/NavigationItem.js';
import { Gift } from 'lucide-react';
import React from 'react';

interface CouponNewMenuItemProps {
  url: string;
}

export default function CouponNewMenuItem({ url }: CouponNewMenuItemProps) {
  return <NavigationItem Icon={Gift} title="Cupón nuevo" url={url} />;
}
