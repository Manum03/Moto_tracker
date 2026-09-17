"use client";

import { useState, FormEvent } from "react";
import useSWR from "swr";
import { useMotorcycle } from "@/lib/use-motorcycle";
import { fetcher, apiRequest, ApiError } from "@/lib/fetcher";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SemaphoreBadge } from "@/components/ui/Badge";
import { getDocumentStatus } from "@/lib/alerts";
import { formatDate } from "@/lib/date-utils";
import type { Document, DocumentType } from "@prisma/client";

const LABELS: Record<DocumentType, string> = { SOAT: "SOAT", RTM: "Revisión Técnico-Mecánica (RTM)" };

export default function DocumentsPage() {
  const { motorcycle } = useMotorcycle();
  const { data: documents, mutate } = useSWR<Document[]>(
    motorcycle ? `/api/documents?motorcycleId=${motorcycle.id}` : null,
    fetcher
  );

  const [form, setForm] = useState({ type: "SOAT" as DocumentType, number: "", expiryDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!motorcycle) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/documents", "POST", { motorcycleId: motorcycle.id, ...form });
      setForm({ type: "SOAT", number: "", expiryDate: "" });
      await mutate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!motorcycle) {
    return <p className="text-sm text-zinc-500">Registra primero tu motocicleta en la pestaña Vehículo.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Documentos legales</h1>

      <Card>
        <CardTitle>Registrar SOAT / RTM</CardTitle>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Tipo de documento">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}>
              <option value="SOAT">SOAT</option>
              <option value="RTM">Revisión Técnico-Mecánica (RTM)</option>
            </Select>
          </Field>
          <Field label="Número (opcional)">
            <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          </Field>
          <Field label="Fecha de vencimiento">
            <Input
              required
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Vigencia</CardTitle>
        <ul className="flex flex-col gap-2">
          {documents?.length === 0 && <p className="text-sm text-zinc-500">Sin documentos registrados.</p>}
          {documents?.map((doc) => {
            const status = getDocumentStatus({ expiryDate: new Date(doc.expiryDate) });
            return (
              <li key={doc.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2.5">
                <div>
                  <p className="text-sm font-medium">{LABELS[doc.type]}</p>
                  <p className="text-xs text-zinc-500">
                    Vence: {formatDate(doc.expiryDate)}
                    {doc.number ? ` · ${doc.number}` : ""}
                  </p>
                </div>
                <SemaphoreBadge level={status.level}>
                  {status.daysLeft < 0 ? "Vencido" : `${status.daysLeft} d`}
                </SemaphoreBadge>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
