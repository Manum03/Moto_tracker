import { NextRequest, NextResponse } from "next/server";
import { runAlertCheck } from "@/lib/alert-checker";
import { jsonError } from "@/lib/api-utils";

/**
 * Endpoint para disparar el chequeo de alertas desde un cron externo
 * (Vercel Cron, cron del SO, GitHub Actions, etc.) en vez del script
 * long-running de scripts/check-alerts.ts. Protegido con CRON_SECRET.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
    if (provided !== secret) return jsonError("No autorizado", 401);
  }

  const result = await runAlertCheck();
  return NextResponse.json({ ok: true, sent: result });
}

export const GET = handle;
export const POST = handle;
