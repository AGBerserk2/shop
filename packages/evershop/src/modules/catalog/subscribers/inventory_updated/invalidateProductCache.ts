import { invalidateTags } from '../../../../lib/cache/index.js';
import { EventData } from '../../../../types/event.js';

// Stock changes affect the in/out-of-stock state shown for a product —
// drop its cached data.
export default function invalidateProductCache(
  data: EventData<'inventory_updated'>
) {
  const productId =
    data.new?.product_inventory_product_id ??
    data.old?.product_inventory_product_id;
  if (productId) {
    invalidateTags([`product:${productId}`]);
  }
}
