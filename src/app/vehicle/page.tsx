"use client";

import { useState, FormEvent } from "react";
import { useMotorcycle } from "@/lib/use-motorcycle";
import { apiRequest, ApiError } from "@/lib/fetcher";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Motorcycle } from "@prisma/client";
import type { KeyedMutator } from "swr";

function toDateInput(date: string | Date | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function VehicleForm({
  motorcycle,
  mutate,
}: {
  motorcycle: Motorcycle | null;
  mutate: KeyedMutator<Motorcycle[]>;
}) {
  const [form, setForm] = useState({
    plate: motorcycle?.plate ?? "",
    brand: motorcycle?.brand ?? "",
    model: motorcycle?.model ?? "",
    displacementCc: motorcycle ? String(motorcycle.displacementCc) : "",
    purchaseDate: toDateInput(motorcycle?.purchaseDate),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (motorcycle) {
        await apiRequest(`/api/motorcycles/${motorcycle.id}`, "PUT", {
          plate: form.plate,
          brand: form.brand,
          model: form.model,
          displacementCc: form.displacementCc,
          purchaseDate: form.purchaseDate,
        });
      } else {
        await apiRequest("/api/motorcycles", "POST", form);
      }
      await mutate();
      setMessage({ type: "ok", text: "Datos guardados correctamente." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>{motorcycle ? "Editar datos" : "Registrar motocicleta"}</CardTitle>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Placa">
          <Input
            required
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
            placeholder="ABC12D"
          />
        </Field>
        <Field label="Marca">
          <Input
            required
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="Yamaha"
          />
        </Field>
        <Field label="Modelo">
          <Input
            required
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="FZ 2.0"
          />
        </Field>
        <Field label="Cilindraje (cc)">
          <Input
            required
            type="number"
            min={0}
            value={form.displacementCc}
            onChange={(e) => setForm({ ...form, displacementCc: e.target.value })}
            placeholder="150"
          />
        </Field>
        <Field label="Fecha de compra">
          <Input
            required
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />
        </Field>

        {message && (
          <p className={message.type === "ok" ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
            {message.text}
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Card>
  );
}

export default function VehiclePage() {
  const { motorcycle, isLoading, mutate } = useMotorcycle();

  if (isLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Perfil del vehículo</h1>

      <VehicleForm key={motorcycle?.id ?? "new"} motorcycle={motorcycle} mutate={mutate} />

      {motorcycle && (
        <Card>
          <CardTitle>Odómetro actual</CardTitle>
          <p className="text-2xl font-semibold">{motorcycle.currentOdometer.toLocaleString("es-CO")} km</p>
          <p className="mt-1 text-xs text-zinc-500">Actualízalo rápidamente desde el Inicio.</p>
        </Card>
      )}
    </div>
  );
}
