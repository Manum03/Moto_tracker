import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

const logSchema = z.object({
  motorcycleId: z.string().min(1),
  type: z.enum(["OIL_CHANGE", "CHAIN", "BRAKE_PADS", "BRAKE_FLUID", "TIRE_PRESSURE", "OTHER"]),
  date: z.coerce.date(),
  km: z.coerce.number().int().min(0),
  cost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const motorcycleId = req.nextUrl.searchParams.get("motorcycleId") ?? undefined;
  if (!motorcycleId) return jsonError("motorcycleId es requerido");
  const logs = await prisma.maintenanceLog.findMany({
    where: { motorcycleId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

/**
 * Registra un mantenimiento realizado y actualiza (o crea) la regla asociada
 * con el último km/fecha, además de limpiar alertas ya enviadas para ese tipo
 * de forma que el próximo ciclo pueda volver a notificar.
 */
export async function POST(req: NextRequest) {
  try {
    const data = logSchema.parse(await req.json());

    const [log, rule] = await prisma.$transaction([
      prisma.maintenanceLog.create({ data }),
      prisma.maintenanceRule.upsert({
        where: { motorcycleId_type: { motorcycleId: data.motorcycleId, type: data.type } },
        create: {
          motorcycleId: data.motorcycleId,
          type: data.type,
          lastDoneKm: data.km,
          lastDoneDate: data.date,
        },
        update: { lastDoneKm: data.km, lastDoneDate: data.date },
      }),
    ]);

    await prisma.notificationLog.deleteMany({ where: { type: "MAINTENANCE", refId: rule.id } });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
