import { Home, Package, User } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import './MobileTabBar.scss';

const QUERY = `
  query MobileTabBarCustomer {
    customer: currentCustomer {
      uuid
    }
  }
`;

// Persistent bottom tab bar, mobile-first. Mounts on every storefront
// page via the body area (sortOrder 1000 — after Base). It can't pull
// `useCustomer` from CustomerProvider because that provider only wraps
// the children inside Base.tsx, not sibling body-area components, so
// it reads the same data via urql directly (resolves from SSR cache).
export default function MobileTabBar() {
  const [result] = useQuery({ query: QUERY });
  const isLoggedIn = !!result.data?.customer?.uuid;

  const [path, setPath] = React.useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  React.useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  const profileHref = isLoggedIn ? '/account' : '/account/login';
  const ordersHref = isLoggedIn ? '/account/orders' : '/account/login';
  const ordersActive = path.startsWith('/account/orders');

  const tabs = [
    {
      label: 'Inicio',
      icon: <Home strokeWidth={2} />,
      href: '/',
      isActive: path === '/' || path === ''
    },
    {
      label: 'Mis pedidos',
      icon: <Package strokeWidth={2} />,
      href: ordersHref,
      isActive: ordersActive
    },
    {
      label: 'Perfil',
      icon: <User strokeWidth={2} />,
      href: profileHref,
      isActive: path.startsWith('/account') && !ordersActive
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
