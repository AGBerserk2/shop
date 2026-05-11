import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import { ArrowDown, ShoppingCart } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import { useDateRange } from './DateRange.js';

const QUERY = `
  query CartConversion($from: String, $to: String) {
    cartConversion(from: $from, to: $to) {
      carts
      cartsWithItems
      cartsWithCheckout
      orders
      conversionRate
      abandonmentRate
      abandonedCartTotalText
    }
  }
`;

function pct(v: number, max: number): number {
  if (!max) return 0;
  return Math.min(100, (v / max) * 100);
}

function FunnelStage({
  label,
  count,
  share,
  color,
  drop
}: {
  label: string;
  count: number;
  share: number;
  color: string;
  drop?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-widest">{label}</span>
        {drop != null && (
          <span className="inline-flex items-center gap-0.5 text-rose-600">
            <ArrowDown className="w-3 h-3" />
            -{drop.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="relative">
        <div
          className="h-9 rounded-md flex items-center justify-between px-3 text-white text-sm font-semibold tabular-nums shadow-sm"
          style={{
            width: `${Math.max(20, share)}%`,
            background: color
          }}
        >
          <span>{count.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function CartConversion() {
  const { range } = useDateRange();
  const [result] = useQuery({
    query: QUERY,
    variables: { from: range.from, to: range.to }
  });
  const { data, fetching, error } = result;
  const report = data?.cartConversion;

  const base = report?.cartsWithItems || 0;
  const order = report?.orders || 0;
  const checkout = report?.cartsWithCheckout || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo de conversión</CardTitle>
        <CardDescription>
          {range.label} · de carrito con productos a pedido completado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-destructive">{error.message}</div>}

        {fetching && !report ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded" />
            ))}
          </div>
        ) : !report || base === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Sin carritos en este período.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <FunnelStage
                label="Carrito con productos"
                count={base}
                share={pct(base, base)}
                color="#0EA5E9"
              />
              <FunnelStage
                label="Llegaron al checkout"
                count={checkout}
                share={pct(checkout, base)}
                color="#8B5CF6"
                drop={base > 0 ? ((base - checkout) / base) * 100 : 0}
              />
              <FunnelStage
                label="Pedidos completados"
                count={order}
                share={pct(order, base)}
                color="#10B981"
                drop={checkout > 0 ? ((checkout - order) / checkout) * 100 : 0}
              />
            </div>

            {/* Summary KPI row */}
            <div className="grid grid-cols-2 gap-2 mt-6 pt-5 border-t border-border">
              <div className="rounded-lg bg-emerald-50 ring-1 ring-emerald-100 p-3">
                <div className="text-[10px] uppercase tracking-widest text-emerald-700">
                  Tasa de conversión
                </div>
                <div className="text-xl font-bold tabular-nums text-emerald-700">
                  {report.conversionRate.toFixed(1)}%
                </div>
              </div>
              <div className="rounded-lg bg-rose-50 ring-1 ring-rose-100 p-3">
                <div className="text-[10px] uppercase tracking-widest text-rose-700">
                  Carritos abandonados
                </div>
                <div className="text-xl font-bold tabular-nums text-rose-700">
                  {report.abandonedCartTotalText}
                </div>
                <div className="text-[10px] text-rose-700/80 mt-0.5">
                  {report.abandonmentRate.toFixed(1)}% de los carritos
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
  areaId: 'rightSide',
  sortOrder: 10
};
