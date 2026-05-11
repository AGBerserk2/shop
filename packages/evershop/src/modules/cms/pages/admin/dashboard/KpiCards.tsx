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
  tone?: 'default' | 'warning' | 'danger' | 'info';
}) {
  const toneRing =
    tone === 'warning'
      ? 'ring-amber-200'
      : tone === 'danger'
      ? 'ring-rose-200'
      : tone === 'info'
      ? 'ring-sky-200'
      : 'ring-gray-200';
  const toneBg =
    tone === 'warning'
      ? 'bg-amber-50'
      : tone === 'danger'
      ? 'bg-rose-50'
      : tone === 'info'
      ? 'bg-sky-50'
      : 'bg-muted/40';
  const toneFg =
    tone === 'warning'
      ? 'text-amber-700'
      : tone === 'danger'
      ? 'text-rose-700'
      : tone === 'info'
      ? 'text-sky-700'
      : 'text-foreground';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{title}</span>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ring-1 ${toneRing} ${toneBg} ${toneFg}`}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {hint && <div className="mt-1.5">{hint}</div>}
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
                    icon={<TrendingUp className="w-4 h-4" />}
                    tone="info"
                  />
                  <KpiCard
                    title="Pedidos"
                    value={stats.orderCount.value}
                    hint={<ChangeBadge pct={stats.orderCount.changePct} />}
                    icon={<ShoppingBag className="w-4 h-4" />}
                    tone="info"
                  />
                  <KpiCard
                    title="Ticket promedio"
                    value={stats.averageOrderValue.text}
                    hint={<ChangeBadge pct={stats.averageOrderValue.changePct} />}
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                  <KpiCard
                    title="Clientes nuevos"
                    value={stats.newCustomers}
                    icon={<Users className="w-4 h-4" />}
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
                    icon={<PackageOpen className="w-4 h-4" />}
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
                    icon={<CreditCard className="w-4 h-4" />}
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
                    icon={<Star className="w-4 h-4" />}
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
                    icon={<AlertCircle className="w-4 h-4" />}
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
