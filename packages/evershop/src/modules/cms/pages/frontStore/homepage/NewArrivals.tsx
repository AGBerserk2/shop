import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { StarRating } from '@components/frontStore/catalog/StarRating.js';

interface ProductItem {
  productId: number;
  name: string;
  url?: string | null;
  price?: { regular: { text: string; value: number }; special?: { text: string; value: number } };
  image?: { url: string; alt?: string };
  averageRating?: number;
  reviewCount?: number;
}

interface Props {
  newProducts: { items: ProductItem[] };
}

export default function NewArrivals({ newProducts }: Props) {
  const items = newProducts?.items || [];
  const railRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <section className="w-full bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-500" />
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Recién llegados
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Lo último que sumamos al catálogo
              </p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              aria-label="Anterior"
              className="border border-gray-300 hover:border-violet-400 p-2 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Siguiente"
              className="border border-gray-300 hover:border-violet-400 p-2 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
        >
          {items.map((p) => (
            <a
              key={p.productId}
              href={p.url || '#'}
              className="group shrink-0 w-52 md:w-56 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-violet-200 transition-all overflow-hidden"
            >
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {p.image?.url ? (
                  <img
                    src={p.image.url}
                    alt={p.image.alt || p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
                    ✨
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs font-bold px-2 py-1 rounded">
                  NUEVO
                </div>
              </div>
              <div className="p-3 space-y-1">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-10">
                  {p.name}
                </h3>
                <StarRating
                  rating={p.averageRating || 0}
                  count={p.reviewCount || 0}
                  size="xs"
                />
                <div className="text-base font-bold text-gray-900">
                  {p.price?.special?.text || p.price?.regular?.text}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 60
};

export const query = `
  query Query {
    newProducts: products {
      items {
        productId
        name
        url
        price {
          regular { text value }
          special { text value }
        }
        image { url alt }
        averageRating
        reviewCount
      }
    }
  }
`;
