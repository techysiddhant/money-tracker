export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ListResponse<T> {
  data: T[];
}

export async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error || "Something went wrong");
  }
  return res.json() as Promise<T>;
}

export async function mutateApi<T = unknown>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error || "Something went wrong");
  }
  return res.json() as Promise<T>;
}
