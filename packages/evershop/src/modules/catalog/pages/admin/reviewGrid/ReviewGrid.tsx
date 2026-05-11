import { Badge } from '@components/common/ui/Badge.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Card,
  CardContent,
  CardHeader
} from '@components/common/ui/Card.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@components/common/ui/Table.js';
import axios from 'axios';
import { Check, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface ReviewRow {
  reviewId: number;
  uuid: string;
  rating: number;
  title: string | null;
  comment: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approveUrl: string;
  rejectUrl: string;
  deleteUrl: string;
  product?: { name: string; sku: string; uuid: string } | null;
}

interface Props {
  reviews: { items: ReviewRow[]; total: number };
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge>Aprobada</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rechazada</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
}

function StarsInline({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`w-4 h-4 ${i <= n ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
        >
          <path d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.27 6.3 20.16l1.1-6.35-4.63-4.5 6.38-.93L12 2.6z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewGrid({ reviews }: Props) {
  const items = reviews?.items || [];
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  const doAction = async (url: string, method: 'POST' | 'DELETE', uuid: string, successMsg: string) => {
    setBusyId(uuid);
    try {
      const res = await axios.request({ method, url, validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) {
        toast.success(successMsg);
        refresh();
      } else {
        toast.error(res.data?.error?.message || 'No se pudo completar la acción');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error de conexión');
    } finally {
      setBusyId(null);
    }
  };

  // Status filter via URL query
  const [filter, setFilter] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    const params = new URLSearchParams(window.location.search);
    return params.get('status') || 'all';
  });
  const onFilter = (val: string) => {
    setFilter(val);
    const url = new URL(window.location.href);
    if (val === 'all') url.searchParams.delete('status');
    else url.searchParams.set('status', val);
    window.location.href = url.toString();
  };

  const filtered = filter === 'all' ? items : items.filter((r) => r.status === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                filter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70 text-foreground'
              }`}
            >
              {s === 'all' ? 'Todas' : s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobadas' : 'Rechazadas'}
              {' '}
              <span className="opacity-60">({s === 'all' ? items.length : items.filter((r) => r.status === s).length})</span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {filter === 'pending'
              ? 'No hay reseñas pendientes — ¡al día!'
              : 'No hay reseñas para mostrar.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Reseña</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.reviewId}>
                  <TableCell className="max-w-44">
                    <div className="font-medium text-sm">
                      {r.product?.name || `Producto ${r.reviewId}`}
                    </div>
                    {r.product?.sku && (
                      <div className="text-xs text-muted-foreground">SKU · {r.product.sku}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StarsInline n={r.rating} />
                  </TableCell>
                  <TableCell className="max-w-md">
                    {r.title && <div className="font-semibold text-sm">{r.title}</div>}
                    {r.comment && (
                      <div className="text-sm text-muted-foreground line-clamp-3 max-w-md">
                        {r.comment}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{r.customerName || 'Anónimo'}</div>
                    {r.customerEmail && (
                      <div className="text-xs text-muted-foreground">{r.customerEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(r.createdAt).toLocaleDateString('es-DO')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {r.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.uuid}
                          onClick={() => doAction(r.approveUrl, 'POST', r.uuid, 'Reseña aprobada')}
                          title="Aprobar"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {r.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === r.uuid}
                          onClick={() => doAction(r.rejectUrl, 'POST', r.uuid, 'Reseña rechazada')}
                          title="Rechazar"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === r.uuid}
                        onClick={() => {
                          if (confirm('¿Eliminar esta reseña? No se puede deshacer.')) {
                            doAction(r.deleteUrl, 'DELETE', r.uuid, 'Reseña eliminada');
                          }
                        }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    reviews(filters: [{ key: "limit", operation: eq, value: "100" }]) {
      items {
        reviewId
        uuid
        rating
        title
        comment
        customerName
        customerEmail
        status
        createdAt
        approveUrl
        rejectUrl
        deleteUrl
        product {
          name
          sku
          uuid
        }
      }
      total
    }
  }
`;
