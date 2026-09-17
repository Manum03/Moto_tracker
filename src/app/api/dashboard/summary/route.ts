import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api-utils";
import {
  getDocumentStatus,
  getMaintenanceStatus,
  getInstallmentStatus,
  formatMaintenanceRemaining,
  worstLevel,
  SemaphoreLevel,
} from "@/lib/alerts";
import { MAINTENANCE_LABELS } from "@/lib/maintenance-rules";

export interface AlertItem {
  category: "document" | "maintenance" | "credit";
  label: string;
  level: SemaphoreLevel;
  detail: string;
}

export async function GET(req: NextRequest) {
  let motorcycleId = req.nextUrl.searchParams.get("motorcycleId");
  if (!motorcycleId) {
    const first = await prisma.motorcycle.findFirst({ orderBy: { createdAt: "asc" } });
    if (!first) return jsonError("No hay motocicletas registradas", 404);
    motorcycleId = first.id;
  }

  const motorcycle = await prisma.motorcycle.findUnique({ where: { id: motorcycleId } });
  if (!motorcycle) return jsonError("Motocicleta no encontrada", 404);

  const [documents, maintenanceRules, installments] = await Promise.all([
    prisma.document.findMany({ where: { motorcycleId } }),
    prisma.maintenanceRule.findMany({ where: { motorcycleId } }),
    prisma.installment.findMany({
      where: { paid: false, credit: { motorcycleId } },
      orderBy: { dueDate: "asc" },
      take: 1,
    }),
  ]);

  const alerts: AlertItem[] = [];

  const docLabels: Record<string, string> = { SOAT: "SOAT", RTM: "Revisión Técnico-Mecánica" };
  const documentLevels = documents.map((doc) => {
    const status = getDocumentStatus(doc);
    if (status.level !== "green") {
      alerts.push({
        category: "document",
        label: docLabels[doc.type],
        level: status.level,
        detail:
          status.daysLeft < 0
            ? `Vencido hace ${Math.abs(status.daysLeft)} día(s)`
            : `Vence en ${status.daysLeft} día(s)`,
      });
    }
    return status.level;
  });

  const maintenanceLevels = maintenanceRules.map((rule) => {
    const status = getMaintenanceStatus(rule, motorcycle.currentOdometer, motorcycle.purchaseDate);
    if (status.level !== "green") {
      alerts.push({
        category: "maintenance",
        label: MAINTENANCE_LABELS[rule.type],
        level: status.level,
        detail: formatMaintenanceRemaining(status),
      });
    }
    return status.level;
  });

  const nextInstallment = installments[0];
  let creditLevel: SemaphoreLevel = "green";
  if (nextInstallment) {
    const status = getInstallmentStatus(nextInstallment);
    creditLevel = status.level;
    if (status.level !== "green") {
      alerts.push({
        category: "credit",
        label: `Cuota #${nextInstallment.number}`,
        level: status.level,
        detail:
          status.daysLeft < 0
            ? `Vencida hace ${Math.abs(status.daysLeft)} día(s)`
            : `Vence en ${status.daysLeft} día(s)`,
      });
    }
  }

  const overall = worstLevel([...documentLevels, ...maintenanceLevels, creditLevel]);

  return NextResponse.json({
    motorcycle,
    overall,
    documentsLevel: worstLevel(documentLevels),
    maintenanceLevel: worstLevel(maintenanceLevels),
    creditLevel,
    alerts: alerts.sort((a, b) => (a.level === b.level ? 0 : a.level === "red" ? -1 : 1)),
  });
}
