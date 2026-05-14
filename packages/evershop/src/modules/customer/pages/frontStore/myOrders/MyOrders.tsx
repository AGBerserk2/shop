import { Image } from '@components/common/Image.js';
import { ProductNoThumbnail } from '@components/common/ProductNoThumbnail.js';
import {
  Order,
  useCustomer
} from '@components/frontStore/customer/CustomerContext.jsx';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  XCircle
} from 'lucide-react';
import React from 'react';
import './MyOrders.scss';

type Tone = 'shipped' | 'delivered' | 'processing' | 'cancelled';

function statusTone(code: string): Tone {
  const c = (code || '').toLowerCase();
  if (c.includes('cancel')) return 'cancelled';
  if (c.includes('deliver') || c.includes('complete')) return 'delivered';
  if (c.includes('ship') || c.includes('dispatch')) return 'shipped';
  return 'processing';
}

// Three customer-facing stages. We map every shipment status into one
// of these so the customer sees the same simple flow regardless of
// what's happening on the admin side.
type Stage = 0 | 1 | 2;
const STAGE_LABELS = ['Compra', 'De camino', 'Entregada'] as const;

function stageIndex(tone: Tone): Stage {
  if (tone === 'delivered') return 2;
  if (tone === 'shipped') return 1;
  return 0;
}

const STATUS_LABEL: Record<Tone, string> = {
  delivered: 'Entregada',
  shipped: 'De camino',
  processing: 'Compra confirmada',
  cancelled: 'Cancelado'
};

const STATUS_ICON: Record<Tone, React.ReactNode> = {
  delivered: <PackageCheck strokeWidth={2} />,
  shipped: <Truck strokeWidth={2} />,
  processing: <ShoppingCart strokeWidth={2} />,
  cancelled: <XCircle strokeWidth={2} />
};

const STATUS_BLURB: Record<Tone, string> = {
  delivered: 'Tu pedido ya está en tus manos. ¡Disfrutalo!',
  shipped: 'Ya salió. Llega en 1–3 días hábiles.',
  processing: 'Lo estamos preparando con cariño.',
  cancelled: 'Este pedido fue cancelado.'
};

const PENDING_TONES: Tone[] = ['processing', 'shipped'];

const STAGE_ICONS: React.ReactNode[] = [
  <ShoppingCart strokeWidth={2.2} key="0" />,
  <Truck strokeWidth={2.2} key="1" />,
  <PackageCheck strokeWidth={2.2} key="2" />
];

