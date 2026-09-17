"use client";

import useSWR from "swr";
import { fetcher } from "./fetcher";
import type { Motorcycle } from "@prisma/client";

/** La app está pensada para una sola moto activa: se usa siempre la primera registrada. */
export function useMotorcycle() {
  const { data, error, isLoading, mutate } = useSWR<Motorcycle[]>("/api/motorcycles", fetcher);

  return {
    motorcycle: data?.[0] ?? null,
    motorcycles: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
