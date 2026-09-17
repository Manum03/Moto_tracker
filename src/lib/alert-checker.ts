import { prisma } from "./db";
import { getDocumentStatus, getMaintenanceStatus, getInstallmentStatus, formatMaintenanceRemaining } from "./alerts";
import { dispatchNotification } from "./notifications";
import { NotificationLevel } from "./notifications/types";
import { MAINTENANCE_LABELS } from "./maintenance-rules";
import { AlertType, AlertLevel, Prisma } from "@prisma/client";

interface PendingAlert {
  type: AlertType;
  refId: string;
  level: NotificationLevel;
  title: string;
  body: string;
  dueDate: Date;
}

async function alreadyNotified(type: AlertType, refId: string, level: NotificationLevel) {
  const existing = await prisma.notificationLog.findUnique({
    where: { type_refId_level: { type, refId, level: level.toUpperCase() as AlertLevel } },
  });
  return existing != null;
}

async function fire(alert: PendingAlert) {
  if (await alreadyNotified(alert.type, alert.refId, alert.level)) return false;

  await dispatchNotification({ title: alert.title, body: alert.body, level: alert.level });

  try {
    await prisma.notificationLog.create({
      data: {
        type: alert.type,
        refId: alert.refId,
        level: alert.level.toUpperCase() as AlertLevel,
        message: alert.body,
        dueDate: alert.dueDate,
      },
    });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) {
      throw err;
    }
  }
  return true;
}

/** Documentos: aviso a 15 días (amarillo) y a 3 días o vencido (rojo). */
async function checkDocuments(): Promise<number> {
  const documents = await prisma.document.findMany({ include: { motorcycle: true } });
  let sent = 0;
  for (const doc of documents) {
    const { daysLeft } = getDocumentStatus(doc);
    const label = doc.type === "SOAT" ? "SOAT" : "Revisión Técnico-Mecánica (RTM)";
    const plate = doc.motorcycle.plate;

    if (daysLeft <= 3) {
      const body =
        daysLeft < 0
          ? `${label} de ${plate} venció hace ${Math.abs(daysLeft)} día(s).`
          : `${label} de ${plate} vence en ${daysLeft} día(s).`;
      if (await fire({ type: "DOCUMENT", refId: doc.id, level: "red", title: `${label} por vencer`, body, dueDate: doc.expiryDate })) sent++;
    } else if (daysLeft <= 15) {
      const body = `${label} de ${plate} vence en ${daysLeft} día(s).`;
      if (await fire({ type: "DOCUMENT", refId: doc.id, level: "yellow", title: `${label} por vencer`, body, dueDate: doc.expiryDate })) sent++;
    }
  }
  return sent;
}

/** Mantenimiento: aviso cuando entra en amarillo o en rojo según km/fecha. */
async function checkMaintenance(): Promise<number> {
  const rules = await prisma.maintenanceRule.findMany({ include: { motorcycle: true } });
  let sent = 0;
  for (const rule of rules) {
    const status = getMaintenanceStatus(rule, rule.motorcycle.currentOdometer, rule.motorcycle.purchaseDate);
    if (status.level === "green") continue;

    const label = MAINTENANCE_LABELS[rule.type];
    const plate = rule.motorcycle.plate;
    const body = `${label} de ${plate}: ${formatMaintenanceRemaining(status)}.`;
    const dueDate = status.dueByDate ?? new Date();

    if (
      await fire({
        type: "MAINTENANCE",
        refId: rule.id,
        level: status.level as NotificationLevel,
        title: `Mantenimiento: ${label}`,
        body,
        dueDate,
      })
    )
      sent++;
  }
  return sent;
}

/** Cuotas de crédito: aviso exactamente desde 2 días antes del vencimiento. */
async function checkInstallments(): Promise<number> {
  const installments = await prisma.installment.findMany({
    where: { paid: false },
    include: { credit: { include: { motorcycle: true } } },
  });
  let sent = 0;
  for (const inst of installments) {
    const { daysLeft } = getInstallmentStatus(inst);
    if (daysLeft > 2) continue;

    const plate = inst.credit.motorcycle.plate;
    const body =
      daysLeft < 0
        ? `Cuota #${inst.number} del crédito de ${plate} está vencida (${Math.abs(daysLeft)} día(s)).`
        : `Cuota #${inst.number} del crédito de ${plate} vence en ${daysLeft} día(s) (valor: ${inst.amount}).`;

    if (
      await fire({
        type: "CREDIT",
        refId: inst.id,
        level: "red",
        title: "Cuota de crédito por vencer",
        body,
        dueDate: inst.dueDate,
      })
    )
      sent++;
  }
  return sent;
}

export async function runAlertCheck(): Promise<{ documents: number; maintenance: number; credit: number }> {
  const [documents, maintenance, credit] = [
    await checkDocuments(),
    await checkMaintenance(),
    await checkInstallments(),
  ];
  return { documents, maintenance, credit };
}
