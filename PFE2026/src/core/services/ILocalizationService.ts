import { NotificationTexts } from '../../i18n/notifications/en.js';

export type Language = 'en' | 'fr';

export interface ILocalizationService {
  /**
   * Get notification texts for a specific language
   * @param language - Language code ('en' or 'fr')
   * @returns NotificationTexts object for the specified language
   */
  getNotificationTexts(language: Language): NotificationTexts;

  /**
   * Get user's preferred language
   * @param userId - User ID
   * @returns Promise<Language> - User's language preference (defaults to 'en')
   */
  getUserLanguage(userId: string): Promise<Language>;

  /**
   * Resolve notification texts with fallback logic
   * @param language - Preferred language
   * @param fallbackLanguage - Fallback language (default: 'en')
   * @returns NotificationTexts object
   */
  resolveNotificationTexts(language: Language, fallbackLanguage?: Language): NotificationTexts;
}
