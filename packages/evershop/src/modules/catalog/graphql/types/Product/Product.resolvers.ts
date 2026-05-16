import { select } from '@evershop/postgres-query-builder';
import sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';
import { withCache } from '../../../../../lib/cache/index.js';
import { buildUrl } from '../../../../../lib/router/buildUrl.js';
import { buildFilterFromUrl } from '../../../../../lib/util/buildFilterFromUrl.js';
import { camelCase } from '../../../../../lib/util/camelCase.js';
import { getProductsBaseQuery } from '../../../services/getProductsBaseQuery.js';
import { ProductCollection } from '../../../services/ProductCollection.js';

export default {
  Product: {
    url: async (product, _, { pool }) => {
      // Resolved once per product on every listing — a hot N+1 path, so
      // the url_rewrite lookup is cached per product.
      return withCache(
        `product:url:${product.uuid}`,
        { tags: [`product:${product.productId ?? product.product_id}`] },
        async () => {
          const urlRewrite = await select()
            .from('url_rewrite')
            .where('entity_uuid', '=', product.uuid)
            .and('entity_type', '=', 'product')
            .load(pool);
          if (!urlRewrite) {
            return buildUrl('productView', { uuid: product.uuid });
          }
          return urlRewrite.request_path;
        }
      );
    },
    description: ({ description }) => {
      if (!description) {
        return [];
      }
      try {
        const json = JSON.parse(description);
        return json;
      } catch (e) {
        // This is for backward compatibility. If the description is not a JSON string then it is a raw HTML block
        const rowId = `r__${uuidv4()}`;
        return [
          {
            size: 1,
            id: rowId,
            columns: [
              {
                id: 'c__c5d90067-c786-4324-8e24-8e30520ac3d7',
                size: 1,
                data: {
                  time: 1723347125344,
                  blocks: [
                    {
                      id: 'AU89ItzUa7',
                      type: 'raw',
                      data: {
                        html: description
                      }
                    }
                  ],
                  version: '2.30.2'
                }
              }
            ]
          }
        ];
      }
    }
  },
  Query: {
    product: async (_, { id }, { pool }) => {
      const result = await withCache(
        `product:detail:${id}`,
        { tags: (r) => (r ? [`product:${r.product_id}`] : []) },
        async () => {
          const query = getProductsBaseQuery();
          query.where('product.product_id', '=', id);
          return query.load(pool);
        }
      );
      if (!result) {
        return null;
      } else {
        return camelCase(result);
      }
    },
    currentProduct: async (
      _,
      args,
      { currentRoute, currentProductId, pool }
    ) => {
      if (currentRoute.id !== 'productView') {
        return null;
      }
      const product = await withCache(
        `product:detail:${currentProductId}`,
        { tags: (r) => (r ? [`product:${r.product_id}`] : []) },
        async () => {
          const query = getProductsBaseQuery();
          query.where('product.product_id', '=', currentProductId);
          return query.load(pool);
        }
      );
      if (!product) {
        return null;
      } else {
        return camelCase(product);
      }
    },
    products: async (_, { filters = [] }, { user }) => {
      const query = getProductsBaseQuery();
      const root = new ProductCollection(query);
      await root.init(filters, !!user);
      return root;
    },
    productSearch: async (_, args, { currentUrl, currentRoute }) => {
      if (currentRoute?.id !== 'catalogSearch') {
        return null;
      }
      // Parse the keyword from the url
      const url = new URL(currentUrl);
      const keyword = url.searchParams.get('keyword') || undefined;
      const query = getProductsBaseQuery();
      const filtersFromUrl = buildFilterFromUrl(currentUrl);
      const root = new ProductCollection(query);
      await root.init(filtersFromUrl, false);
      return {
        products: root,
        keyword: keyword
      };
    }
  }
};
