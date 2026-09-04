export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only advertise a JSON body when we actually send one. A parameterless
  // POST/PATCH with `content-type: application/json` and an empty body makes
  // Fastify reject the request (empty JSON body), which broke actions like
  // "Simulate payment", Deactivate and Reactivate.
  const hasBody = init?.body !== undefined && init?.body !== null;
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let body: { error?: string; details?: unknown } | undefined;
    try {
      body = await res.json();
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, body?.error ?? res.statusText, body?.details);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
};
