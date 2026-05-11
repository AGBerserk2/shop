import { Bell, ExternalLink, ShoppingCart } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';
import { useQuery } from 'urql';

type OrderItem = {
  orderId: number;
  uuid: string;
  orderNumber: string;
  createdAt: string;
  grandTotal: string;
  customerFullName: string | null;
  customerEmail: string | null;
  url: string;
};

// We poll the orders grid every 30 seconds. Lightweight query — only the
// latest 5 orders sorted by created_at DESC.
const QUERY = `
  query LatestOrders {
    orders(filters: [{ key: "sortBy", operation: eq, value: "createdAt" }, { key: "sortOrder", operation: eq, value: "DESC" }, { key: "limit", operation: eq, value: "5" }]) {
      items {
        orderId
        uuid
        orderNumber
        url: editUrl
        createdAt {
          value
        }
        grandTotal {
          text
        }
        customerFullName
        customerEmail
      }
    }
  }
`;

const STORAGE_KEY = 'anroy.lastSeenOrderId';

function readLastSeen(): number {
  if (typeof window === 'undefined') return 0;
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  return stored ? Number(stored) || 0 : 0;
}

function writeLastSeen(orderId: number) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(orderId));
  } catch {
    /* ignore */
  }
}

function timeAgo(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then) / 1000;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.round(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.round(diff / 3600)} h`;
    return `hace ${Math.round(diff / 86400)} días`;
  } catch {
    return iso;
  }
}

export default function OrderNotifications() {
  const [open, setOpen] = React.useState(false);
  const [lastSeen, setLastSeen] = React.useState<number>(() => readLastSeen());
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [result, refetch] = useQuery({
    query: QUERY,
    requestPolicy: 'network-only'
  });

  const items: OrderItem[] = React.useMemo(() => {
    return (result?.data?.orders?.items || []).map((o: any) => ({
      orderId: o.orderId,
      uuid: o.uuid,
      orderNumber: o.orderNumber,
      url: o.url,
      createdAt: o.createdAt?.value || '',
      grandTotal: o.grandTotal?.text || '',
      customerFullName: o.customerFullName,
      customerEmail: o.customerEmail
    }));
  }, [result?.data]);

  // Refetch every 30s while the tab is visible.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refetch({ requestPolicy: 'network-only' });
      }
    }, 30000);
    return () => clearInterval(id);
  }, [refetch]);

  // Detect new orders and toast for them. Initialize lastSeen on first load
  // so the first poll doesn't toast every historical order.
  const initialized = React.useRef(false);
  React.useEffect(() => {
    if (items.length === 0) return;
    if (!initialized.current) {
      initialized.current = true;
      // If no last seen yet, set to the newest order without toasting.
      if (lastSeen === 0) {
        setLastSeen(items[0].orderId);
        writeLastSeen(items[0].orderId);
      }
      return;
    }
    const fresh = items.filter((o) => o.orderId > lastSeen);
    if (fresh.length > 0) {
      // Toast the first one only, badge handles the rest.
      const first = fresh[0];
      toast.success(
        `Nuevo pedido #${first.orderNumber} · ${first.grandTotal}`,
        {
          onClick: () => {
            window.location.href = first.url;
          }
        }
      );
    }
  }, [items, lastSeen]);

  const unread = items.filter((o) => o.orderId > lastSeen);

  // Mark all visible orders as seen when dropdown is opened.
  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && items.length > 0) {
      const newest = items[0].orderId;
      setLastSeen(newest);
      writeLastSeen(newest);
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notificaciones (${unread.length} sin leer)`}
        title="Pedidos recientes"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm ring-2 ring-background">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-popover text-popover-foreground shadow-xl ring-1 ring-black/5 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <div className="text-sm font-bold">Pedidos recientes</div>
              <div className="text-[11px] text-muted-foreground">
                Se actualiza cada 30 segundos
              </div>
            </div>
            <a
              href="/admin/orders"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver todos
            </a>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" strokeWidth={1.5} />
                Sin pedidos por ahora.
              </div>
            ) : (
              items.map((o) => {
                const isNew = o.orderId > lastSeen - items.length; // visual highlight for recent
                return (
                  <a
                    key={o.orderId}
                    href={o.url}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isNew
                          ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">
                          Pedido #{o.orderNumber}
                        </div>
                        <div className="text-sm font-bold tabular-nums">{o.grandTotal}</div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {o.customerFullName || o.customerEmail || 'Cliente invitado'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {timeAgo(o.createdAt)}
                      </div>
                    </div>
                    <ExternalLink
                      className="w-3.5 h-3.5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100"
                      strokeWidth={1.75}
                    />
                  </a>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const layout = {
  areaId: 'header',
  sortOrder: 45
};
