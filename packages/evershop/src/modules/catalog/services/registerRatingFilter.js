import uniqid from 'uniqid';

// Adds a `min_rating` filter that limits the product collection to items
// whose average approved rating meets or exceeds the threshold. Used by the
// category sidebar and by direct URL params (?min_rating=4).
export default function registerRatingFilter(filters) {
  return [
    ...filters,
    {
      key: 'min_rating',
      operation: ['eq', 'gteq'],
      callback: (query, operation, value, currentFilters) => {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 1 || n > 5) return;
        const alias = `rating_filter_${uniqid()}`;
        query.leftJoin(
          `(SELECT product_id, AVG(rating)::numeric AS avg_rating
            FROM product_review
            WHERE status = 'approved'
            GROUP BY product_id)`,
          alias,
          `${alias}.product_id = product.product_id`
        );
        query.getWhere().addRaw('AND', `${alias}.avg_rating >= ${n}`, {});
        currentFilters.push({ key: 'min_rating', operation, value: String(n) });
      }
    }
  ];
}
