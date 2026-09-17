import { NotificationProvider } from "../provider";
import { NotificationPayload } from "../types";

/**
 * Envía la alerta a un chat de Telegram vía Bot API.
 * Requiere TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en el entorno.
 * Crear el bot con @BotFather y obtener el chat id hablando con el bot y
 * consultando https://api.telegram.org/bot<token>/getUpdates
 */
export class TelegramProvider implements NotificationProvider {
  constructor(
    private readonly botToken: string,
    private readonly chatId: string
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    const tag = payload.level === "red" ? "🔴" : "🟡";
    const text = `${tag} *${payload.title}*\n${payload.body}`;

    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: "Markdown",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Telegram sendMessage falló (${res.status}): ${detail}`);
    }
  }
}
