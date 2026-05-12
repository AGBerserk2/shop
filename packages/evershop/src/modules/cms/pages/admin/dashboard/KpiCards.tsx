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
  tone = 'default'
}: {
  title: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  tone?: keyof typeof TONE_STYLES;
}) {
  const t = TONE_STYLES[tone] || TONE_STYLES.default;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ring-1 ${t.ring} ${t.bg} ${t.fg} shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold tabular-nums leading-tight">{value}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5 truncate">
              {title}
            </div>
          </div>
        </div>
        {hint && <div className="mt-3">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Resumen operativo</CardTitle>
          <CardDescription>
            {range.label} · comparado con el período anterior
          </CardDescription>
        </div>
        <DateRangePicker />
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive">{error.message}</div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {fetching && !stats
            ? Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
            : stats && (
                <>
                  <KpiCard
                    title="Ventas"
                    value={stats.revenue.text}
                    hint={<ChangeBadge pct={stats.revenue.changePct} />}
                    icon={<TrendingUp className="w-5 h-5" strokeWidth={1.75} />}
                    tone="info"
                  />
                  <KpiCard
                    title="Pedidos"
                    value={stats.orderCount.value}
                    hint={<ChangeBadge pct={stats.orderCount.changePct} />}
                    icon={<ShoppingBag className="w-5 h-5" strokeWidth={1.75} />}
                    tone="mint"
                  />
                  <KpiCard
                    title="Ticket promedio"
                    value={stats.averageOrderValue.text}
                    hint={<ChangeBadge pct={stats.averageOrderValue.changePct} />}
                    icon={<TrendingUp className="w-5 h-5" strokeWidth={1.75} />}
                    tone="success"
                  />
                  <KpiCard
                    title="Clientes nuevos"
                    value={stats.newCustomers}
                    icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
                    tone="peach"
                  />
                  <KpiCard
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
      </CardContent>
    </Card>
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
