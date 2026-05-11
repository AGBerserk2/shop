import { NavigationItem } from '@components/admin/NavigationItem.js';
import { Star } from 'lucide-react';
import React from 'react';

interface ReviewsMenuItemProps {
  url: string;
}

export default function ReviewsMenuItem({ url }: ReviewsMenuItemProps) {
  return <NavigationItem Icon={Star} title="Reseñas" url={url} />;
}

export const layout = {
  areaId: 'catalogMenuGroup',
  sortOrder: 50
};

export const query = `
  query Query {
    url: url(routeId: "reviewGrid")
  }
`;
