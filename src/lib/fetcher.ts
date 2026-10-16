export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  error?: string;
  extra?: unknown;
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers:
      options?.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json", ...options?.headers }
        : options?.headers,
    ...options,
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.ok) {
    throw new Error(
      payload?.error || `Request failed with status ${res.status}`
    );
  }
  return payload.data;
}

export function apiPost<T>(url: string, body: unknown) {
  return apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T>(url: string, body: unknown) {
  return apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiDelete<T>(url: string) {
  return apiFetch<T>(url, { method: "DELETE" });
}
