import nodemailer, { Transporter } from "nodemailer";
import { NotificationProvider } from "../provider";
import { NotificationPayload } from "../types";

/**
 * Envía la alerta por correo vía SMTP (nodemailer).
 * Requiere SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM y NOTIFICATION_EMAIL_TO.
 */
export class EmailProvider implements NotificationProvider {
  private transporter: Transporter;

  constructor(
    private readonly from: string,
    private readonly to: string
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(payload: NotificationPayload): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject: `[${payload.level.toUpperCase()}] ${payload.title}`,
      text: payload.body,
    });
  }
}
