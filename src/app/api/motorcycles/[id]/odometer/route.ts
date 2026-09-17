import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

const odometerSchema = z.object({
  km: z.coerce.number().int().min(0),
});

/** Odómetro virtual: registra el kilometraje actual y actualiza la moto. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { km } = odometerSchema.parse(await req.json());

    const motorcycle = await prisma.motorcycle.findUnique({ where: { id } });
    if (!motorcycle) return jsonError("Motocicleta no encontrada", 404);
    if (km < motorcycle.currentOdometer) {
      return jsonError(
        `El kilometraje no puede ser menor al actual (${motorcycle.currentOdometer} km)`,
        422
      );
    }

    const [, updated] = await prisma.$transaction([
      prisma.odometerLog.create({ data: { motorcycleId: id, km } }),
      prisma.motorcycle.update({ where: { id }, data: { currentOdometer: km } }),
    ]);

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
