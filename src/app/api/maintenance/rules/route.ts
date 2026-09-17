import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { ALL_MAINTENANCE_TYPES, DEFAULT_MAINTENANCE_INTERVALS } from "@/lib/maintenance-rules";

const upsertSchema = z.object({
  motorcycleId: z.string().min(1),
  type: z.enum(["OIL_CHANGE", "CHAIN", "BRAKE_PADS", "BRAKE_FLUID", "TIRE_PRESSURE", "OTHER"]),
  intervalKm: z.coerce.number().int().positive().nullable().optional(),
  intervalDays: z.coerce.number().int().positive().nullable().optional(),
});

/**
 * Devuelve las reglas de mantenimiento de una moto, creando en la respuesta
 * (sin persistir) las que falten con sus valores por defecto.
 */
export async function GET(req: NextRequest) {
  const motorcycleId = req.nextUrl.searchParams.get("motorcycleId");
  if (!motorcycleId) return jsonError("motorcycleId es requerido");

  const existing = await prisma.maintenanceRule.findMany({ where: { motorcycleId } });
  const byType = new Map(existing.map((r) => [r.type, r]));

  const rules = ALL_MAINTENANCE_TYPES.filter((t) => t !== "OTHER").map((type) => {
    const rule = byType.get(type);
    if (rule) return rule;
    return {
      id: null,
      motorcycleId,
      type,
      intervalKm: DEFAULT_MAINTENANCE_INTERVALS[type].intervalKm,
      intervalDays: DEFAULT_MAINTENANCE_INTERVALS[type].intervalDays,
      lastDoneKm: null,
      lastDoneDate: null,
    };
  });

  return NextResponse.json(rules);
}

/** Crea o actualiza (upsert) la configuración de intervalo para un tipo de mantenimiento. */
export async function PUT(req: NextRequest) {
  try {
    const data = upsertSchema.parse(await req.json());
    const rule = await prisma.maintenanceRule.upsert({
      where: { motorcycleId_type: { motorcycleId: data.motorcycleId, type: data.type } },
      create: data,
      update: { intervalKm: data.intervalKm, intervalDays: data.intervalDays },
    });
    return NextResponse.json(rule);
  } catch (err) {
    return handleApiError(err);
  }
}
