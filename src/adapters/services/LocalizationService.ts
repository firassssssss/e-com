import { Service } from 'typedi';
import { ILocalizationService, Language } from '../../core/services/ILocalizationService.js';
import { NotificationTexts } from '../../i18n/notifications/en.js';
import { enNotificationTexts } from '../../i18n/notifications/en.js';
import { frNotificationTexts } from '../../i18n/notifications/fr.js';

@Service()
export class LocalizationService implements ILocalizationService {
  private readonly textMap: Record<Language, NotificationTexts> = {
    en: enNotificationTexts,
    fr: frNotificationTexts,
  };

  getNotificationTexts(language: Language): NotificationTexts {
    return this.textMap[language] || this.textMap.en;
  }

  async getUserLanguage(_userId: string): Promise<Language> {
    // Default to 'en' - extend user schema if language preference is needed
    return 'en';
  }

  resolveNotificationTexts(language: Language, fallbackLanguage: Language = 'en'): NotificationTexts {
    return this.textMap[language] || this.textMap[fallbackLanguage] || this.textMap.en;
  }
}
