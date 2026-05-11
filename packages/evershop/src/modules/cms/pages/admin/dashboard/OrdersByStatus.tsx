import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import { Clock, PackageCheck } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useDateRange } from './DateRange.js';

const QUERY = `
  query OrdersByStatus($from: String, $to: String) {
    ordersByStatus(from: $from, to: $to) {
      total
      averageDaysToFulfill
      averageDaysToComplete
      buckets {
        status
        count
        pct
        avgAgeHours
      }
    }
  }
`;

// Spanish labels + tones for each known order status.
const STATUS_META: Record<string, { label: string; color: string; tone: string }> = {
  new: { label: 'Nuevo', color: '#0EA5E9', tone: 'text-sky-700 bg-sky-50' },
  pending: { label: 'Pendiente', color: '#F59E0B', tone: 'text-amber-700 bg-amber-50' },
  processing: { label: 'Procesando', color: '#8B5CF6', tone: 'text-violet-700 bg-violet-50' },
  completed: { label: 'Completado', color: '#10B981', tone: 'text-emerald-700 bg-emerald-50' },
  closed: { label: 'Cerrado', color: '#6B7280', tone: 'text-gray-700 bg-gray-100' },
  canceled: { label: 'Cancelado', color: '#EF4444', tone: 'text-rose-700 bg-rose-50' },
  cancelled: { label: 'Cancelado', color: '#EF4444', tone: 'text-rose-700 bg-rose-50' },
  unknown: { label: 'Sin estado', color: '#9CA3AF', tone: 'text-gray-600 bg-gray-50' }
};

function metaFor(status: string) {
  return (
    STATUS_META[status] || {
      label: status,
      color: '#A1A1AA',
      tone: 'text-gray-700 bg-gray-100'
    }
  );
}

function formatHours(h: number | null | undefined): string {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

function formatDays(d: number | null | undefined): string {
  if (d == null) return '—';
  if (d < 1 / 24) return '< 1h';
  if (d < 1) return `${(d * 24).toFixed(1)} h`;
  return `${d.toFixed(1)} días`;
}

export default function OrdersByStatus() {
  const { range } = useDateRange();
  const [result] = useQuery({
    query: QUERY,
    variables: { from: range.from, to: range.to }
  });
  const { data, fetching, error } = result;
  const report = data?.ordersByStatus;
  const total = report?.total ?? 0;

  const chartData =
    report?.buckets.map((b: any) => ({
      name: metaFor(b.status).label,
      value: b.count,
      color: metaFor(b.status).color
    })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos por estado</CardTitle>
        <CardDescription>
          {range.label} · distribución de pedidos y tiempos operativos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-destructive mb-4">{error.message}</div>}

        {fetching && !report ? (
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <Skeleton className="aspect-square rounded-full" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          </div>
        ) : total === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Sin pedidos en este período.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center">
              {/* Donut chart */}
              <div className="relative">
                <div className="aspect-square max-w-[200px] mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius="60%"
                        outerRadius="100%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((d: any) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => [`${v} pedidos`, '']}
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-extrabold tabular-nums">{total}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">
                    {total === 1 ? 'pedido' : 'pedidos'}
                  </div>
                </div>
              </div>

              {/* Bucket list */}
              <ul className="space-y-2">
                {report.buckets.map((b: any) => {
                  const m = metaFor(b.status);
                  return (
                    <li key={b.status} className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: m.color }}
                      />
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${m.tone}`}>
                        {m.label}
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${b.pct.toFixed(1)}%`,
                            background: m.color
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-10 text-right">
                        {b.count}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                        {b.pct.toFixed(0)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Timing footer */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-border">
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Promedio para enviar
                  </span>
                </div>
                <div className="text-lg font-bold tabular-nums">
                  {formatDays(report.averageDaysToFulfill)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Desde compra hasta envío
                </div>
              </div>
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Promedio para completar
                  </span>
                </div>
                <div className="text-lg font-bold tabular-nums">
                  {formatDays(report.averageDaysToComplete)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Desde compra hasta entrega
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 5
};
