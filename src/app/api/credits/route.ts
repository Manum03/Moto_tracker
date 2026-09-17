import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { addMonths } from "@/lib/date-utils";

const creditSchema = z.object({
  motorcycleId: z.string().min(1),
  totalAmount: z.coerce.number().positive(),
  installmentsCount: z.coerce.number().int().positive(),
  installmentAmount: z.coerce.number().positive(),
  cutoffDay: z.coerce.number().int().min(1).max(28),
  startDate: z.coerce.date(),
});

export async function GET(req: NextRequest) {
  const motorcycleId = req.nextUrl.searchParams.get("motorcycleId") ?? undefined;
  const credits = await prisma.credit.findMany({
    where: motorcycleId ? { motorcycleId } : undefined,
    include: { installments: { orderBy: { number: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(credits);
}

/** Crea el crédito y genera automáticamente todas sus cuotas mensuales según el día de corte. */
export async function POST(req: NextRequest) {
  try {
    const data = creditSchema.parse(await req.json());

    let firstDueDate = new Date(
      Date.UTC(data.startDate.getUTCFullYear(), data.startDate.getUTCMonth(), data.cutoffDay)
    );
    if (firstDueDate < data.startDate) {
      firstDueDate = addMonths(firstDueDate, 1);
    }

    const installments = Array.from({ length: data.installmentsCount }, (_, i) => ({
      number: i + 1,
      dueDate: addMonths(firstDueDate, i),
      amount: data.installmentAmount,
    }));

    const credit = await prisma.credit.create({
      data: { ...data, installments: { create: installments } },
      include: { installments: { orderBy: { number: "asc" } } },
    });

    return NextResponse.json(credit, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return jsonError("id es requerido");
  await prisma.credit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
