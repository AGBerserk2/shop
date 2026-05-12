import Area from '@components/common/Area';
import React from 'react';
import './Navigation.scss';
import { SidebarBrand } from './SidebarBrand.js';
import { SidebarLogout } from './SidebarLogout.js';

// The sidebar mirrors the reference dashboard: a dark navy-teal panel with
// the user profile block at the top, the menu in the middle, and the logout
// pinned to the bottom.
export default function AdminNavigation() {
  return (
    <>
      <SidebarBrand />
      <div className="admin-nav-container">
        <nav className="admin-nav">
          <ul className="list-unstyled">
            <Area id="adminMenu" noOuter />
          </ul>
        </nav>
      </div>
      <SidebarLogout />
    </>
  );
}

export const layout = {
  areaId: 'adminNavigation',
  sortOrder: 10
};
