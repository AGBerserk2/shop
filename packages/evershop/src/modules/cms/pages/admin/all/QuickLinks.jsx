import { NavigationItem } from '@components/admin/NavigationItem.js';
import Area from '@components/common/Area.jsx';
import { HomeIcon } from 'lucide-react';
import PropTypes from 'prop-types';
import React from 'react';

// Quick links rendered flat at the top of the sidebar (no section header).
// Dashboard is always present here; other modules can plug additional links
// into the "quickLinks" area and they'll appear inline next to Dashboard.
export default function QuickLinks({ dashboard }) {
  return (
    <>
      <NavigationItem Icon={HomeIcon} url={dashboard} title="Inicio" />
      {/* Items registered to the "quickLinks" area follow inline below. */}
      <Area id="quickLinks" noOuter />
    </>
  );
}

QuickLinks.propTypes = {
  dashboard: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 10
};

export const query = `
  query Query {
    dashboard: url(routeId: "dashboard")
  }
`;
