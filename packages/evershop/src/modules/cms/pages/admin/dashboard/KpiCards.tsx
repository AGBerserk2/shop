import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import {
  AlertCircle,
  CreditCard,
  PackageOpen,
  ShoppingBag,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import { useDateRange, DateRangePicker } from './DateRange.js';

const STATS_QUERY = `
  query DashboardStats($from: String, $to: String) {
    dashboardStats(from: $from, to: $to) {
      revenue { value text previousValue changePct }
      orderCount { value previousValue changePct }
      averageOrderValue { value text previousValue changePct }
      pendingFulfillment
      unpaidOrders
      pendingReviews
      outOfStockProducts
      lowStockProducts
      newCustomers
    }
  }
`;

type ChangeProps = { pct: number | null | undefined };

function ChangeBadge({ pct }: ChangeProps) {
  if (pct == null) {
    return <span className="text-xs text-muted-foreground">sin datos previos</span>;
  }
  const positive = pct > 0;
  const negative = pct < 0;
  const text = `${positive ? '↑' : negative ? '↓' : '·'} ${Math.abs(pct).toFixed(1)}%`;
  return (
    <span
      className={`text-xs font-medium tabular-nums ${
        positive ? 'text-emerald-600' : negative ? 'text-rose-600' : 'text-muted-foreground'
      }`}
      title="Comparado con el período anterior de la misma duración"
    >
      {text}
    </span>
  );
}

// Tone palette matched to the pastel-blue dashboard reference: each card pairs
// a soft tinted icon disc with a bold number. Hover gives the whole card a
// gentle teal ring so it feels alive without screaming.
const TONE_STYLES: Record<
  'default' | 'warning' | 'danger' | 'info' | 'success' | 'peach' | 'mint',
  { bg: string; fg: string; ring: string }
> = {
  default: { bg: 'bg-slate-100', fg: 'text-slate-700', ring: 'ring-slate-200' },
  info: { bg: 'bg-sky-100', fg: 'text-sky-700', ring: 'ring-sky-200' },
  warning: { bg: 'bg-amber-100', fg: 'text-amber-700', ring: 'ring-amber-200' },
  danger: { bg: 'bg-rose-100', fg: 'text-rose-700', ring: 'ring-rose-200' },
  success: { bg: 'bg-emerald-100', fg: 'text-emerald-700', ring: 'ring-emerald-200' },
  peach: { bg: 'bg-orange-100', fg: 'text-orange-700', ring: 'ring-orange-200' },
  mint: { bg: 'bg-teal-100', fg: 'text-teal-700', ring: 'ring-teal-200' }
};

function KpiCard({
  title,
  value,
  hint,
  icon,
  tone = 'default',
  index = 0
}: {
  title: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  tone?: keyof typeof TONE_STYLES;
  index?: number;
}) {
  const t = TONE_STYLES[tone] || TONE_STYLES.default;

  return (
    <div
      className="anroy-card anroy-rise p-5 group"
      style={{ animationDelay: `${100 + index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`anroy-glow w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${t.ring} ${t.bg} ${t.fg} shrink-0 transition-transform group-hover:scale-105`}
        >
          {icon}
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground leading-tight">
          {title}
        </span>
      </div>
      <div className="mt-4">
        <div className="font-display text-[2.25rem] leading-none text-foreground tabular-nums truncate">
          {value}
        </div>
      </div>
      {hint && <div className="mt-2 min-h-[18px]">{hint}</div>}
    </div>
  );
}

function KpiSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="anroy-card anroy-rise p-5" style={{ animationDelay: `${100 + index * 50}ms` }}>
      <div className="flex items-start justify-between">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
      <Skeleton className="h-9 w-24 rounded mt-4" />
      <Skeleton className="h-3 w-20 rounded mt-3" />
    </div>
  );
}

function KpiSkeletonOld() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-7 w-28 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </CardContent>
    </Card>
  );
}

function KpiCardsInner() {
  const { range } = useDateRange();
  const [result] = useQuery({
    query: STATS_QUERY,
    variables: { from: range.from, to: range.to }
  });
  const { data, fetching, error } = result;
  const stats = data?.dashboardStats;

  return (
    <section className="anroy-rise" style={{ animationDelay: '80ms' }}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-2xl md:text-3xl italic text-foreground leading-none">
            Resumen operativo
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            {range.label} · comparado con el período anterior
          </p>
        </div>
        <DateRangePicker />
      </div>

      {error && (
        <div className="anroy-card p-4 text-sm text-destructive mb-4">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {fetching && !stats
          ? Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} index={i} />)
          : stats && (
              <>
                <KpiCard
                  index={0}
                  title="Ventas"
                  value={stats.revenue.text}
                  hint={<ChangeBadge pct={stats.revenue.changePct} />}
                  icon={<TrendingUp className="w-5 h-5" strokeWidth={1.75} />}
                  tone="info"
                />
                <KpiCard
                  index={1}
                  title="Pedidos"
                  value={stats.orderCount.value}
                  hint={<ChangeBadge pct={stats.orderCount.changePct} />}
                  icon={<ShoppingBag className="w-5 h-5" strokeWidth={1.75} />}
                  tone="mint"
                />
                <KpiCard
                  index={2}
                  title="Ticket promedio"
                  value={stats.averageOrderValue.text}
                  hint={<ChangeBadge pct={stats.averageOrderValue.changePct} />}
                  icon={<TrendingUp className="w-5 h-5" strokeWidth={1.75} />}
                  tone="success"
                />
                <KpiCard
                  index={3}
                  title="Clientes nuevos"
                  value={stats.newCustomers}
                  icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
                  tone="peach"
                />
                <KpiCard
                  index={4}
                  title="Por enviar"
                  value={stats.pendingFulfillment}
                  hint={
                    stats.pendingFulfillment > 0 ? (
                      <a
                        href="/admin/orders?shipment_status=pending"
                        className="text-xs text-amber-700 hover:underline"
                      >
                        Ver pedidos →
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin pendientes</span>
                    )
                  }
                  icon={<PackageOpen className="w-5 h-5" strokeWidth={1.75} />}
                  tone={stats.pendingFulfillment > 0 ? 'warning' : 'default'}
                />
                <KpiCard
                  index={5}
                  title="Sin pago"
                  value={stats.unpaidOrders}
                  hint={
                    stats.unpaidOrders > 0 ? (
                      <a
                        href="/admin/orders?payment_status=pending"
                        className="text-xs text-rose-700 hover:underline"
                      >
                        Revisar →
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Todo cobrado</span>
                    )
                  }
                  icon={<CreditCard className="w-5 h-5" strokeWidth={1.75} />}
                  tone={stats.unpaidOrders > 0 ? 'danger' : 'default'}
                />
                <KpiCard
                  index={6}
                  title="Reseñas por moderar"
                  value={stats.pendingReviews}
                  hint={
                    stats.pendingReviews > 0 ? (
                      <a href="/admin/reviews?status=pending" className="text-xs text-amber-700 hover:underline">
                        Moderar →
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Al día</span>
                    )
                  }
                  icon={<Star className="w-5 h-5" strokeWidth={1.75} />}
                  tone={stats.pendingReviews > 0 ? 'warning' : 'default'}
                />
                <KpiCard
                  index={7}
                  title="Sin stock / bajo"
                  value={`${stats.outOfStockProducts} / ${stats.lowStockProducts}`}
                  hint={
                    stats.outOfStockProducts > 0 ? (
                      <a href="/admin/products" className="text-xs text-rose-700 hover:underline">
                        Ver productos →
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Bien surtido</span>
                    )
                  }
                  icon={<AlertCircle className="w-5 h-5" strokeWidth={1.75} />}
                  tone={stats.outOfStockProducts > 0 ? 'danger' : stats.lowStockProducts > 0 ? 'warning' : 'default'}
                />
              </>
            )}
      </div>
    </section>
  );
}

export default function KpiCards() {
  // DateRangeProvider is hoisted to Layout.jsx so all widgets share the picker.
  return <KpiCardsInner />;
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 1
};
