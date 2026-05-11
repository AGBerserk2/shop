import React, { useState } from 'react';

interface RatingFilterProps {
  selected?: number | null;
}

// Tiny sidebar filter: "Calificación mínima". Reloads page with ?min_rating=N.
// Lives outside the dynamic attribute-driven filter rail because rating isn't
// an attribute — it's an aggregate. Keeping it standalone keeps both code
// paths simple.
export function RatingFilter({ selected = null }: RatingFilterProps) {
  const [current, setCurrent] = useState<number | null>(() => {
    if (typeof window === 'undefined') return selected ?? null;
    const p = new URLSearchParams(window.location.search).get('min_rating');
    return p ? Number(p) : (selected ?? null);
  });

  const apply = (n: number | null) => {
    setCurrent(n);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (n === null) url.searchParams.delete('min_rating');
    else url.searchParams.set('min_rating', String(n));
    window.location.href = url.toString();
  };

  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <h4 className="text-sm font-bold text-gray-900 mb-3">Calificación</h4>
      <div className="space-y-1.5">
        {[5, 4, 3, 2].map((n) => {
          const active = current === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => apply(active ? null : n)}
              className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md transition-colors text-sm ${
                active ? 'bg-rose-50 text-rose-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className={`w-3.5 h-3.5 ${i <= n ? 'text-amber-400' : 'text-gray-200'}`}
                    fill="currentColor"
                  >
                    <path d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.27 6.3 20.16l1.1-6.35-4.63-4.5 6.38-.93L12 2.6z" />
                  </svg>
                ))}
              </span>
              <span>y más</span>
            </button>
          );
        })}
      </div>
      {current !== null && (
        <button
          type="button"
          onClick={() => apply(null)}
          className="mt-2 text-xs text-gray-500 underline hover:text-gray-700"
        >
          Quitar filtro
        </button>
      )}
    </div>
  );
}
