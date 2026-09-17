const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Suma días a una fecha "de calendario" (medianoche UTC) sin depender de la zona horaria local. */
export function addDays(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount));
}

/** Suma meses a una fecha "de calendario" (medianoche UTC) sin depender de la zona horaria local. */
export function addMonths(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, date.getUTCDate()));
}

/**
 * Días de calendario hasta `date`, comparando siempre en UTC. Las fechas de
 * la app (vencimientos, fechas de cuota, etc.) se guardan como medianoche
 * UTC del día elegido, así que comparar en UTC evita que el resultado varíe
 * según la zona horaria del servidor o del navegador.
 */
export function daysUntil(date: Date): number {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((target - today) / MS_PER_DAY);
}

/**
 * Formatea una fecha "de calendario" (guardada como medianoche UTC) usando
 * siempre UTC, para que se muestre el mismo día sin importar la zona horaria
 * del navegador de quien la ve.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-CO", { timeZone: "UTC" });
}
