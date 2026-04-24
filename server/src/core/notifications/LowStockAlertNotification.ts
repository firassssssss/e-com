import { Notification } from './Notification.js';

/**
 * Notification sent to administrators when a product variant's stock level falls below the threshold.
 */
export class LowStockAlertNotification extends Notification {
  private alertData: {
    productName: string;
    variantName: string;
    sku: string;
    currentStock: number;
    threshold: number;
  };

  /**
   * Creates an instance of LowStockAlertNotification.
   * @param alertData - The details of the low stock alert.
   */
  constructor(alertData: {
    productName: string;
    variantName: string;
    sku: string;
    currentStock: number;
    threshold: number;
  }) {
    super();
    this.alertData = alertData;
  }

  /**
   * Send to admins via all channels (critical alert)
   */
  via(notifiable: any): string[] {
    return ['fcm', 'email', 'database'];
  }

  /**
   * Database notification
   */
  toDatabase(notifiable: any): Record<string, any> {
    return {
      title: '⚠️ Low Stock Alert',
      body: `${this.alertData.productName} - ${this.alertData.variantName} is running low (${this.alertData.currentStock} remaining)`,
      data: {
        type: 'low_stock_alert',
        productName: this.alertData.productName,
        variantName: this.alertData.variantName,
        sku: this.alertData.sku,
        currentStock: this.alertData.currentStock,
        threshold: this.alertData.threshold,
        severity: 'warning',
        actionUrl: '/admin/inventory',
      },
    };
  }

  /**
   * Email notification
   */
  toMail(notifiable: any): Record<string, any> {
    return {
      subject: `⚠️ Low Stock Alert: ${this.alertData.productName}`,
      html: this.generateEmailHTML(),
      text: this.generateEmailText(),
      data: {
        type: 'low_stock_alert',
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
      title: '⚠️ Low Stock Alert',
      body: `${this.alertData.productName} - ${this.alertData.variantName}: ${this.alertData.currentStock} left`,
      data: {
        type: 'low_stock_alert',
        sku: this.alertData.sku,
        severity: 'warning',
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
            .alert-box { background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stock-info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .label { font-weight: bold; color: #495057; }
          </style>
        </head>
        <body>
          <div class="alert-box">
            <h1>⚠️ Low Stock Alert</h1>
            <p><strong>Immediate action required!</strong></p>
          </div>
          
          <div class="stock-info">
            <div><span class="label">Product:</span> ${this.alertData.productName}</div>
            <div><span class="label">Variant:</span> ${this.alertData.variantName}</div>
            <div><span class="label">SKU:</span> ${this.alertData.sku}</div>
            <div><span class="label">Current Stock:</span> <strong>${this.alertData.currentStock}</strong></div>
            <div><span class="label">Threshold:</span> ${this.alertData.threshold}</div>
          </div>

          <p>This product variant is running low on stock. Please reorder or adjust inventory to prevent stockouts.</p>

          <p>
            <a href="${process.env.APP_URL}/admin/inventory" class="button">
              Manage Inventory
            </a>
          </p>
        </body>
      </html>
    `;
  }

  private generateEmailText(): string {
    return `
⚠️ Low Stock Alert

Immediate action required!

Product: ${this.alertData.productName}
Variant: ${this.alertData.variantName}
SKU: ${this.alertData.sku}
Current Stock: ${this.alertData.currentStock}
Threshold: ${this.alertData.threshold}

This product variant is running low on stock. Please reorder or adjust inventory to prevent stockouts.

Manage Inventory: ${process.env.APP_URL}/admin/inventory
    `.trim();
  }
}
