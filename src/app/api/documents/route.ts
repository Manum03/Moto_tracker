import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

const documentSchema = z.object({
  motorcycleId: z.string().min(1),
  type: z.enum(["SOAT", "RTM"]),
  number: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date(),
});

export async function GET(req: NextRequest) {
  const motorcycleId = req.nextUrl.searchParams.get("motorcycleId") ?? undefined;
  const documents = await prisma.document.findMany({
    where: motorcycleId ? { motorcycleId } : undefined,
    orderBy: { expiryDate: "asc" },
  });
  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  try {
    const data = documentSchema.parse(await req.json());
    const document = await prisma.document.create({ data });
    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
