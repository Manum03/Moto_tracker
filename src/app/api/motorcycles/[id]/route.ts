import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

const updateSchema = z.object({
  plate: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  displacementCc: z.coerce.number().int().positive().optional(),
  purchaseDate: z.coerce.date().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const motorcycle = await prisma.motorcycle.findUnique({ where: { id } });
  if (!motorcycle) return jsonError("Motocicleta no encontrada", 404);
  return NextResponse.json(motorcycle);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = updateSchema.parse(await req.json());
    const motorcycle = await prisma.motorcycle.update({ where: { id }, data });
    return NextResponse.json(motorcycle);
  } catch (err) {
    return handleApiError(err);
  }
}
