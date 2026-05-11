import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import { AlertTriangle, PackageCheck, PackageX } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';

const QUERY = `
  query InventoryHealth($threshold: Int, $limit: Int) {
    inventoryHealth(threshold: $threshold, limit: $limit) {
      outOfStockTotal
      lowStockTotal
      threshold
      outOfStock {
        productId
        uuid
        name
        sku
        qty
        imageUrl
        editUrl
      }
      lowStock {
        productId
        uuid
        name
        sku
        qty
        imageUrl
        editUrl
      }
    }
  }
`;

function ProductRow({
  item,
  tone
}: {
  item: {
    name: string | null;
    sku: string | null;
    qty: number;
    imageUrl: string | null;
    editUrl: string;
  };
  tone: 'danger' | 'warning';
}) {
  const dot =
    tone === 'danger' ? 'bg-rose-500' : 'bg-amber-500';
  const qtyClass =
    tone === 'danger' ? 'text-rose-700 bg-rose-50' : 'text-amber-700 bg-amber-50';
  return (
    <a
      href={item.editUrl}
      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-muted/60 transition-colors"
    >
      <div className="relative shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name || ''}
            className="w-10 h-10 rounded-md object-cover ring-1 ring-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-lg">
            📦
          </div>
        )}
        <span
          className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${dot} ring-2 ring-background`}
          aria-hidden
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.name || 'Sin nombre'}</div>
        {item.sku && (
          <div className="text-xs text-muted-foreground truncate">SKU · {item.sku}</div>
        )}
      </div>
      <div className={`text-xs font-bold tabular-nums px-2 py-1 rounded-md ${qtyClass}`}>
        {item.qty} unid.
      </div>
    </a>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="w-10 h-10 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/5 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function InventoryHealth() {
  const [result] = useQuery({
    query: QUERY,
    variables: { threshold: 5, limit: 8 }
  });
  const { data, fetching, error } = result;
  const health = data?.inventoryHealth;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Estado del inventario</CardTitle>
          <CardDescription>
            Productos sin stock y con inventario bajo (≤ {health?.threshold ?? 5} unidades)
          </CardDescription>
        </div>
        <a
          href="/admin/products"
          className="text-xs font-semibold text-primary hover:underline shrink-0"
        >
          Ver todos →
        </a>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="text-sm text-destructive">{error.message}</div>}

        {/* Out of stock */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-50 ring-1 ring-rose-200 flex items-center justify-center">
                <PackageX className="w-4 h-4 text-rose-600" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Sin stock</h4>
            </div>
            {health && (
              <span className="text-xs font-bold tabular-nums text-rose-700">
                {health.outOfStockTotal} {health.outOfStockTotal === 1 ? 'producto' : 'productos'}
              </span>
            )}
          </div>
          {fetching ? (
            <SectionSkeleton />
          ) : !health || health.outOfStock.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              Todo en stock. Ningún producto agotado.
            </div>
          ) : (
            <div className="space-y-0.5">
              {health.outOfStock.map((p: any) => (
                <ProductRow key={p.productId} item={p} tone="danger" />
              ))}
              {health.outOfStockTotal > health.outOfStock.length && (
                <a
                  href="/admin/products"
                  className="block text-center text-xs font-semibold text-rose-700 hover:underline pt-2"
                >
                  + {health.outOfStockTotal - health.outOfStock.length} más sin stock
                </a>
              )}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Inventario bajo</h4>
            </div>
            {health && (
              <span className="text-xs font-bold tabular-nums text-amber-700">
                {health.lowStockTotal} {health.lowStockTotal === 1 ? 'producto' : 'productos'}
              </span>
            )}
          </div>
          {fetching ? (
            <SectionSkeleton />
          ) : !health || health.lowStock.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4">
              Sin productos por debajo del umbral ({health?.threshold ?? 5} unidades).
            </div>
          ) : (
            <div className="space-y-0.5">
              {health.lowStock.map((p: any) => (
                <ProductRow key={p.productId} item={p} tone="warning" />
              ))}
              {health.lowStockTotal > health.lowStock.length && (
                <a
                  href="/admin/products"
                  className="block text-center text-xs font-semibold text-amber-700 hover:underline pt-2"
                >
                  + {health.lowStockTotal - health.lowStock.length} más con stock bajo
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'rightSide',
  sortOrder: 5
};
