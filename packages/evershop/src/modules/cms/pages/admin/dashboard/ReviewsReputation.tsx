import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import { Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';
import { useDateRange } from './DateRange.js';

const QUERY = `
  query ReviewsReputation($from: String, $to: String) {
    reviewsReputation(from: $from, to: $to, limit: 5) {
      averageRating
      totalReviews
      totalApproved
      totalPending
      ratingDistribution
      reviewsInPeriod
      ordersInPeriod
      reviewRate
      topProducts {
        productId
        uuid
        name
        sku
        averageRating
        reviewCount
        imageUrl
        editUrl
      }
      worstProducts {
        productId
        uuid
        name
        sku
        averageRating
        reviewCount
        imageUrl
        editUrl
      }
    }
  }
`;

function StarBig({ filled }: { filled: number }) {
  // filled: 0..1 — partial fill via clip-path
  const clip = `inset(0 ${(1 - filled) * 100}% 0 0)`;
  return (
    <span className="relative inline-block w-5 h-5">
      <svg viewBox="0 0 24 24" className="absolute inset-0 w-5 h-5 text-gray-200" fill="currentColor">
        <path d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.27 6.3 20.16l1.1-6.35-4.63-4.5 6.38-.93L12 2.6z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 w-5 h-5 text-amber-400"
        fill="currentColor"
        style={{ clipPath: clip, WebkitClipPath: clip }}
      >
        <path d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.27 6.3 20.16l1.1-6.35-4.63-4.5 6.38-.93L12 2.6z" />
      </svg>
    </span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return <StarBig key={i} filled={fill} />;
      })}
    </div>
  );
}

function ProductRow({
  p,
  tone
}: {
  p: any;
  tone: 'good' | 'bad';
}) {
  const dotColor = tone === 'good' ? 'bg-emerald-500' : 'bg-rose-500';
  return (
    <a
      href={p.editUrl}
      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-muted/60 transition-colors"
    >
      <div className="relative shrink-0">
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt={p.name || ''}
            className="w-10 h-10 rounded-md object-cover ring-1 ring-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-lg">
            📦
          </div>
        )}
        <span
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${dotColor} ring-2 ring-background`}
          aria-hidden
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{p.name || 'Sin nombre'}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRow rating={p.averageRating} />
          <span className="text-xs text-muted-foreground tabular-nums">
            {p.averageRating.toFixed(1)} · {p.reviewCount} {p.reviewCount === 1 ? 'reseña' : 'reseñas'}
          </span>
        </div>
      </div>
    </a>
  );
}

export default function ReviewsReputation() {
  const { range } = useDateRange();
  const [result] = useQuery({
    query: QUERY,
    variables: { from: range.from, to: range.to }
  });
  const { data, fetching, error } = result;
  const r = data?.reviewsReputation;

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-sm text-destructive">{error.message}</div>
        </CardContent>
      </Card>
    );
  }

  const totalDistribution = (r?.ratingDistribution || []).reduce(
    (s: number, n: number) => s + Number(n),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reputación y reseñas</CardTitle>
        <CardDescription>
          {range.label} · cómo perciben tus clientes la tienda
        </CardDescription>
      </CardHeader>
      <CardContent>
        {fetching && !r ? (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded" />
            <Skeleton className="h-32 rounded" />
          </div>
        ) : !r || r.totalReviews === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Aún no hay reseñas aprobadas.
            <div className="text-xs mt-1">
              Cuando tus clientes empiecen a calificar, esta sección se llenará.
            </div>
          </div>
        ) : (
          <>
            {/* Top KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center mb-6">
              <div className="text-center">
                <div className="text-5xl font-extrabold tabular-nums text-amber-500">
                  {r.averageRating.toFixed(1)}
                </div>
                <div className="mt-1 flex justify-center">
                  <StarRow rating={r.averageRating} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {r.totalApproved} {r.totalApproved === 1 ? 'reseña aprobada' : 'reseñas aprobadas'}
                </div>
              </div>

              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const c = r.ratingDistribution[star - 1] || 0;
                  const pct = totalDistribution > 0 ? (c / totalDistribution) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-muted-foreground tabular-nums">{star} ★</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct.toFixed(1)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right tabular-nums text-muted-foreground">{c}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Period stats */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  En este período
                </div>
                <div className="text-lg font-bold tabular-nums">{r.reviewsInPeriod}</div>
                <div className="text-[10px] text-muted-foreground">nuevas reseñas</div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Tasa de reseña
                </div>
                <div className="text-lg font-bold tabular-nums text-emerald-600">
                  {r.reviewRate.toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground">de pedidos reseñados</div>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Por moderar
                </div>
                <div className="text-lg font-bold tabular-nums text-amber-600">
                  {r.totalPending}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  <a href="/admin/reviews?status=pending" className="hover:underline">
                    Ir a moderación →
                  </a>
                </div>
              </div>
            </div>

            {/* Best / worst rated */}
            {r.topProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <h4 className="text-sm font-bold">Mejor calificados</h4>
                  </div>
                  <div className="space-y-0.5">
                    {r.topProducts.map((p: any) => (
                      <ProductRow key={p.productId} p={p} tone="good" />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <h4 className="text-sm font-bold">Para mejorar</h4>
                  </div>
                  <div className="space-y-0.5">
                    {r.worstProducts.map((p: any) => (
                      <ProductRow key={`w-${p.productId}`} p={p} tone="bad" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 9
};
