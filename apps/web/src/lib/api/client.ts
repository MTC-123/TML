import { API_URL } from "@/lib/config";

interface ApiOptions extends RequestInit {
  token?: string;
}

interface ApiError {
  code: string;
  message: string;
  statusCode: number;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("tml_refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("tml_access_token", data.accessToken);
    localStorage.setItem("tml_refresh_token", data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, ...init } = options;
  const accessToken = token ?? localStorage.getItem("tml_access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL()}${path}`, { ...init, headers });

  // Auto-refresh on 401
  if (res.status === 401 && accessToken) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL()}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      code: "UNKNOWN",
      message: res.statusText,
      statusCode: res.status,
    }));
    throw error;
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, opts?: ApiOptions) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: ApiOptions) =>
    request<T>(path, {
      ...opts,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, opts?: ApiOptions) =>
    request<T>(path, {
      ...opts,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, opts?: ApiOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
