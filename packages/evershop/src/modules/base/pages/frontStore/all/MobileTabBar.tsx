import { Home, Package, ShoppingBag, User } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import './MobileTabBar.scss';

const QUERY = `
  query MobileTabBarData {
    customer: currentCustomer {
      uuid
    }
    myCart {
      totalQty
    }
  }
`;

interface Tab {
  label: string;
  icon: React.ReactNode;
  href: string;
  isActive: boolean;
  badge?: number;
  ariaLabel?: string;
}

// Persistent bottom tab bar, mobile-first. Mounts on every storefront
// page via the body area (sortOrder 1000 — after Base). It can't pull
// `useCustomer`/`useCartState` from their providers because those only
// wrap the children inside Base.tsx, not sibling body-area components,
// so it reads the same data via urql directly (resolves from SSR cache).
export default function MobileTabBar() {
  const [result] = useQuery({ query: QUERY });
  const isLoggedIn = !!result.data?.customer?.uuid;
  const cartQty: number = result.data?.myCart?.totalQty || 0;

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

  const tabs: Tab[] = [
    {
      label: 'Inicio',
      icon: <Home strokeWidth={2} />,
      href: '/',
      isActive: path === '/' || path === ''
    },
    {
      label: 'Carrito',
      icon: <ShoppingBag strokeWidth={2} />,
      href: '/cart',
      isActive: path.startsWith('/cart'),
      badge: cartQty,
      ariaLabel:
        cartQty > 0
          ? `Carrito, ${cartQty} ${cartQty === 1 ? 'artículo' : 'artículos'}`
          : 'Carrito'
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
            aria-label={t.ariaLabel}
          >
            <span className="anroy-tabbar__icon">
              {t.icon}
              {t.badge ? (
                <span className="anroy-tabbar__badge" aria-hidden>
                  {t.badge > 99 ? '99+' : t.badge}
                </span>
              ) : null}
            </span>
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
