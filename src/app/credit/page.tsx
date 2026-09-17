"use client";

import { useState, FormEvent } from "react";
import useSWR from "swr";
import { useMotorcycle } from "@/lib/use-motorcycle";
import { fetcher, apiRequest, ApiError } from "@/lib/fetcher";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SemaphoreBadge } from "@/components/ui/Badge";
import { getInstallmentStatus } from "@/lib/alerts";
import { formatDate } from "@/lib/date-utils";
import type { Credit, Installment } from "@prisma/client";

type CreditWithInstallments = Credit & { installments: Installment[] };

export default function CreditPage() {
  const { motorcycle } = useMotorcycle();
  const { data: credits, mutate } = useSWR<CreditWithInstallments[]>(
    motorcycle ? `/api/credits?motorcycleId=${motorcycle.id}` : null,
    fetcher
  );

  const [form, setForm] = useState({
    totalAmount: "",
    installmentsCount: "",
    installmentAmount: "",
    cutoffDay: "",
    startDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!motorcycle) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/credits", "POST", { motorcycleId: motorcycle.id, ...form });
      setForm({ totalAmount: "", installmentsCount: "", installmentAmount: "", cutoffDay: "", startDate: "" });
      await mutate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(installment: Installment) {
    await apiRequest(`/api/installments/${installment.id}`, "PATCH", { paid: !installment.paid });
    await mutate();
  }

  if (!motorcycle) {
    return <p className="text-sm text-zinc-500">Registra primero tu motocicleta en la pestaña Vehículo.</p>;
  }

  const activeCredit = credits?.[0];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Crédito de la moto</h1>

      {!activeCredit && (
        <Card>
          <CardTitle>Registrar crédito</CardTitle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Field label="Monto total">
              <Input
                required
                type="number"
                min={0}
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
              />
            </Field>
            <Field label="Número de cuotas">
              <Input
                required
                type="number"
                min={1}
                value={form.installmentsCount}
                onChange={(e) => setForm({ ...form, installmentsCount: e.target.value })}
              />
            </Field>
            <Field label="Valor de la cuota">
              <Input
                required
                type="number"
                min={0}
                value={form.installmentAmount}
                onChange={(e) => setForm({ ...form, installmentAmount: e.target.value })}
              />
            </Field>
            <Field label="Día de corte (1-28)">
              <Input
                required
                type="number"
                min={1}
                max={28}
                value={form.cutoffDay}
                onChange={(e) => setForm({ ...form, cutoffDay: e.target.value })}
              />
            </Field>
            <Field label="Fecha de inicio">
              <Input
                required
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar y generar cuotas"}
            </Button>
          </form>
        </Card>
      )}

      {activeCredit && (
        <>
          <Card>
            <CardTitle>Resumen</CardTitle>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-zinc-500">Monto total</dt>
              <dd className="text-right font-medium">${activeCredit.totalAmount.toLocaleString("es-CO")}</dd>
              <dt className="text-zinc-500">Cuotas</dt>
              <dd className="text-right font-medium">{activeCredit.installmentsCount}</dd>
              <dt className="text-zinc-500">Valor cuota</dt>
              <dd className="text-right font-medium">${activeCredit.installmentAmount.toLocaleString("es-CO")}</dd>
              <dt className="text-zinc-500">Día de corte</dt>
              <dd className="text-right font-medium">{activeCredit.cutoffDay}</dd>
            </dl>
          </Card>

          <Card>
            <CardTitle>Cuotas</CardTitle>
            <ul className="flex flex-col gap-2">
              {activeCredit.installments.map((inst) => {
                const status = getInstallmentStatus({ dueDate: new Date(inst.dueDate), paid: inst.paid });
                return (
                  <li key={inst.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={inst.paid}
                        onChange={() => togglePaid(inst)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium">Cuota #{inst.number}</p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(inst.dueDate)} · ${inst.amount.toLocaleString("es-CO")}
                        </p>
                      </div>
                    </div>
                    {!inst.paid && (
                      <SemaphoreBadge level={status.level}>
                        {status.daysLeft < 0 ? "Vencida" : `${status.daysLeft} d`}
                      </SemaphoreBadge>
                    )}
                    {inst.paid && <span className="text-xs text-emerald-600">Pagada</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
