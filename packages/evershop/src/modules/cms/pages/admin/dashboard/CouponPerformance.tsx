import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@components/common/ui/Table.js';
import { Gift, Percent, Truck } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import { useDateRange } from './DateRange.js';

const QUERY = `
  query CouponPerformance($from: String, $to: String) {
    couponPerformance(from: $from, to: $to) {
      totalCoupons
      totalRedemptions
      totalDiscount
      totalDiscountText
      coupons {
        code
        description
        status
        discountType
        discountAmount
        redemptions
        totalDiscount
        totalDiscountText
        revenue
        revenueText
        freeShipping
      }
    }
  }
`;

function DiscountBadge({
  type,
  amount,
  freeShipping
}: {
  type: string;
  amount: number | null;
  freeShipping: boolean;
}) {
  if (freeShipping) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-sky-50 text-sky-700">
        <Truck className="w-3 h-3" />
        Envío gratis
      </span>
    );
  }
  const isPct = /percent|%/i.test(type) || type === 'percentage';
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
      <Percent className="w-3 h-3" />
      {amount != null
        ? isPct
          ? `${amount}%`
          : `${amount.toFixed(0)}`
        : type}
    </span>
  );
}

export default function CouponPerformance() {
  const { range } = useDateRange();
  const [result] = useQuery({
    query: QUERY,
    variables: { from: range.from, to: range.to }
  });
  const { data, fetching, error } = result;
  const report = data?.couponPerformance;
  const coupons = report?.coupons || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento de cupones</CardTitle>
        <CardDescription>
          {range.label} · cupones redimidos y su contribución a ventas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-destructive">{error.message}</div>}

        {fetching && !report ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded" />
            ))}
          </div>
        ) : !report || coupons.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Gift className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Ningún cupón se usó en este período.
            <div className="text-xs mt-1">
              Crea cupones desde Promociones para empezar a medir.
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Cupones activos
                </div>
                <div className="text-lg font-bold tabular-nums">{report.totalCoupons}</div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Redenciones
                </div>
                <div className="text-lg font-bold tabular-nums">{report.totalRedemptions}</div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Descuento total
                </div>
                <div className="text-lg font-bold tabular-nums text-rose-600">
                  {report.totalDiscountText}
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Usos</TableHead>
                  <TableHead className="text-right">Descuento</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c: any) => (
                  <TableRow key={c.code}>
                    <TableCell>
                      <div className="font-mono font-bold text-sm">{c.code}</div>
                      {c.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {c.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DiscountBadge
                        type={c.discountType}
                        amount={c.discountAmount}
                        freeShipping={c.freeShipping}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {c.redemptions}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-rose-600">
                      {c.totalDiscountText}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold">
                      {c.revenueText}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 8
};
