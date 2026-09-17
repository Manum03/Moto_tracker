import "dotenv/config";
import cron from "node-cron";
import { runAlertCheck } from "../src/lib/alert-checker";

const once = process.argv.includes("--once");
// Hora diaria de chequeo (24h, hora del servidor). Ajustable con CRON_SCHEDULE ("m h * * *").
const schedule = process.env.CRON_SCHEDULE ?? "0 8 * * *";

async function tick() {
  const startedAt = new Date().toISOString();
  try {
    const result = await runAlertCheck();
    console.log(`[${startedAt}] Chequeo de alertas OK:`, result);
  } catch (err) {
    console.error(`[${startedAt}] Error al chequear alertas:`, err);
  }
}

if (once) {
  tick().then(() => process.exit(0));
} else {
  console.log(`Cron de alertas iniciado. Programación: "${schedule}" (${process.env.NOTIFICATION_CHANNEL ?? "console"})`);
  cron.schedule(schedule, tick);
  tick(); // primera corrida inmediata al arrancar
}
