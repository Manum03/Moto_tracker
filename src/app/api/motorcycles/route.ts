import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

const motorcycleSchema = z.object({
  plate: z.string().min(1, "La placa es obligatoria"),
  brand: z.string().min(1, "La marca es obligatoria"),
  model: z.string().min(1, "El modelo es obligatorio"),
  displacementCc: z.coerce.number().int().positive("El cilindraje debe ser positivo"),
  purchaseDate: z.coerce.date(),
  currentOdometer: z.coerce.number().int().min(0).default(0),
});

export async function GET() {
  const motorcycles = await prisma.motorcycle.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(motorcycles);
}

export async function POST(req: NextRequest) {
  try {
    const data = motorcycleSchema.parse(await req.json());
    const motorcycle = await prisma.motorcycle.create({ data });
    return NextResponse.json(motorcycle, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
