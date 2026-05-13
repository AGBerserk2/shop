import { useCustomer } from '@components/frontStore/customer/CustomerContext.js';
import { Home, Package, ShoppingBag, User } from 'lucide-react';
import React from 'react';
import './MobileTabBar.scss';

// Persistent bottom tab bar, mobile-first. Mounts on every storefront
// page via the body area. Active state is derived from the URL prefix.
export default function MobileTabBar() {
  const { customer } = useCustomer();
  const [path, setPath] = React.useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  React.useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  const profileHref = customer ? '/account' : '/account/login';
  const tabs = [
    {
      label: 'Inicio',
      icon: <Home strokeWidth={2} />,
      href: '/',
      isActive: path === '/' || path === ''
    },
    {
      label: 'Tienda',
      icon: <ShoppingBag strokeWidth={2} />,
      href: '/categories',
      isActive: path.startsWith('/categories') || path.startsWith('/products')
    },
    {
      label: 'Pedidos',
      icon: <Package strokeWidth={2} />,
      href: customer ? '/account#pedidos' : '/account/login',
      isActive: path.startsWith('/account') && path.includes('order')
    },
    {
      label: 'Perfil',
      icon: <User strokeWidth={2} />,
      href: profileHref,
      isActive: path.startsWith('/account')
    }
  ];

  return (
    <nav className="anroy-tabbar" aria-label="Navegación rápida">
      <div className="anroy-tabbar__inner">
        {tabs.map((t) => (
          <a
            key={t.label}
            className="anroy-tabbar__tab"
            href={t.href}
            aria-current={t.isActive ? 'page' : undefined}
          >
            <span className="anroy-tabbar__icon">{t.icon}</span>
            <span className="anroy-tabbar__label">{t.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export const layout = {
  areaId: 'body',
  sortOrder: 1000
};
