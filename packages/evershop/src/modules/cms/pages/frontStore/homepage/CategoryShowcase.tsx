import React from 'react';

interface CategoryItem {
  name: string;
  url?: string | null;
  image?: { url: string; alt?: string } | null;
}

interface Props {
  showcaseCategories: { items: CategoryItem[] };
}

const GRADIENTS = [
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-600',
  'from-violet-400 to-fuchsia-600',
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-indigo-600',
  'from-yellow-400 to-rose-500'
];

export default function CategoryShowcase({ showcaseCategories }: Props) {
  const items = (showcaseCategories?.items || []).filter((c) => c.url).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="w-full bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Compra por categoría
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Encuentra exactamente lo que buscas
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((c, i) => (
            <a
              key={i}
              href={c.url!}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              {c.image?.url ? (
                <img
                  src={c.image.url}
                  alt={c.image.alt || c.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl md:text-2xl font-extrabold drop-shadow">
                  {c.name}
                </h3>
                <span className="text-sm opacity-90 group-hover:underline">
                  Comprar ahora →
                </span>
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
  sortOrder: 50
};

export const query = `
  query Query {
    showcaseCategories: categories {
      items {
        name
        url
        image { url alt }
      }
    }
  }
`;
