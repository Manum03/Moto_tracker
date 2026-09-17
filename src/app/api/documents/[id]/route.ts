import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

const updateSchema = z.object({
  number: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = updateSchema.parse(await req.json());
    const document = await prisma.document.update({ where: { id }, data });

    // Al renovar la fecha de vencimiento, se limpian las alertas ya enviadas
    // para que puedan volver a dispararse en el próximo ciclo de vencimiento.
    if (data.expiryDate) {
      await prisma.notificationLog.deleteMany({ where: { type: "DOCUMENT", refId: id } });
    }

    return NextResponse.json(document);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
