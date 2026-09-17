"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useMotorcycle } from "@/lib/use-motorcycle";
import { fetcher, apiRequest, ApiError } from "@/lib/fetcher";
import { Card, CardTitle } from "@/components/ui/Card";
import { SemaphoreBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SemaphoreLevel } from "@/lib/alerts";
import type { AlertItem } from "@/app/api/dashboard/summary/route";

interface Summary {
  overall: SemaphoreLevel;
  documentsLevel: SemaphoreLevel;
  maintenanceLevel: SemaphoreLevel;
  creditLevel: SemaphoreLevel;
  alerts: AlertItem[];
}

const LEVEL_TEXT: Record<SemaphoreLevel, string> = {
  green: "Al día",
  yellow: "Atención pronto",
  red: "Urgente",
};

export default function DashboardPage() {
  const { motorcycle, isLoading: loadingMoto, mutate: mutateMoto } = useMotorcycle();
  const { data: summary, isLoading: loadingSummary, mutate: mutateSummary } = useSWR<Summary>(
    motorcycle ? `/api/dashboard/summary?motorcycleId=${motorcycle.id}` : null,
    fetcher
  );

  const [km, setKm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOdometerSubmit(e: FormEvent) {
    e.preventDefault();
    if (!motorcycle) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/motorcycles/${motorcycle.id}/odometer`, "POST", { km });
      setKm("");
      await Promise.all([mutateMoto(), mutateSummary()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loadingMoto) return <p className="text-sm text-zinc-500">Cargando…</p>;

  if (!motorcycle) {
    return (
      <Card>
        <CardTitle>Bienvenido</CardTitle>
        <p className="mb-4 text-sm text-zinc-600">
          Aún no has registrado tu motocicleta. Empieza por su perfil.
        </p>
        <Link href="/vehicle">
          <Button>Registrar motocicleta</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">
          {motorcycle.brand} {motorcycle.model}
        </h1>
        <p className="text-sm text-zinc-500">{motorcycle.plate}</p>
      </div>

      {summary && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">Estado general</p>
            <p className="text-lg font-semibold">{LEVEL_TEXT[summary.overall]}</p>
          </div>
          <SemaphoreBadge level={summary.overall}>{summary.overall.toUpperCase()}</SemaphoreBadge>
        </Card>
      )}

      <Card>
        <CardTitle>Odómetro virtual</CardTitle>
        <form onSubmit={handleOdometerSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="number"
              inputMode="numeric"
              min={motorcycle.currentOdometer}
              placeholder={`Actual: ${motorcycle.currentOdometer.toLocaleString("es-CO")} km`}
              value={km}
              onChange={(e) => setKm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "…" : "Actualizar"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/documents">
          <Card className="text-center">
            <p className="text-xs text-zinc-500">Documentos</p>
            {summary && (
              <div className="mt-2 flex justify-center">
                <SemaphoreBadge level={summary.documentsLevel}>
                  {summary.documentsLevel === "green" ? "OK" : summary.documentsLevel.toUpperCase()}
                </SemaphoreBadge>
              </div>
            )}
          </Card>
        </Link>
        <Link href="/maintenance">
          <Card className="text-center">
            <p className="text-xs text-zinc-500">Mantenimiento</p>
            {summary && (
              <div className="mt-2 flex justify-center">
                <SemaphoreBadge level={summary.maintenanceLevel}>
                  {summary.maintenanceLevel === "green" ? "OK" : summary.maintenanceLevel.toUpperCase()}
                </SemaphoreBadge>
              </div>
            )}
          </Card>
        </Link>
        <Link href="/credit">
          <Card className="text-center">
            <p className="text-xs text-zinc-500">Crédito</p>
            {summary && (
              <div className="mt-2 flex justify-center">
                <SemaphoreBadge level={summary.creditLevel}>
                  {summary.creditLevel === "green" ? "OK" : summary.creditLevel.toUpperCase()}
                </SemaphoreBadge>
              </div>
            )}
          </Card>
        </Link>
      </div>

      <Card>
        <CardTitle>Próximas alertas</CardTitle>
        {loadingSummary && <p className="text-sm text-zinc-500">Cargando…</p>}
        {summary && summary.alerts.length === 0 && (
          <p className="text-sm text-zinc-500">Sin alertas pendientes. Todo al día 🎉</p>
        )}
        <ul className="flex flex-col gap-2">
          {summary?.alerts.map((alert, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 p-2.5">
              <div>
                <p className="text-sm font-medium">{alert.label}</p>
                <p className="text-xs text-zinc-500">{alert.detail}</p>
              </div>
              <SemaphoreBadge level={alert.level}>{alert.level.toUpperCase()}</SemaphoreBadge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
