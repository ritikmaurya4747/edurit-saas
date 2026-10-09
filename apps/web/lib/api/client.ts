// Browser-side API client. Calls the same-origin BFF proxy (/api/proxy/*),
// which attaches the httpOnly session token and forwards to the Nest API.
// Responses use the API envelope { success, data, meta?, message }.

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const buildQuery = (params?: QueryParams) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

async function request<T = unknown>(
  method: string,
  path: string,
  options: { params?: QueryParams; body?: unknown } = {},
): Promise<{ data: T; meta?: PageMeta; message?: string }> {
  const url = `/api/proxy/${path.replace(/^\/+/, "")}${buildQuery(options.params)}`;
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }

  if (!res.ok || json?.success === false) {
    const message =
      (Array.isArray(json?.message) ? json.message[0] : json?.message) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json?.errors ?? []);
  }

  return { data: json?.data as T, meta: json?.meta, message: json?.message };
}

export const api = {
  get: <T>(path: string, params?: QueryParams) => request<T>("GET", path, { params }).then((r) => r.data),
  page: <T>(path: string, params?: QueryParams) =>
    request<T[]>("GET", path, { params }).then(
      (r): Paginated<T> => ({
        data: r.data ?? [],
        meta: r.meta ?? { total: r.data?.length ?? 0, page: 1, limit: r.data?.length ?? 0, totalPages: 1 },
      }),
    ),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body: body ?? {} }).then((r) => r.data),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body: body ?? {} }).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body: body ?? {} }).then((r) => r.data),
  delete: <T>(path: string) => request<T>("DELETE", path).then((r) => r.data),
};
