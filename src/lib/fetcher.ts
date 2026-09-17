export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? "Error al cargar datos", res.status);
  }
  return res.json();
}

export async function apiRequest<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error ?? "Error en la solicitud", res.status);
  }
  return res.json();
}
