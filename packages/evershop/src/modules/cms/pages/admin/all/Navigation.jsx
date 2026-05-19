import Area from '@components/common/Area';
import { Menu, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import './Navigation.scss';
import { SidebarBrand } from './SidebarBrand.js';
import { SidebarLogout } from './SidebarLogout.js';

// Sidebar with responsive behaviour:
//   - desktop: full panel with profile + labels
//   - phone & tablet: drawer that slides in over a backdrop
// A single class on <body> drives the drawer so it's reachable from any
// page chrome without prop drilling.
export default function AdminNavigation() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.toggle('anroy-sidebar-open', mobileOpen);
    return () => document.body.classList.remove('anroy-sidebar-open');
  }, [mobileOpen]);

  // Close the drawer on Escape.
  React.useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // The menu trigger is portaled to <body>: its position:fixed must be
  // relative to the viewport. Left inside .admin-navigation it gets
  // dragged off-screen by the drawer's translateX transform.
  const menuButton = (
    <button
      type="button"
      className="anroy-mobile-menu"
      aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
      onClick={() => setMobileOpen((v) => !v)}
    >
      {mobileOpen ? (
        <X className="w-5 h-5" strokeWidth={1.75} />
      ) : (
        <Menu className="w-5 h-5" strokeWidth={1.75} />
      )}
    </button>
  );

  return (
    <>
      {mounted && createPortal(menuButton, document.body)}
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
