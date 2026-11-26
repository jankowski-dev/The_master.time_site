import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';

import { formatLeadHtml, formatLeadText } from './format';
import type { EmailConfig, Lead, LeadNotifier, SendMail } from './types';

/**
 * Builds a lazy SMTP transport. Does not connect until the first `sendMail`.
 */
export function createSmtpTransport(config: EmailConfig): { sendMail: SendMail } {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass }
  });

  return {
    sendMail: (message) => transport.sendMail(message as SendMailOptions)
  };
}

/**
 * Creates a lead notifier that emails each lead. A `sendMail` can be injected
 * for testing; by default it uses the SMTP transport built from `config`.
 */
export function createEmailNotifier(config: EmailConfig, sendMail?: SendMail): LeadNotifier {
  const mailer = sendMail ?? createSmtpTransport(config).sendMail;

  return {
    name: 'email',
    async send(lead: Lead): Promise<void> {
      const message = {
        from: config.from,
        to: config.to,
        subject: `[The Master Time] Новая заявка: ${lead.phone}`,
        text: formatLeadText(lead),
        html: formatLeadHtml(lead),
        attachments: lead.photos.map((photo) => ({
          filename: photo.filename,
          content: photo.content,
          contentType: photo.contentType
        }))
      };

      await mailer(message);
    }
  };
}
