import { Notification } from './Notification.js';

/**
 * User Signin Notification - Example Laravel-style notification
 * This demonstrates how to create a notification that can send through multiple channels
 */
export class UserSigninNotification extends Notification {
  private userData: {
    userId: string;
    username: string;
    profilePicUrl?: string;
    signinTime: Date;
    ipAddress?: string;
    deviceInfo?: string;
  };

  constructor(userData: {
    userId: string;
    username: string;
    profilePicUrl?: string;
    signinTime?: Date;
    ipAddress?: string;
    deviceInfo?: string;
  }) {
    super();
    this.userData = {
      ...userData,
      signinTime: userData.signinTime || new Date(),
    };
  }

  /**
   * Determine which channels to send this notification through
   * This is the Laravel-style approach where each notification class
   * decides which channels to use
   * @param notifiable - The user entity
   * @returns Array of channel names
   */
  via(notifiable: any): string[] {
    // You can customize this based on user preferences
    // For example, check user notification settings
    const channels: string[] = ['database']; // Always send to database

    // Add email for important signins (first time, different IP, etc.)
    if (this.isUnusualSignin()) {
      channels.push('email');
    }

    // Add FCM for mobile users
    if (this.hasMobileDevice()) {
      channels.push('fcm');
    }

    return channels;
  }

  /**
   * Database channel representation
   * @param notifiable - The user entity
   * @returns Database notification data
   */
  toDatabase(notifiable: any): Record<string, any> {
    return {
      title: 'New Signin Detected',
      body: `You signed in from ${this.userData.deviceInfo || 'a new device'}`,
      data: {
        userId: this.userData.userId,
        username: this.userData.username,
        signinTime: this.userData.signinTime,
        ipAddress: this.userData.ipAddress,
        deviceInfo: this.userData.deviceInfo,
        isUnusual: this.isUnusualSignin(),
        actionUrl: '/profile/security-activity',
        type: 'user_signin',
      },
    };
  }

  /**
   * Email channel representation
   * @param notifiable - The user entity
   * @returns Email data
   */
  toMail(notifiable: any): Record<string, any> {
    return {
      subject: 'New Signin to Your Account',
      html: this.generateEmailHTML(),
      text: this.generateEmailText(),
      data: {
        userId: this.userData.userId,
        username: this.userData.username,
        signinTime: this.userData.signinTime,
        ipAddress: this.userData.ipAddress,
        deviceInfo: this.userData.deviceInfo,
        isUnusual: this.isUnusualSignin(),
        actionUrl: `${process.env.APP_URL}/profile/security-activity`,
      },
    };
  }

  /**
   * FCM channel representation
   * @param notifiable - The user entity
   * @returns FCM data
   */
  toFCM(notifiable: any): {
    title: string;
    body: string;
    data?: Record<string, any>;
  } {
    return {
      title: 'Account Signin',
      body: `New signin detected from ${this.userData.deviceInfo || 'unknown device'}`,
      data: {
        userId: this.userData.userId,
        type: 'user_signin',
        isUnusual: this.isUnusualSignin(),
        actionUrl: '/profile/security-activity',
      },
    };
  }

  /**
   * Check if this is an unusual signin (different IP, new device, etc.)
   * This would typically involve checking against user's signin history
   * @returns boolean indicating if this is unusual
   */
  private isUnusualSignin(): boolean {
    // For demo purposes, consider it unusual if we have IP or device info
    // In real implementation, you'd compare against user's signin history
    return !!(this.userData.ipAddress || this.userData.deviceInfo);
  }

  /**
   * Check if user has mobile device tokens
   * @returns boolean
   */
  private hasMobileDevice(): boolean {
    // This would check if user has registered FCM tokens
    // For demo, assume they might have
    return true; // In real implementation, check device token repository
  }

  /**
   * Generate HTML email content
   * @returns HTML string
   */
  private generateEmailHTML(): string {
    const warningText = this.isUnusualSignin()
      ? `<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
           <strong>⚠️ Unusual Signin Detected</strong><br>
           This signin appears to be from a new location or device.
         </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Signin Detected</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 20px; font-size: 12px; color: #6c757d; text-align: center; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .detail-row { margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
            .detail-label { font-weight: bold; color: #495057; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 New Signin Detected</h1>
            <p>Hello ${this.userData.username},</p>
          </div>
          <div class="content">
            <p>A new signin to your account was detected:</p>

            <div class="detail-row">
              <div class="detail-label">Time:</div>
              <div>${this.userData.signinTime.toLocaleString()}</div>
            </div>

            ${this.userData.ipAddress ? `
            <div class="detail-row">
              <div class="detail-label">IP Address:</div>
              <div>${this.userData.ipAddress}</div>
            </div>
            ` : ''}

            ${this.userData.deviceInfo ? `
            <div class="detail-row">
              <div class="detail-label">Device:</div>
              <div>${this.userData.deviceInfo}</div>
            </div>
            ` : ''}

            ${warningText}

            <p>
              <a href="${process.env.APP_URL}/profile/security-activity" class="button">
                Review Activity
              </a>
            </p>

            <p>If this was you, no further action is needed. If you don't recognize this activity, please secure your account immediately.</p>
          </div>
          <div class="footer">
            <p>This email was sent automatically. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Your Company Name</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content
   * @returns Text string
   */
  private generateEmailText(): string {
    const warningText = this.isUnusualSignin()
      ? '\n\n⚠️ WARNING: This signin appears to be from a new location or device.\n'
      : '';

    return `
New Signin Detected

Hello ${this.userData.username},

A new signin to your account was detected:

Time: ${this.userData.signinTime.toLocaleString()}
${this.userData.ipAddress ? `IP Address: ${this.userData.ipAddress}` : ''}
${this.userData.deviceInfo ? `Device: ${this.userData.deviceInfo}` : ''}
${warningText}
Review Activity: ${process.env.APP_URL}/profile/security-activity

If this was you, no further action is needed. If you don't recognize this activity, please secure your account immediately.

This email was sent automatically. Please do not reply to this email.
© ${new Date().getFullYear()} Your Company Name
    `.trim();
  }
}
