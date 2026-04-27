import { Service } from 'typedi';
import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService, EmailOptions } from '../../core/services/IEmailService.js';

@Service()
export class NodemailerService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: options.from || process.env.SMTP_USER || 'noreply@example.com',
      to: options.to,
      cc: options.cc?.join(','),
      bcc: options.bcc?.join(','),
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${options.to}: ${info.messageId}`);
    } catch (error) {
      console.error(`Nodemailer failed to send email to ${options.to}:`, error);
      throw error;
    }
  }
}