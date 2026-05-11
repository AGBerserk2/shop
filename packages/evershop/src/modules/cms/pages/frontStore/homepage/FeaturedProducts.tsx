import React from 'react';
import { StarRating } from '@components/frontStore/catalog/StarRating.js';

interface ProductItem {
  productId: number;
  name: string;
  url?: string | null;
  sku: string;
  price?: { regular: { text: string; value: number }; special?: { text: string; value: number } };
  image?: { url: string; alt?: string };
  averageRating?: number;
  reviewCount?: number;
}

interface Props {
  featuredProducts: { items: ProductItem[]; total: number };
}

export default function FeaturedProducts({ featuredProducts }: Props) {
  const items = featuredProducts?.items || [];
  if (items.length === 0) return null;

  return (
    <section className="w-full bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Destacados para ti
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Selección curada de nuestros productos más populares
            </p>
          </div>
          <a
            href="/esmalte"
            className="hidden md:inline-flex text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            Ver todos →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((p) => {
            const hasSale = !!p.price?.special;
            const regular = p.price?.regular?.text;
            const special = p.price?.special?.text;
            const discount =
              hasSale && p.price?.regular?.value && p.price?.special?.value
                ? Math.round(
                    ((p.price.regular.value - p.price.special.value) /
                      p.price.regular.value) *
                      100
                  )
                : 0;

            return (
              <a
                key={p.productId}
                href={p.url || '#'}
                className="group bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-rose-200 transition-all overflow-hidden"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {p.image?.url ? (
                    <img
                      src={p.image.url}
                      alt={p.image.alt || p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
                      📦
                    </div>
                  )}
                  {hasSale && discount > 0 && (
                    <div className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
                      -{discount}%
                    </div>
                  )}
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
                  <div className="flex items-baseline gap-2 pt-1">
                    {hasSale ? (
                      <>
                        <span className="text-base font-bold text-rose-600">
                          {special}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {regular}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-gray-900">
                        {regular}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-6 text-center md:hidden">
          <a
            href="/esmalte"
            className="inline-block text-sm font-semibold text-rose-600"
          >
            Ver todos los productos →
          </a>
        </div>
      </div>
    </section>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 30
};

export const query = `
  query Query {
    featuredProducts: products {
      items {
        productId
        name
        url
        sku
        price {
          regular { text value }
          special { text value }
        }
        image { url alt }
        averageRating
        reviewCount
      }
      total
    }
  }
`;
