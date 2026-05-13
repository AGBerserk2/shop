import nodemailer, { Transporter } from 'nodemailer';
import {
  EmailService,
  registerEmailService,
  SendEmailArguments
} from '../../lib/mail/emailHelper.js';
import { error, info } from '../../lib/log/logger.js';

// Lazy singleton — only instantiate the transporter once the first email
// is actually sent, so missing credentials don't crash app startup; we
// just log and noop until the operator wires them.
let cachedTransporter: Transporter | null = null;
let warnedMissing = false;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure =
    typeof process.env.SMTP_SECURE === 'string'
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;

  if (!user || !pass) {
    if (!warnedMissing) {
      warnedMissing = true;
      info(
        '[smtp] SMTP_USER or SMTP_PASS not set — outbound emails will be skipped.'
      );
    }
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
  info(`[smtp] Email transport ready (${host}:${port} as ${user}).`);
  return cachedTransporter;
}

const service: EmailService = {
  async sendEmail(args: SendEmailArguments) {
    const transporter = getTransporter();
    if (!transporter) {
      // No credentials — quietly skip so the rest of the order
      // pipeline doesn't fail on missing email config.
      return;
    }

    // EverShop's emailHelper fills `body` from `template + data` before
    // calling us, but stays defensive in case some caller passes
    // template-only and forgets the body fallback.
    const html =
      args.body || (typeof args.template === 'string' ? args.template : '');

    const fromAddress =
      args.from ||
      process.env.EMAIL_FROM ||
      `Anroy <${process.env.SMTP_USER}>`;

    // Attachments forwarded straight to nodemailer. EmailService doesn't
    // formally type this but the args bag is permissive — any caller
    // (e.g. the order confirmation subscriber building a PDF invoice)
    // can pass attachments alongside the html body.
    const attachments = (args as any).attachments as
      | Array<{
          filename: string;
          content?: Buffer | string;
          path?: string;
          contentType?: string;
        }>
      | undefined;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: args.to,
        cc: args.cc,
        subject: args.subject,
        html,
        attachments
      } as nodemailer.SendMailOptions);
    } catch (e) {
      error(e);
      throw e;
    }
  }
};

export default () => {
  registerEmailService(service);
};
