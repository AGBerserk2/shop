import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import { Layers } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import { useDateRange } from './DateRange.js';

const QUERY = `
  query RevenueByCategory($from: String, $to: String) {
    revenueByCategory(from: $from, to: $to, limit: 10) {
      totalRevenueText
      uncategorizedRevenue
      categories {
        categoryId
        name
        revenue
        revenueText
        unitsSold
        orderCount
        pct
      }
    }
  }
`;

// Stable color rotation so the same category keeps the same color.
const PALETTE = [
  '#E11D48', // rose-600
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#8B5CF6', // violet-500
  '#0EA5E9', // sky-500
  '#F97316', // orange-500
  '#14B8A6', // teal-500
  '#A855F7', // purple-500
  '#22C55E', // green-500
  '#EAB308'  // yellow-500
];

export default function RevenueByCategory() {
  const { range } = useDateRange();
  const [result] = useQuery({
    query: QUERY,
    variables: { from: range.from, to: range.to }
  });
  const { data, fetching, error } = result;
  const report = data?.revenueByCategory;
  const categories = report?.categories || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por categoría</CardTitle>
        <CardDescription>
          {range.label} · top categorías por ingresos generados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-destructive">{error.message}</div>}

        {fetching && !report ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded" />
            ))}
          </div>
        ) : !report || categories.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Sin ventas en este período.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((c: any, i: number) => {
              const color = PALETTE[i % PALETTE.length];
              return (
                <div key={c.categoryId || `n-${i}`} className="group">
                  <div className="flex items-baseline justify-between mb-1 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="text-sm font-medium truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {c.orderCount} {c.orderCount === 1 ? 'pedido' : 'pedidos'} · {c.unitsSold} unid.
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold tabular-nums">{c.revenueText}</span>
                      <span className="text-xs text-muted-foreground tabular-nums ml-2">
                        {c.pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, c.pct).toFixed(2)}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-xs">
              <span className="text-muted-foreground uppercase tracking-widest">Total del período</span>
              <span className="font-bold tabular-nums">{report.totalRevenueText}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 7
};
