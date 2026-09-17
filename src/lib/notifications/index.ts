import { NotificationProvider } from "./provider";
import { NotificationPayload } from "./types";
import { ConsoleProvider } from "./providers/console.provider";
import { TelegramProvider } from "./providers/telegram.provider";
import { EmailProvider } from "./providers/email.provider";

export type { NotificationProvider, NotificationPayload };

/**
 * Selecciona el(los) canal(es) de notificación según NOTIFICATION_CHANNEL
 * (console|telegram|email, separados por coma para varios a la vez).
 * Para añadir un canal nuevo (Web Push, WhatsApp, etc.) basta con implementar
 * NotificationProvider y registrarlo aquí.
 */
export function getNotificationProviders(): NotificationProvider[] {
  const channels = (process.env.NOTIFICATION_CHANNEL ?? "console")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const providers: NotificationProvider[] = [];

  for (const channel of channels) {
    if (channel === "console") {
      providers.push(new ConsoleProvider());
    } else if (channel === "telegram") {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!token || !chatId) {
        console.warn("NOTIFICATION_CHANNEL incluye telegram pero faltan TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID");
        continue;
      }
      providers.push(new TelegramProvider(token, chatId));
    } else if (channel === "email") {
      const from = process.env.SMTP_FROM;
      const to = process.env.NOTIFICATION_EMAIL_TO;
      if (!from || !to) {
        console.warn("NOTIFICATION_CHANNEL incluye email pero faltan SMTP_FROM/NOTIFICATION_EMAIL_TO");
        continue;
      }
      providers.push(new EmailProvider(from, to));
    } else {
      console.warn(`Canal de notificación desconocido: ${channel}`);
    }
  }

  return providers.length > 0 ? providers : [new ConsoleProvider()];
}

export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  const providers = getNotificationProviders();
  await Promise.all(providers.map((p) => p.send(payload)));
}
