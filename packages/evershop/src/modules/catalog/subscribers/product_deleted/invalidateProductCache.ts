import { invalidateTags } from '../../../../lib/cache/index.js';
import { EventData } from '../../../../types/event.js';

// Drop the cached data for a product as soon as it changes, so the
// storefront reflects admin edits instantly.
export default function invalidateProductCache(
  data: EventData<'product_deleted'>
) {
  invalidateTags([`product:${data.product_id}`]);
}
