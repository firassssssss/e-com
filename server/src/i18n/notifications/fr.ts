import { NotificationEventType } from '../../core/events/NotificationEvents.js';

export type NotificationTexts = Record<NotificationEventType, { title: string; body: string }>;

export const frNotificationTexts: NotificationTexts = {
  USER_SIGNIN: {
    title: 'Connexion effectuée',
    body: 'Vous vous êtes connecté avec succès.',
  },
  ORDER_PLACED: {
    title: 'Commande passée',
    body: 'Votre commande a été enregistrée avec succès.',
  },
  VARIANT_STOCK_LOW: {
    title: 'Alerte stock faible',
    body: 'Le stock du produit est bas.',
  },
  VARIANT_OUT_OF_STOCK: {
    title: 'Alerte rupture de stock',
    body: 'Le produit est maintenant en rupture de stock.',
  },
  REVIEW_CREATED: {
    title: 'Nouvel avis',
    body: 'Un nouvel avis est en attente de modération.',
  },
  REVIEW_APPROVED: {
    title: 'Avis approuvé',
    body: 'Votre avis a été approuvé !',
  },
};
