import {
  CategoryRow,
  CustomerRow,
  OrderRow,
  ProductImageRow,
  ProductInventoryRow,
  ProductRow
} from './db/index.js';
/**
 * Event registry that maps event names to their data types.
 * Extend this interface in your modules to register custom events.
 *
 * @example
 * ```typescript
 * // In your module
 * declare module '@evershop/evershop/types/event' {
 *   interface EventDataRegistry {
 *     'order_placed': {
 *       orderId: number;
 *       customerId: number;
 *       total: number;
 *       items: Array<{ productId: number; quantity: number }>;
 *     };
 *     'customer_registered': {
 *       customerId: number;
 *       email: string;
 *       name: string;
 *     };
 *   }
 * }
 * ```
 */
export interface EventDataRegistry {
  /**
   * Fired when a new product is created
   * Data: Complete product table row
   */
  product_created: ProductRow;

  /**
   * Fired when a product is updated
   * Data: Complete product table row
   */
  product_updated: ProductRow;

  /**
   * Fired when a product is deleted
   * Data: Complete product table row
   */
  product_deleted: ProductRow;

  /**
   * Fired when a product image is added
   * Data: Complete product_image table row
   */
  product_image_added: ProductImageRow;

  /**
   * Fired when a new category is created
   * Data: Complete category table row
   */
  category_created: CategoryRow;

  /**
   * Fired when a category is updated
   * Data: Complete category table row
   */
  category_updated: CategoryRow;
  /**
   * Fired when a category is deleted
   * Data: Complete category table row
   */
  category_deleted: CategoryRow;

  /**
   * Fired when product inventory is updated
   * Data: Complete product_inventory table row
   */
  inventory_updated: {
    old: ProductInventoryRow;
    new: ProductInventoryRow;
  };

  /**
   * Fired when a new customer is registered and status = 1 (account is active)
   * Data: Complete customer table row
   */
  customer_registered: CustomerRow;

  /**
   * Fired when a new customer record is added to database, regardless of the status value
   * Data: Complete customer table row
   */
  customer_created: CustomerRow;

  /**
   * Fired when a customer record in database is updated
   * Data: Complete customer table row
   */
  customer_updated: CustomerRow;

  /**
   * Fired when a customer record is deleted
   * Data: Complete customer table row
   */
  customer_deleted: CustomerRow;

  /**
   * Fired when a new order record is created in database, regardless of the payment method or order status
   * Data: Complete order table row
   */
  order_created: OrderRow;

  /**
   * Fired when a new order is placed
   * (This means the order is created and the payment is successful (decided by the payment method, for example, for cod, the order is created when the order is placed, but for online payment, the order is created when the payment is successful))
   */
  order_placed: OrderRow;

  /**
   * Fired when an order status is updated.
   * Data: {
   *   orderId: number;
   *   before: string; // the previous order status
   *   after: string; // the new order status
   * }
   */
  order_status_updated: {
    orderId: number;
    before: string;
    after: string;
  };

  /**
   * Fired when an order's shipment is created (admin marked it as shipped).
   */
  order_shipped: {
    order_id: number;
    uuid: string;
    customer_email: string | null;
    customer_full_name: string | null;
    order_number: string | number;
    carrier: string | null;
    tracking_number: string | null;
  };

  /**
   * Fired when an order's shipment is marked as delivered by the admin.
   */
  order_delivered: {
    order_id: number;
    uuid: string;
    customer_email: string | null;
    customer_full_name: string | null;
    order_number: string | number;
  };

  /**
   * Fired when an order is canceled.
   */
  order_canceled: {
    order_id: number;
    uuid: string;
    customer_email: string | null;
    customer_full_name: string | null;
    order_number: string | number;
    reason: string | null;
  };
}

/**
 * Extract event names from the registry
 */
export type EventName = keyof EventDataRegistry;

/**
 * Get the data type for a specific event
 */
export type EventData<T extends EventName> = EventDataRegistry[T];
