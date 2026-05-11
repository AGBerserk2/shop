import {
  Box,
  Command,
  CornerDownLeft,
  FileText,
  Gift,
  Layers,
  LayoutGrid,
  Package,
  Search,
  Settings,
  Star,
  Tag,
  User,
  Users
} from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';

// ----------------------------------------------------------------------------
// Quick-action shortcuts: hardcoded admin routes the operator can jump to
// without typing a search term. They show up as soon as the palette opens.
// ----------------------------------------------------------------------------
type QuickAction = {
  id: string;
  label: string;
  url: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  keywords: string[];
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'dashboard',
    label: 'Panel principal',
    url: '/admin/dashboard',
    icon: LayoutGrid,
    keywords: ['dashboard', 'inicio', 'panel', 'home']
  },
  {
    id: 'products',
    label: 'Productos',
    url: '/admin/products',
    icon: Box,
    keywords: ['producto', 'productos', 'catalogo', 'catálogo']
  },
  {
    id: 'product-new',
    label: 'Crear producto',
    url: '/admin/products/new',
    icon: Box,
    keywords: ['crear', 'nuevo', 'producto', 'add']
  },
  {
    id: 'categories',
    label: 'Categorías',
    url: '/admin/categories',
    icon: Layers,
    keywords: ['categoría', 'categorias', 'category']
  },
  {
    id: 'collections',
    label: 'Colecciones',
    url: '/admin/collections',
    icon: Tag,
    keywords: ['colección', 'collections']
  },
  {
    id: 'orders',
    label: 'Pedidos',
    url: '/admin/orders',
    icon: Package,
    keywords: ['pedido', 'pedidos', 'orders', 'venta']
  },
  {
    id: 'customers',
    label: 'Clientes',
    url: '/admin/customers',
    icon: Users,
    keywords: ['cliente', 'clientes', 'customer']
  },
  {
    id: 'coupons',
    label: 'Cupones',
    url: '/admin/coupons',
    icon: Gift,
    keywords: ['cupón', 'cupones', 'descuento', 'promo']
  },
  {
    id: 'reviews',
    label: 'Reseñas',
    url: '/admin/reviews',
    icon: Star,
    keywords: ['reseña', 'review', 'rating', 'estrella']
  },
  {
    id: 'pages',
    label: 'Páginas (CMS)',
    url: '/admin/cms-pages',
    icon: FileText,
    keywords: ['página', 'pagina', 'cms', 'content']
  },
  {
    id: 'widgets',
    label: 'Widgets',
    url: '/admin/widgets',
    icon: LayoutGrid,
    keywords: ['widget', 'home', 'slideshow']
  },
  {
    id: 'settings',
    label: 'Configuración de tienda',
    url: '/admin/setting/store',
    icon: Settings,
    keywords: ['ajuste', 'setting', 'tienda', 'logo', 'config']
  }
];

const SEARCH_QUERY = `
  query AdminSearch($filters: [FilterInput]) {
    customers(filters: $filters) {
      items {
        customerId
        uuid
        fullName
        email
        url: editUrl
      }
    }
    products(filters: $filters) {
      items {
        productId
        uuid
        sku
        name
        url: editUrl
      }
    }
    orders(filters: $filters) {
      items {
        orderId
        uuid
        orderNumber
        url: editUrl
      }
    }
  }
`;

type ResultItem = {
  id: string;
  label: string;
  secondary?: string;
  url: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  groupLabel: string;
};