const Tracker: React.FC<{ stage: Stage }> = ({ stage }) => (
  <div className="anroy-tracker" role="list" aria-label="Estado del pedido">
    {STAGE_LABELS.map((label, i) => {
      const reached = i <= stage;
      const current = i === stage;
      return (
        <React.Fragment key={label}>
          <div
            className={
              `anroy-tracker__step` +
              (reached ? ' is-reached' : '') +
              (current ? ' is-current' : '')
            }
            role="listitem"
            aria-current={current ? 'step' : undefined}
          >
            <span className="anroy-tracker__dot" aria-hidden>
              {reached && !current ? (
                <CheckCircle2 strokeWidth={2.4} />
              ) : (
                STAGE_ICONS[i]
              )}
            </span>
            <span className="anroy-tracker__label">{label}</span>
          </div>
          {i < STAGE_LABELS.length - 1 && (
            <span
              className={
                `anroy-tracker__line` + (i < stage ? ' is-reached' : '')
              }
              aria-hidden
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const OrderCard: React.FC<{ order: Order; highlighted?: boolean }> = ({
  order,
  highlighted
}) => {
  const tone = statusTone(order.status?.code || order.status?.name || '');
  const stage = stageIndex(tone);
  const items = order.items || [];
  const isCancelled = tone === 'cancelled';
  return (
    <article
      className={`anroy-orders__card ${highlighted ? 'is-pending' : ''}`}
      data-tone={tone}
    >
      <header className="anroy-orders__card-head">
        <div className="anroy-orders__card-status">
          <span className="anroy-orders__card-status-icon">
            {STATUS_ICON[tone]}
          </span>
          <span className="anroy-orders__card-status-label">
            {STATUS_LABEL[tone]}
          </span>
        </div>
        <span className="anroy-orders__card-number">
          #{order.orderNumber}
        </span>
      </header>

      <div className="anroy-orders__card-meta">
        <span>{order.createdAt?.text || '—'}</span>
        <span>·</span>
        <span>
          {items.length} pieza{items.length === 1 ? '' : 's'}
        </span>
      </div>

      {!isCancelled && <Tracker stage={stage} />}

      <p className="anroy-orders__card-blurb">{STATUS_BLURB[tone]}</p>

      <div className="anroy-orders__card-items">
        {items.slice(0, 4).map((item) => (
          <div className="anroy-orders__card-item" key={item.uuid}>
            <div className="anroy-orders__thumb">
              {item.thumbnail ? (
                <Image
                  width={48}
                  height={48}
                  src={item.thumbnail}
                  alt={item.productName}
                />
              ) : (
                <ProductNoThumbnail width={28} height={28} />
              )}
            </div>
            <div className="anroy-orders__card-item-body">
              <div className="anroy-orders__card-item-name">
                {item.productName}
              </div>
              <div className="anroy-orders__card-item-meta">
                ×{item.qty} · {item.productPrice?.text}
              </div>
            </div>
          </div>
        ))}
        {items.length > 4 && (
          <div className="anroy-orders__card-more">
            + {items.length - 4} producto{items.length - 4 === 1 ? '' : 's'} más
          </div>
        )}
      </div>

      <footer className="anroy-orders__card-foot">
        <div className="anroy-orders__card-total">
          <span className="anroy-orders__card-total-label">Total</span>
          <span className="anroy-orders__card-total-value">
            {order.grandTotal?.text}
          </span>
        </div>
        <button type="button" className="anroy-orders__card-cta">
          Ver detalles
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </footer>
    </article>
  );
};

export default function MyOrders() {
  const { customer } = useCustomer();
  if (!customer) return null;

  const orders = customer.orders || [];
  const pendingOrders = orders.filter((o) =>
    PENDING_TONES.includes(
      statusTone(o.status?.code || o.status?.name || '')
    )
  );
  const completedOrders = orders.filter(
    (o) => !PENDING_TONES.includes(
      statusTone(o.status?.code || o.status?.name || '')
    )
  );

  const totalSpent = orders.reduce(
    (s, o) => s + (o.grandTotal?.value || 0),
    0
  );
  const formatMoney = (v: number) => {
    try {
      return new Intl.NumberFormat('es-DO', {
        maximumFractionDigits: 0
      }).format(v);
    } catch {
      return v.toFixed(0);
    }
  };

  return (
    <div className="anroy-orders">
      <div className="anroy-orders__shell">
        {/* Top bar */}
        <div className="anroy-orders__bar">
          <a
            href="/account"
            className="anroy-orders__back"
            aria-label="Volver"
            onClick={(e) => {
              // Prefer real browser back so deep-links work; only fall
              // back to /account when there's no history to pop (the
              // user landed here directly, e.g. opened the link in a
              // new tab).
              if (typeof window !== 'undefined' && window.history.length > 1) {
                e.preventDefault();
                window.history.back();
              }
            }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
          </a>
          <span className="anroy-orders__title">Mis pedidos</span>
          <span className="anroy-orders__menu" aria-hidden />
        </div>

        {/* Stats */}
        <div className="anroy-orders__stats">
          <div className="anroy-orders__stat">
            <div className="anroy-orders__stat-value">{orders.length}</div>
            <div className="anroy-orders__stat-label">Total</div>
          </div>
          <div className="anroy-orders__stat">
            <div className="anroy-orders__stat-value anroy-orders__stat-value--accent">
              {pendingOrders.length}
            </div>
            <div className="anroy-orders__stat-label">Pendientes</div>
          </div>
          <div className="anroy-orders__stat">
            <div className="anroy-orders__stat-value">
              {formatMoney(totalSpent)}
            </div>
            <div className="anroy-orders__stat-label">DOP</div>
          </div>
        </div>

        {/* Empty state */}
        {orders.length === 0 && (
          <div className="anroy-orders__empty">
            <span className="anroy-orders__empty-icon">
              <Package className="w-7 h-7" strokeWidth={2} />
            </span>
            <h3 className="anroy-orders__empty-title">
              Aún no tenés pedidos
            </h3>
            <p className="anroy-orders__empty-sub">
              Cuando hagas tu primer pedido en Anroy lo vas a ver acá, con
              todos sus detalles y el estado del envío.
            </p>
            <a href="/" className="anroy-orders__empty-cta">
              <ShoppingBag className="w-4 h-4" strokeWidth={2.2} />
              Explorar tienda
            </a>
          </div>
        )}

        {/* Pending highlight */}
        {pendingOrders.length > 0 && (
          <section className="anroy-orders__section">
            <header className="anroy-orders__section-head">
              <div>
                <span className="anroy-orders__section-kicker">
                  En curso
                </span>
                <h2 className="anroy-orders__section-title">
                  {pendingOrders.length === 1
                    ? '1 pedido en camino'
                    : `${pendingOrders.length} pedidos en camino`}
                </h2>
              </div>
              <span className="anroy-orders__live-dot" aria-hidden>
                <span />
              </span>
            </header>
            <div className="anroy-orders__list">
              {pendingOrders.map((order) => (
                <OrderCard order={order} highlighted key={order.orderId} />
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {completedOrders.length > 0 && (
          <section className="anroy-orders__section">
            <header className="anroy-orders__section-head">
              <div>
                <span className="anroy-orders__section-kicker">
                  Historial
                </span>
                <h2 className="anroy-orders__section-title">
                  Pedidos anteriores
                </h2>
              </div>
              <span className="anroy-orders__section-tag">
                {completedOrders.length}
              </span>
            </header>
            <div className="anroy-orders__list">
              {completedOrders.map((order) => (
                <OrderCard order={order} key={order.orderId} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
