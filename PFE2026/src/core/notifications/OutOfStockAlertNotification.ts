import { Notification } from './Notification.js';

/**
 * Urgent notification sent to administrators when a product variant's stock level reaches zero.
 */
export class OutOfStockAlertNotification extends Notification {
  private alertData: {
    productName: string;
    variantName: string;
    sku: string;
  };

  /**
   * Creates an instance of OutOfStockAlertNotification.
   * @param alertData - The details of the out of stock alert.
   */
  constructor(alertData: {
    productName: string;
    variantName: string;
    sku: string;
  }) {
    super();
    this.alertData = alertData;
  }

  via(notifiable: any): string[] {
    return ['fcm', 'email', 'database']; // All channels for critical alert
  }

  /**
   * Database notification
   */
  toDatabase(notifiable: any): Record<string, any> {
    return {
      title: '🚨 Out of Stock!',
      body: `${this.alertData.productName} - ${this.alertData.variantName} is now out of stock`,
      data: {
        type: 'out_of_stock_alert',
        productName: this.alertData.productName,
        variantName: this.alertData.variantName,
        sku: this.alertData.sku,
        severity: 'critical',
        actionUrl: '/admin/inventory',
      },
    };
  }

  /**
   * Email notification
   */
  toMail(notifiable: any): Record<string, any> {
    return {
      subject: `🚨 URGENT: ${this.alertData.productName} Out of Stock`,
      html: this.generateEmailHTML(),
      text: this.generateEmailText(),
      data: {
        type: 'out_of_stock_alert',
        sku: this.alertData.sku,
        actionUrl: `${process.env.APP_URL}/admin/inventory`,
      },
    };
  }

  /**
   * FCM push notification
   */
  toFCM(notifiable: any): { title: string; body: string; data?: Record<string, any> } {
    return {
      title: '🚨 Out of Stock',
      body: `${this.alertData.productName} - ${this.alertData.variantName} is OUT OF STOCK`,
      data: {
        type: 'out_of_stock_alert',
        sku: this.alertData.sku,
        severity: 'critical',
        actionUrl: '/admin/inventory',
      },
    };
  }

  private generateEmailHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .critical-box { background-color: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stock-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="critical-box">
            <h1>🚨 CRITICAL: Out of Stock</h1>
            <p><strong>This product is now unavailable for purchase!</strong></p>
          </div>
          
          <div class="stock-info">
            <div><strong>Product:</strong> ${this.alertData.productName}</div>
            <div><strong>Variant:</strong> ${this.alertData.variantName}</div>
            <div><strong>SKU:</strong> ${this.alertData.sku}</div>
            <div><strong>Stock Level:</strong> <span style="color: #dc3545; font-weight: bold;">0 (OUT OF STOCK)</span></div>
          </div>

          <p>This product variant has run out of stock. Customers cannot purchase it until inventory is replenished.</p>

          <p>
            <a href="${process.env.APP_URL}/admin/inventory" class="button">
              Reorder Now
            </a>
          </p>
        </body>
      </html>
    `;
  }

  private generateEmailText(): string {
    return `
🚨 CRITICAL: Out of Stock

This product is now unavailable for purchase!

Product: ${this.alertData.productName}
Variant: ${this.alertData.variantName}
SKU: ${this.alertData.sku}
Stock Level: 0 (OUT OF STOCK)

This product variant has run out of stock. Customers cannot purchase it until inventory is replenished.

Reorder Now: ${process.env.APP_URL}/admin/inventory
    `.trim();
  }
}
