import { NotificationEventType } from '../../core/events/NotificationEvents.js';

export type NotificationTexts = Record<NotificationEventType, { title: string; body: string }>;

export const enNotificationTexts: NotificationTexts = {
  USER_SIGNIN: {
    title: 'You signed in',
    body: 'You have signed in successfully.',
  },
  ORDER_PLACED: {
    title: 'Order Placed',
    body: 'Your order has been placed successfully.',
  },
  VARIANT_STOCK_LOW: {
    title: 'Low Stock Alert',
    body: 'Product stock is running low.',
  },
  VARIANT_OUT_OF_STOCK: {
    title: 'Out of Stock Alert',
    body: 'Product is now out of stock.',
  },
  REVIEW_CREATED: {
    title: 'New Review',
    body: 'A new review is waiting for moderation.',
  },
  REVIEW_APPROVED: {
    title: 'Review Approved',
    body: 'Your review has been approved!',
  },
};
