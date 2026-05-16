import { select } from '@evershop/postgres-query-builder';
import { withCache } from '../../../../../lib/cache/index.js';

export default {
  Query: {
    setting: async (root, _, { pool }) => {
      // Settings are read on every storefront page; cache the whole
      // table. Invalidated by the saveSetting endpoint.
      return withCache('settings:all', { tags: ['settings'] }, async () =>
        select().from('setting').execute(pool)
      );
    }
  },
  Setting: {
    storeName: (setting) => {
      const storeName = setting.find((s) => s.name === 'storeName');
      if (storeName) {
        return storeName.value;
      } else {
        return 'EverShop Store';
      }
    }
  }
};
