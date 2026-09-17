import { MaintenanceType } from "@prisma/client";

export const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
  OIL_CHANGE: "Cambio de aceite",
  CHAIN: "Lubricación / tensión de cadena",
  BRAKE_PADS: "Pastillas de freno",
  BRAKE_FLUID: "Líquido de frenos",
  TIRE_PRESSURE: "Presión de llantas",
  OTHER: "Otro",
};

/** Defaults used when a MaintenanceRule doesn't override them ("lo que ocurra primero"). */
export const DEFAULT_MAINTENANCE_INTERVALS: Record<
  MaintenanceType,
  { intervalKm: number | null; intervalDays: number | null }
> = {
  OIL_CHANGE: { intervalKm: 2500, intervalDays: 182 }, // ~6 meses
  CHAIN: { intervalKm: 500, intervalDays: null },
  BRAKE_PADS: { intervalKm: 5000, intervalDays: null },
  BRAKE_FLUID: { intervalKm: null, intervalDays: 365 },
  TIRE_PRESSURE: { intervalKm: null, intervalDays: 15 },
  OTHER: { intervalKm: null, intervalDays: null },
};

export const ALL_MAINTENANCE_TYPES = Object.keys(
  MAINTENANCE_LABELS
) as MaintenanceType[];
