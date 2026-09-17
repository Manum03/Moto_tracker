"use client";

import { useState, FormEvent } from "react";
import useSWR from "swr";
import { useMotorcycle } from "@/lib/use-motorcycle";
import { fetcher, apiRequest, ApiError } from "@/lib/fetcher";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SemaphoreBadge } from "@/components/ui/Badge";
import { getMaintenanceStatus, formatMaintenanceRemaining } from "@/lib/alerts";
import { formatDate } from "@/lib/date-utils";
import { ALL_MAINTENANCE_TYPES, MAINTENANCE_LABELS } from "@/lib/maintenance-rules";
import type { MaintenanceLog, MaintenanceType } from "@prisma/client";

interface RuleView {
  id: string | null;
  type: MaintenanceType;
  intervalKm: number | null;
  intervalDays: number | null;
  lastDoneKm: number | null;
  lastDoneDate: string | null;
}

export default function MaintenancePage() {
  const [tab, setTab] = useState<"status" | "history">("status");
  const { motorcycle } = useMotorcycle();

  const { data: rules, mutate: mutateRules } = useSWR<RuleView[]>(
    motorcycle ? `/api/maintenance/rules?motorcycleId=${motorcycle.id}` : null,
    fetcher
  );
  const { data: logs, mutate: mutateLogs } = useSWR<MaintenanceLog[]>(
    motorcycle ? `/api/maintenance/logs?motorcycleId=${motorcycle.id}` : null,
    fetcher
  );

  const [form, setForm] = useState({
    type: "OIL_CHANGE" as MaintenanceType,
    date: "",
    km: "",
    cost: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!motorcycle) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/maintenance/logs", "POST", { motorcycleId: motorcycle.id, ...form });
      setForm({ type: "OIL_CHANGE", date: "", km: "", cost: "", notes: "" });
      await Promise.all([mutateLogs(), mutateRules()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLog(id: string) {
    await apiRequest(`/api/maintenance/logs/${id}`, "DELETE");
    await mutateLogs();
  }

  if (!motorcycle) {
    return <p className="text-sm text-zinc-500">Registra primero tu motocicleta en la pestaña Vehículo.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Mantenimiento preventivo</h1>

      <div className="flex rounded-xl bg-zinc-100 p-1 text-sm font-medium">
        <button
          className={`flex-1 rounded-lg py-2 ${tab === "status" ? "bg-white shadow-sm" : "text-zinc-500"}`}
          onClick={() => setTab("status")}
        >
          Estado
        </button>
        <button
          className={`flex-1 rounded-lg py-2 ${tab === "history" ? "bg-white shadow-sm" : "text-zinc-500"}`}
          onClick={() => setTab("history")}
        >
          Historial
        </button>
      </div>

      {tab === "status" && (
        <Card>
          <CardTitle>Semáforo por tipo</CardTitle>
          <ul className="flex flex-col gap-2">
            {rules?.map((rule) => {
              const status = getMaintenanceStatus(
                { ...rule, lastDoneDate: rule.lastDoneDate ? new Date(rule.lastDoneDate) : null },
                motorcycle.currentOdometer,
                new Date(motorcycle.purchaseDate)
              );
              return (
                <li key={rule.type} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5">
                  <div>
                    <p className="text-sm font-medium">{MAINTENANCE_LABELS[rule.type]}</p>
                    <p className="text-xs text-zinc-500">{formatMaintenanceRemaining(status)}</p>
                  </div>
                  <SemaphoreBadge level={status.level}>
                    {status.level === "green" ? "OK" : status.level.toUpperCase()}
                  </SemaphoreBadge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {tab === "history" && (
        <>
          <Card>
            <CardTitle>Registrar mantenimiento</CardTitle>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="Tipo">
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}
                >
                  {ALL_MAINTENANCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {MAINTENANCE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fecha">
                <Input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Kilometraje">
                <Input
                  required
                  type="number"
                  min={0}
                  value={form.km}
                  onChange={(e) => setForm({ ...form, km: e.target.value })}
                />
              </Field>
              <Field label="Costo (opcional)">
                <Input
                  type="number"
                  min={0}
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </Field>
              <Field label="Notas (opcional)">
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Historial</CardTitle>
            <ul className="flex flex-col gap-2">
              {logs?.length === 0 && <p className="text-sm text-zinc-500">Sin registros aún.</p>}
              {logs?.map((log) => (
                <li key={log.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5">
                  <div>
                    <p className="text-sm font-medium">{MAINTENANCE_LABELS[log.type]}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(log.date)} · {log.km.toLocaleString("es-CO")} km
                      {log.cost ? ` · $${log.cost.toLocaleString("es-CO")}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-xs font-medium text-red-600"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
