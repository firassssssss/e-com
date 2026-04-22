import { Inject, Service } from 'typedi';
import { NotificationChannel } from '../NotificationChannel.js';
import { Notification } from '../Notification.js';
import { IEmailService } from '../../services/IEmailService.js';
import { ILocalizationService, Language } from '../../services/ILocalizationService.js';
import { NotificationTexts } from '../../../i18n/notifications/en.js';
import { enNotificationTexts } from '../../../i18n/notifications/en.js';
import { frNotificationTexts } from '../../../i18n/notifications/fr.js';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailData {
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * Email notification channel implementation
 */
@Service()
export class EmailChannel implements NotificationChannel {
  constructor(
    @Inject('IEmailService') private readonly emailService: IEmailService,
    @Inject('ILocalizationService') private readonly localizationService: ILocalizationService,
  ) { }

  async send(notifiable: any, notification: Notification): Promise<void> {
    // Check if notification supports email channel
    const emailData = notification.toMail ? notification.toMail(notifiable) : null;
    if (!emailData) {
      console.warn(`Notification ${notification.constructor.name} does not support email channel`);
      return;
    }

    // Get recipient email
    const recipients = this.getRecipients(notifiable);
    if (!recipients.length) {
      console.warn('No valid email recipients found for notification');
      return;
    }

    // Localize content
    const userLanguage = await this.getUserLanguage(notifiable);
    const localizedData = await this.localizeEmailData(emailData, userLanguage, notification);

    // Send emails to all recipients
    for (const recipient of recipients) {
      try {
        await this.emailService.send({
          to: recipient.email,
          from: process.env.MAIL_FROM_ADDRESS || 'noreply@example.com',
          subject: localizedData.subject,
          html: localizedData.html,
          text: localizedData.text,
          template: localizedData.template,
          data: {
            ...localizedData.data,
            recipient: recipient,
            notification: notification,
          },
          attachments: localizedData.attachments,
        });

        console.log(`Email notification sent to ${recipient.email} for ${notification.constructor.name}`);
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        // Continue sending to other recipients even if one fails
      }
    }
  }

  private getRecipients(notifiable: any): EmailRecipient[] {
    // Support different ways of specifying recipients (similar to Laravel)
    const recipients: EmailRecipient[] = [];

    // Single recipient with email property
    if (notifiable.email) {
      recipients.push({
        email: notifiable.email,
        name: notifiable.name || notifiable.fullName || notifiable.username,
      });
    }

    // Array of recipients
    if (Array.isArray(notifiable.recipients)) {
      notifiable.recipients.forEach((recipient: any) => {
        if (recipient.email) {
          recipients.push({
            email: recipient.email,
            name: recipient.name || recipient.fullName || recipient.username,
          });
        }
      });
    }

    // CC/BCC support (if notifiable has these properties)
    if (notifiable.ccEmails && Array.isArray(notifiable.ccEmails)) {
      notifiable.ccEmails.forEach((email: string) => {
        recipients.push({ email });
      });
    }

    return recipients;
  }

  private async getUserLanguage(notifiable: any): Promise<Language> {
    if (notifiable.language) {
      return notifiable.language as Language;
    }
    if (notifiable.userId) {
      return await this.localizationService.getUserLanguage(notifiable.userId);
    }
    return 'en' as Language; // Default language
  }

  private async localizeEmailData(emailData: Record<string, any>, language: Language, notification: Notification): Promise<EmailData> {
    // Get notification texts for the language
    const notificationTexts = this.getNotificationTexts(language);
    const notificationType = notification.type;

    // Get localized content for this notification type
    const localizedContent = notificationTexts[notificationType as keyof NotificationTexts] || {
      title: emailData.subject || 'Notification',
      body: emailData.text || 'You have a new notification',
    };

    return {
      subject: emailData.subject || localizedContent.title,
      html: emailData.html || this.generateHTMLTemplate(localizedContent, emailData),
      text: emailData.text || localizedContent.body,
      template: emailData.template,
      data: emailData.data,
      attachments: emailData.attachments,
    };
  }

  private getNotificationTexts(language: Language): NotificationTexts {
    switch (language) {
      case 'fr':
        return frNotificationTexts;
      case 'en':
      default:
        return enNotificationTexts;
    }
  }

  private generateHTMLTemplate(content: { title: string; body: string }, data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${content.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 20px; font-size: 12px; color: #6c757d; text-align: center; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${content.title}</h1>
          </div>
          <div class="content">
            <p>${content.body}</p>
            ${data.actionUrl ? `<p><a href="${data.actionUrl}" class="button">View Details</a></p>` : ''}
          </div>
          <div class="footer">
            <p>This email was sent automatically. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }
}
