import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Clock } from 'lucide-react';

interface ProductItem {
  productId: number;
  name: string;
  url?: string | null;
  price?: { regular: { text: string; value: number }; special?: { text: string; value: number } };
  image?: { url: string; alt?: string };
}

interface Props {
  dealsProducts: { items: ProductItem[] };
}

function Countdown() {
  const [tick, setTick] = useState(8 * 3600);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(tick / 3600)).padStart(2, '0');
  const m = String(Math.floor((tick % 3600) / 60)).padStart(2, '0');
  const s = String(tick % 60).padStart(2, '0');
  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <Clock className="w-4 h-4" />
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{h}</span>:
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{m}</span>:
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{s}</span>
    </div>
  );
}

export default function DealsRail({ dealsProducts }: Props) {
  // Only products with a real special price count as an "offer". If nothing
  // is on sale, the whole section is hidden — no fake "OFERTA" badges.
  const items = (dealsProducts?.items || []).filter(
    (p) =>
      p.price?.special?.value != null &&
      p.price?.regular?.value != null &&
      p.price.special.value < p.price.regular.value
  );
  const railRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <section className="w-full">
      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 shadow-lg">
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 animate-pulse" />
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold">
                  Ofertas relámpago
                </h2>
                <p className="text-xs opacity-90">Termina en:</p>
              </div>
              <Countdown />
            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scroll('left')}
                aria-label="Anterior"
                className="bg-white/20 hover:bg-white/40 p-1.5 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Siguiente"
                className="bg-white/20 hover:bg-white/40 p-1.5 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white p-4">
            <div
              ref={railRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
            >
              {items.map((p) => (
                <a
                  key={p.productId}
                  href={p.url || '#'}
                  className="group shrink-0 w-44 md:w-52 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-rose-200 transition-all overflow-hidden"
                >
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {p.image?.url ? (
                      <img
                        src={p.image.url}
                        alt={p.image.alt || p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                        📦
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-xs font-extrabold px-2 py-0.5 rounded">
                      OFERTA
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <h3 className="text-xs font-medium text-gray-900 line-clamp-2 min-h-8">
                      {p.name}
                    </h3>
                    <div className="text-base font-extrabold text-rose-600">
                      {p.price?.special?.text || p.price?.regular?.text}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 40
};

export const query = `
  query Query {
    dealsProducts: products {
      items {
        productId
        name
        url
        price {
          regular { text value }
          special { text value }
        }
        image { url alt }
      }
    }
  }
`;
