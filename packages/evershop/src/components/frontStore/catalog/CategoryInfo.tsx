import Area from '@components/common/Area.js';
import { Editor } from '@components/common/Editor.js';
import { Image } from '@components/common/Image.js';
import { useCategory } from '@components/frontStore/catalog/CategoryContext.js';
import React from 'react';

export function CategoryInfo() {
  const { name, description, image } = useCategory();

  // Detect whether the description has any meaningful content beyond the
  // empty Editor scaffolding so we don't render an empty box.
  const hasDescription = (() => {
    try {
      if (!description) return false;
      const json =
        typeof description === 'string' ? JSON.parse(description) : description;
      if (!Array.isArray(json) || json.length === 0) return false;
      const firstRow = json[0];
      const firstColData = firstRow?.columns?.[0]?.data;
      const blocks = firstColData?.blocks || [];
      return blocks.length > 0;
    } catch {
      return false;
    }
  })();

  return (
    <>
      <Area id="beforeCategoryInfo" />

      <div className="max-w-screen-2xl mx-auto px-4 mt-6 mb-8 md:mb-10 category__general">
        {image ? (
          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[21/9] md:aspect-[3/1] max-h-72 md:max-h-[28rem]">
            <Image
              className="category__image absolute inset-0 w-full h-full"
              src={image.url}
              alt={image.alt || name}
              width={1800}
              height={1029}
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                width: '100%',
                height: '100%'
              }}
              priority={true}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/40 to-black/10 pointer-events-none"
            />
            <div className="absolute inset-0 flex items-end">
              <div className="px-6 md:px-12 py-6 md:py-10 max-w-3xl text-white">
                <h1 className="category__name text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-lg">
                  {name}
                </h1>
                {hasDescription && (
                  <div className="category__description prose prose-invert prose-sm md:prose-base mt-3 text-white/95 max-w-2xl drop-shadow [&_*]:!text-white/95">
                    <Editor rows={description} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 ring-1 ring-rose-100 shadow-sm px-6 md:px-12 py-10 md:py-16">
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-rose-200/40 blur-3xl pointer-events-none"
            />
            <div className="relative">
              <h1 className="category__name text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
                {name}
              </h1>
              {hasDescription && (
                <div className="category__description prose prose-base mt-4 text-gray-600 max-w-2xl">
                  <Editor rows={description} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Area id="afterCategoryInfo" />
    </>
  );
}
