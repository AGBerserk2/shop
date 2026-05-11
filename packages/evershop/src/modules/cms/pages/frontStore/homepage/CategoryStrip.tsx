import React from 'react';
import {
  ShoppingBag,
  Sparkles,
  Heart,
  Gem,
  Shirt,
  Watch,
  Smartphone,
  Home as HomeIcon,
  Baby,
  Dumbbell
} from 'lucide-react';

interface CategoryItem {
  name: string;
  url: string;
  image?: { url: string; alt?: string | null } | null;
}

interface CategoryStripProps {
  categories: { items: CategoryItem[] };
}

const FALLBACK_ICONS = [
  ShoppingBag,
  Sparkles,
  Heart,
  Gem,
  Shirt,
  Watch,
  Smartphone,
  HomeIcon,
  Baby,
  Dumbbell
];

export default function CategoryStrip({ categories }: CategoryStripProps) {
  const items = (categories?.items || []).filter((c) => c.url);
  if (items.length === 0) return null;

  return (
    <section className="w-full bg-white border-b">
      <div className="max-w-screen-2xl mx-auto px-4 py-2">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {items.map((cat, i) => {
            const Icon = FALLBACK_ICONS[i % FALLBACK_ICONS.length];
            const imgUrl = cat.image?.url;
            return (
              <a
                key={i}
                href={cat.url}
                className="group flex flex-col items-center min-w-20 gap-1 shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center overflow-hidden ring-1 ring-rose-100 group-hover:ring-rose-300 group-hover:scale-105 transition-all">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={cat.image?.alt || cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-7 h-7 text-rose-500" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-rose-600 line-clamp-1 max-w-20 text-center">
                  {cat.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    categories {
      items {
        name
        url
        image { url alt }
      }
    }
  }
`;
