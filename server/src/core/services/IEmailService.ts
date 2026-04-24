export interface IEmailService {
  /**
   * Send an email
   * @param options Email options
   * @returns Promise that resolves when email is sent
   */
  send(options: EmailOptions): Promise<void>;
}

export interface EmailOptions {
  to: string;
  from?: string;
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
  cc?: string[];
  bcc?: string[];
}
