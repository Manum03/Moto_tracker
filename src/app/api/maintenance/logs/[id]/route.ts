import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

const updateSchema = z.object({
  date: z.coerce.date().optional(),
  km: z.coerce.number().int().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = updateSchema.parse(await req.json());
    const log = await prisma.maintenanceLog.update({ where: { id }, data });
    return NextResponse.json(log);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.maintenanceLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
