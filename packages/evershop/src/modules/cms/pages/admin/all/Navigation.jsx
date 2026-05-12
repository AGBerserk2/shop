import Area from '@components/common/Area';
import { Menu, X } from 'lucide-react';
import React from 'react';
import './Navigation.scss';
import { SidebarBrand } from './SidebarBrand.js';
import { SidebarLogout } from './SidebarLogout.js';

// Sidebar with responsive behaviour:
//   - desktop: full panel with profile + labels
//   - tablet:  collapsed rail (CSS-driven, expands on hover)
//   - mobile:  drawer that slides in over a backdrop
// A single class on <body> drives the mobile drawer so it's reachable
// from any page chrome (header, page-heading, etc.) without prop drilling.
export default function AdminNavigation() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('anroy-sidebar-open', mobileOpen);
    return () => document.body.classList.remove('anroy-sidebar-open');
  }, [mobileOpen]);

  // Close the drawer on Escape and on route change (link click).
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="anroy-mobile-menu"
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.75} /> : <Menu className="w-5 h-5" strokeWidth={1.75} />}
      </button>
      <SidebarBrand />
      <div className="admin-nav-container">
        <nav className="admin-nav" onClick={() => setMobileOpen(false)}>
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
