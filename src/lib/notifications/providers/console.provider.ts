import { NotificationProvider } from "../provider";
import { NotificationPayload } from "../types";

/** Provider por defecto: imprime la alerta en la terminal. Útil para desarrollo y pruebas. */
export class ConsoleProvider implements NotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    const tag = payload.level === "red" ? "🔴" : "🟡";
    console.log(`${tag} [${payload.level.toUpperCase()}] ${payload.title} — ${payload.body}`);
  }
}
