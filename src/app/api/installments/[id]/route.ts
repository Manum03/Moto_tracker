import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

const patchSchema = z.object({
  paid: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { paid } = patchSchema.parse(await req.json());
    const installment = await prisma.installment.update({
      where: { id },
      data: { paid, paidAt: paid ? new Date() : null },
    });
    return NextResponse.json(installment);
  } catch (err) {
    return handleApiError(err);
  }
}
