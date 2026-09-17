import { Document, MaintenanceRule, Installment } from "@prisma/client";
import { daysUntil, addDays } from "./date-utils";
import { DEFAULT_MAINTENANCE_INTERVALS } from "./maintenance-rules";

export type SemaphoreLevel = "green" | "yellow" | "red";

export interface DocumentStatus {
  level: SemaphoreLevel;
  daysLeft: number;
}

/** Verde si faltan >15 días, amarillo si <=15, rojo si <=3 o ya vencido. */
export function getDocumentStatus(doc: Pick<Document, "expiryDate">): DocumentStatus {
  const daysLeft = daysUntil(doc.expiryDate);
  if (daysLeft <= 3) return { level: "red", daysLeft };
  if (daysLeft <= 15) return { level: "yellow", daysLeft };
  return { level: "green", daysLeft };
}

export interface MaintenanceStatus {
  level: SemaphoreLevel;
  kmRemaining: number | null;
  daysRemaining: number | null;
  dueByKm: number | null;
  dueByDate: Date | null;
}

/**
 * Compara por km y por fecha contra la regla configurada (o los defaults del tipo)
 * y usa "lo que ocurra primero": si cualquiera de los dos vence, el semáforo se pone en rojo.
 */
export function getMaintenanceStatus(
  rule: Pick<MaintenanceRule, "type" | "intervalKm" | "intervalDays" | "lastDoneKm" | "lastDoneDate">,
  currentOdometer: number,
  motorcyclePurchaseDate: Date
): MaintenanceStatus {
  const defaults = DEFAULT_MAINTENANCE_INTERVALS[rule.type];
  const intervalKm = rule.intervalKm ?? defaults.intervalKm;
  const intervalDays = rule.intervalDays ?? defaults.intervalDays;
  const lastDoneKm = rule.lastDoneKm ?? 0;
  const lastDoneDate = rule.lastDoneDate ?? motorcyclePurchaseDate;

  const dueByKm = intervalKm != null ? lastDoneKm + intervalKm : null;
  const dueByDate = intervalDays != null ? addDays(lastDoneDate, intervalDays) : null;

  const kmRemaining = dueByKm != null ? dueByKm - currentOdometer : null;
  const daysRemaining = dueByDate != null ? daysUntil(dueByDate) : null;

  const kmRedThreshold = intervalKm != null ? Math.max(intervalKm * 0.05, 30) : null;
  const kmYellowThreshold = intervalKm != null ? Math.max(intervalKm * 0.15, 100) : null;

  const isRed =
    (kmRemaining != null && kmRemaining <= (kmRedThreshold ?? 0)) ||
    (daysRemaining != null && daysRemaining <= 3);
  const isYellow =
    (kmRemaining != null && kmRemaining <= (kmYellowThreshold ?? 0)) ||
    (daysRemaining != null && daysRemaining <= 15);

  const level: SemaphoreLevel = isRed ? "red" : isYellow ? "yellow" : "green";

  return { level, kmRemaining, daysRemaining, dueByKm, dueByDate };
}

/** Texto legible para el estado de un mantenimiento, distinguiendo lo pendiente de lo ya vencido. */
export function formatMaintenanceRemaining(status: MaintenanceStatus): string {
  const parts: string[] = [];
  if (status.kmRemaining != null) {
    parts.push(
      status.kmRemaining < 0 ? `${Math.abs(status.kmRemaining)} km excedidos` : `${status.kmRemaining} km restantes`
    );
  }
  if (status.daysRemaining != null) {
    parts.push(
      status.daysRemaining < 0
        ? `vencido hace ${Math.abs(status.daysRemaining)} día(s)`
        : `${status.daysRemaining} día(s) restantes`
    );
  }
  return parts.join(" · ") || "revisar";
}

export interface InstallmentStatus {
  level: SemaphoreLevel;
  daysLeft: number;
}

/** Rojo desde 2 días antes del vencimiento (o si ya venció), amarillo desde 7 días antes. */
export function getInstallmentStatus(
  installment: Pick<Installment, "dueDate" | "paid">
): InstallmentStatus {
  const daysLeft = daysUntil(installment.dueDate);
  if (installment.paid) return { level: "green", daysLeft };
  if (daysLeft <= 2) return { level: "red", daysLeft };
  if (daysLeft <= 7) return { level: "yellow", daysLeft };
  return { level: "green", daysLeft };
}

/** Combina varios niveles en el peor (rojo > amarillo > verde). */
export function worstLevel(levels: SemaphoreLevel[]): SemaphoreLevel {
  if (levels.includes("red")) return "red";
  if (levels.includes("yellow")) return "yellow";
  return "green";
}
