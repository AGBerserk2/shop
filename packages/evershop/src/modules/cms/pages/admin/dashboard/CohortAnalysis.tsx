import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import { Users } from 'lucide-react';
import React from 'react';
import { useQuery } from 'urql';

const QUERY = `
  query CustomerCohorts($months: Int) {
    customerCohorts(months: $months) {
      months
      cohorts {
        month
        newCustomers
        retention {
          monthOffset
          count
          pct
        }
      }
    }
  }
`;

function MONTH_LABEL(iso: string): string {
  // iso = 'YYYY-MM'; render as 'May 2026' (es-DO).
  const [y, m] = iso.split('-');
  if (!y || !m) return iso;
  try {
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' });
  } catch {
    return iso;
  }
}

// Map retention % to a heatmap color.
function cellStyle(pct: number) {
  if (pct == null || pct <= 0) {
    return { background: '#F3F4F6', color: '#9CA3AF' }; // gray
  }
  // Lerp from rose-100 to rose-700 across 0..100.
  const t = Math.max(0, Math.min(1, pct / 100));
  // Hand-picked stops for nicer color progression.
  const stops = [
    { p: 0, bg: '#FFE4E6', fg: '#9F1239' },
    { p: 0.25, bg: '#FECDD3', fg: '#9F1239' },
    { p: 0.5, bg: '#FB7185', fg: '#FFFFFF' },
    { p: 0.75, bg: '#E11D48', fg: '#FFFFFF' },
    { p: 1, bg: '#9F1239', fg: '#FFFFFF' }
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].p && t <= stops[i + 1].p) {
      return { background: stops[i + 1].bg, color: stops[i + 1].fg };
    }
  }
  return { background: stops[stops.length - 1].bg, color: stops[stops.length - 1].fg };
}

export default function CohortAnalysis() {
  const [result] = useQuery({
    query: QUERY,
    variables: { months: 6 }
  });
  const { data, fetching, error } = result;
  const report = data?.customerCohorts;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohortes de retención</CardTitle>
        <CardDescription>
          Clientes nuevos por mes y qué porcentaje vuelve a comprar en los meses siguientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-destructive">{error.message}</div>}

        {fetching && !report ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : !report || report.cohorts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Aún no hay cohortes de clientes.
            <div className="text-xs mt-1">
              Necesitas al menos un cliente con pedido completado para empezar.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left font-medium px-2 py-1.5 sticky left-0 bg-card">
                    Cohorte
                  </th>
                  <th className="text-right font-medium px-2 py-1.5">Nuevos</th>
                  {Array.from({ length: report.months }).map((_, i) => (
                    <th
                      key={i}
                      className="text-center font-medium px-2 py-1.5 min-w-16"
                    >
                      M{i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.cohorts.map((c: any) => (
                  <tr key={c.month}>
                    <td className="font-medium px-2 py-1.5 sticky left-0 bg-card whitespace-nowrap">
                      {MONTH_LABEL(c.month)}
                    </td>
                    <td className="text-right font-bold tabular-nums px-2 py-1.5">
                      {c.newCustomers}
                    </td>
                    {c.retention.map((r: any) => (
                      <td key={r.monthOffset} className="p-0.5">
                        <div
                          className="rounded-md text-center px-2 py-1.5 text-xs font-semibold tabular-nums"
                          style={cellStyle(r.pct)}
                          title={`${r.count} clientes (${r.pct.toFixed(0)}%)`}
                        >
                          {r.count > 0 ? `${r.pct.toFixed(0)}%` : '—'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Menos retención</span>
              <div className="flex h-2 flex-1 max-w-32 rounded-full overflow-hidden">
                {['#FFE4E6', '#FECDD3', '#FB7185', '#E11D48', '#9F1239'].map((c) => (
                  <div key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <span>Más retención</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 11
};