function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
}

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounced(query.trim(), 250);
  const shouldSearch = debouncedQuery.length >= 2;

  const [searchResult] = useQuery({
    query: SEARCH_QUERY,
    variables: {
      filters: shouldSearch
        ? [
            { key: 'keyword', operation: 'eq', value: debouncedQuery },
            { key: 'limit', operation: 'eq', value: '5' }
          ]
        : []
    },
    pause: !open || !shouldSearch
  });
  const { data, fetching } = searchResult;

  // Keyboard shortcut: ⌘K / Ctrl+K opens, Esc closes.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inAdmin =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      if (!inAdmin) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Build the flat list of results: filtered quick actions first, then live
  // search hits. Indices into this list power keyboard navigation.
  const filteredQuickActions: ResultItem[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUICK_ACTIONS.filter((a) => {
      if (!q) return true;
      return (
        a.label.toLowerCase().includes(q) ||
        a.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }).map((a) => ({
      id: `qa:${a.id}`,
      label: a.label,
      url: a.url,
      icon: a.icon,
      groupLabel: 'Atajos'
    }));
  }, [query]);

  const liveResults: ResultItem[] = React.useMemo(() => {
    if (!data) return [];
    const items: ResultItem[] = [];
    (data.products?.items || []).forEach((p: any) => {
      items.push({
        id: `prod:${p.uuid}`,
        label: p.name || `Producto #${p.productId}`,
        secondary: p.sku ? `SKU · ${p.sku}` : undefined,
        url: p.url,
        icon: Box,
        groupLabel: 'Productos'
      });
    });
    (data.orders?.items || []).forEach((o: any) => {
      items.push({
        id: `ord:${o.uuid}`,
        label: `Pedido #${o.orderNumber}`,
        url: o.url,
        icon: Package,
        groupLabel: 'Pedidos'
      });
    });
    (data.customers?.items || []).forEach((c: any) => {
      items.push({
        id: `cus:${c.uuid}`,
        label: c.fullName || c.email,
        secondary: c.email && c.fullName ? c.email : undefined,
        url: c.url,
        icon: User,
        groupLabel: 'Clientes'
      });
    });
    return items;
  }, [data]);

  const allResults = React.useMemo(
    () => [...filteredQuickActions, ...liveResults],
    [filteredQuickActions, liveResults]
  );

  React.useEffect(() => {
    setActiveIndex(0);
  }, [allResults.length, query]);

  // Scroll the active item into view when navigating with arrows.
  React.useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    if (node) {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(allResults.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = allResults[activeIndex];
      if (target) {
        window.location.href = target.url;
      }
    }
  };

  if (!open) {
    return null;
  }

  // Group result items so they render with a heading. Keep insertion order.
  const grouped: { label: string; items: { item: ResultItem; index: number }[] }[] = [];
  allResults.forEach((item, index) => {
    const last = grouped[grouped.length - 1];
    if (last && last.label === item.groupLabel) {
      last.items.push({ item, index });
    } else {
      grouped.push({ label: item.groupLabel, items: [{ item, index }] });
    }
  });

  const hotkeyLabel = isApplePlatform() ? '⌘K' : 'Ctrl+K';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Buscador del admin"
    >
      <div
        className="w-full max-w-xl rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Buscar productos, pedidos, clientes o saltar a una pantalla…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground shrink-0">
            ESC
          </span>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {allResults.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              {fetching ? (
                <span>Buscando…</span>
              ) : query.trim().length === 0 ? (
                <span>Escribe para buscar o usa las flechas para navegar.</span>
              ) : query.trim().length < 2 ? (
                <span>Escribe al menos 2 caracteres.</span>
              ) : (
                <span>
                  Sin resultados para <span className="font-semibold">&ldquo;{query}&rdquo;</span>
                </span>
              )}
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.label} className="mb-1">
              <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </div>
              {group.items.map(({ item, index }) => {
                const active = activeIndex === index;
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    data-index={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                      active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                      strokeWidth={1.75}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{item.label}</div>
                      {item.secondary && (
                        <div
                          className={`text-xs truncate ${
                            active ? 'text-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {item.secondary}
                        </div>
                      )}
                    </div>
                    {active && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono">↓</kbd>
              navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono">↵</kbd>
              abrir
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <Command className="w-3 h-3" />
            {hotkeyLabel} para abrir
          </span>
        </div>
      </div>
    </div>
  );
}
