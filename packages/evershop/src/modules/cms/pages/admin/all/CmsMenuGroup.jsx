import { NavigationItemGroup } from '@components/admin/NavigationItemGroup';
import { Book, Puzzle } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

export default function CmsMenuGroup({ cmsPageGrid, widgetGrid }) {
  return (
    <NavigationItemGroup
      id="cmsMenuGroup"
      name="CMS"
      items={[
        {
          Icon: Book,
          url: cmsPageGrid,
          title: 'Páginas'
        },
        {
          Icon: Puzzle,
          url: widgetGrid,
          title: 'Widgets'
        }
      ]}
    />
  );
}

CmsMenuGroup.propTypes = {
  cmsPageGrid: PropTypes.string.isRequired,
  widgetGrid: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 60
};

export const query = `
  query Query {
    cmsPageGrid: url(routeId:"cmsPageGrid")
    widgetGrid: url(routeId:"widgetGrid")
  }
`;
