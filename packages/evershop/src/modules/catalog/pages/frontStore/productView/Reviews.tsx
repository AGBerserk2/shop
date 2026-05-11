import React from 'react';
import { StarRating } from '@components/frontStore/catalog/StarRating.js';
import { ReviewForm } from '@components/frontStore/catalog/ReviewForm.js';

interface ReviewItem {
  reviewId: number;
  uuid: string;
  rating: number;
  title: string | null;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: number[]; // [1★, 2★, 3★, 4★, 5★]
}

interface Props {
  currentProductReviews: {
    productId: number;
    reviewSummary: ReviewSummary;
    reviews: ReviewItem[];
    canCurrentCustomerReview: boolean;
    submitReviewUrl: string;
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return iso;
  }
}

export default function Reviews({ currentProductReviews }: Props) {
  const {
    productId,
    reviewSummary: summary,
    reviews,
    canCurrentCustomerReview,
    submitReviewUrl
  } = currentProductReviews || ({} as Props['currentProductReviews']);

  if (!summary) return null;

  const hasReviews = summary.reviewCount > 0;
  const dist = summary.ratingDistribution || [0, 0, 0, 0, 0];

  return (
    <section className="w-full bg-white border-t border-gray-200 mt-10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Reseñas</h2>
          <p className="text-sm text-gray-500 mt-1">
            Lo que dicen quienes ya compraron este producto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Summary column */}
          <div className="lg:col-span-1">
            {hasReviews ? (
              <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-200 p-6">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-5xl font-extrabold text-gray-900 tabular-nums">
                    {summary.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">/ 5</span>
                </div>
                <StarRating rating={summary.averageRating} count={summary.reviewCount} size="md" />
                <p className="text-xs text-gray-500 mt-2">
                  Basado en {summary.reviewCount}{' '}
                  {summary.reviewCount === 1 ? 'reseña' : 'reseñas'}
                </p>

                {/* Distribution bars (5 → 1) */}
                <div className="mt-6 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const c = dist[star - 1] || 0;
                    const pct = summary.reviewCount > 0 ? (c / summary.reviewCount) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-gray-600">{star}★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-500 tabular-nums">{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 ring-1 ring-rose-100 p-6 text-center">
                <div className="text-4xl mb-2">✨</div>
                <h3 className="font-bold text-gray-900 mb-1">Aún sin reseñas</h3>
                <p className="text-sm text-gray-600">
                  Sé el primero en compartir tu experiencia con este producto.
                </p>
              </div>
            )}

            {/* Review form (only when allowed) */}
            <div className="mt-6">
              <ReviewForm
                productId={productId}
                canReview={canCurrentCustomerReview}
                submitUrl={submitReviewUrl}
              />
            </div>
          </div>

          {/* Reviews list column */}
          <div className="lg:col-span-2 space-y-5">
            {hasReviews ? (
              reviews.map((r) => (
                <div
                  key={r.reviewId}
                  className="rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <StarRating rating={r.rating} count={1} showCount={false} size="sm" />
                      {r.title && (
                        <h4 className="font-bold text-gray-900 mt-1">{r.title}</h4>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 mt-1">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {r.comment}
                    </p>
                  )}
                  {r.customerName && (
                    <div className="mt-3 text-xs text-gray-500">
                      — {r.customerName}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                Las reseñas aprobadas aparecerán aquí.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export const layout = {
  areaId: 'productPageBottom',
  sortOrder: 50
};

export const query = `
  query Query {
    currentProductReviews: currentProduct {
      productId
      reviewSummary {
        averageRating
        reviewCount
        ratingDistribution
      }
      reviews(limit: 20) {
        reviewId
        uuid
        rating
        title
        comment
        customerName
        createdAt
      }
      canCurrentCustomerReview
    }
    submitReviewUrl: url(routeId: "createReview")
  }
`;
