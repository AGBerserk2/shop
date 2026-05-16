import { invalidateTags } from '../../../../lib/cache/index.js';
import { EventData } from '../../../../types/event.js';

// A new image changes how the product looks in listings and on its
// page — drop the product's cached data.
export default function invalidateProductCache(
  data: EventData<'product_image_added'>
) {
  invalidateTags([`product:${data.product_image_product_id}`]);
}
