import { invalidateTags } from '../../../../lib/cache/index.js';
import { EventData } from '../../../../types/event.js';

// Drop the cached data for a category as soon as it changes, so the
// storefront reflects admin edits instantly.
export default function invalidateCategoryCache(
  data: EventData<'category_deleted'>
) {
  invalidateTags([`category:${data.category_id}`]);
}
