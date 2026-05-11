import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import { Activity, ShoppingCart, Star, UserPlus } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';

const QUERY = `
  query ActivityFeed($limit: Int) {
    activityFeed(limit: $limit) {
      items {
        id
        type
        timestamp
        title
        subtitle
        href
        amount
      }
    }
  }
`;

function timeAgo(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - then) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `hace ${Math.round(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.round(diff / 3600)} h`;
    return `hace ${Math.round(diff / 86400)} d`;
  } catch {
    return iso;
  }
}

const ICON_FOR: Record<
  string,
  { Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; tone: string }
> = {
  order: { Icon: ShoppingCart, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  customer: { Icon: UserPlus, tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  review: { Icon: Star, tone: 'bg-amber-50 text-amber-700 ring-amber-200' }
};

export default function ActivityFeed() {
  const [result] = useQuery({
    query: QUERY,
    variables: { limit: 15 },
    requestPolicy: 'cache-and-network'
  });
  const { data, fetching, error } = result;
  const items = data?.activityFeed?.items || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
        <CardDescription>
          Últimos pedidos, clientes y reseñas en tu tienda
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-destructive">{error.message}</div>}

        {fetching && items.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Aún no hay actividad para mostrar.
          </div>
        ) : (
          <ol className="space-y-0">
            {items.map((item: any) => {
              const meta = ICON_FOR[item.type] || ICON_FOR.order;
              const Icon = meta.Icon;
              return (
                <li key={item.id} className="relative pl-9 pb-4 last:pb-0 group">
                  {/* Connector line */}
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-border group-last:hidden"
                    aria-hidden
                  />
                  {/* Icon bubble */}
                  <a
                    href={item.href}
                    className="absolute left-0 top-0 w-8 h-8 rounded-full ring-1 flex items-center justify-center transition-transform hover:scale-110"
                    style={undefined}
                  >
                    <span className={`w-full h-full rounded-full flex items-center justify-center ${meta.tone}`}>
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </span>
                  </a>
                  <a
                    href={item.href}
                    className="block hover:bg-muted/40 -mx-2 px-2 py-1 rounded-md transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-sm font-medium truncate flex-1">
                        {item.title}
                      </div>
                      {item.amount && (
                        <div className="text-sm font-bold tabular-nums shrink-0">
                          {item.amount}
                        </div>
                      )}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {item.subtitle}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {timeAgo(item.timestamp)}
                    </div>
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 15
};
