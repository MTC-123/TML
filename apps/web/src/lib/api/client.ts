import { getEnv } from "@/lib/config";
import { API_BASE_PATH } from "@/lib/constants";
import { ApiError } from "./errors";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

interface TokenAccessor {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
}

let tokenAccessor: TokenAccessor | null = null;

export function setTokenAccessor(accessor: TokenAccessor): void {
  tokenAccessor = accessor;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const env = getEnv();
  const url = new URL(`${API_BASE_PATH}${path}`, env.NEXT_PUBLIC_API_URL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function refreshAccessToken(): Promise<string | null> {
  if (!tokenAccessor) return null;

  const refreshToken = tokenAccessor.getRefreshToken();
  if (!refreshToken) return null;

  const env = getEnv();
  const url = `${env.NEXT_PUBLIC_API_URL}${API_BASE_PATH}/auth/refresh`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAccessor.getAccessToken()}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenAccessor.clearTokens();
      return null;
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    tokenAccessor.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    tokenAccessor.clearTokens();
    return null;
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      message?: string;
      code?: string;
      details?: Record<string, unknown>;
    };
    return new ApiError(
      body.message ?? response.statusText,
      response.status,
      (body.code as ApiError["code"]) ?? "UNKNOWN_ERROR",
      body.details,
    );
  } catch {
    return new ApiError(
      response.statusText,
      response.status,
      "UNKNOWN_ERROR",
    );
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers: customHeaders, ...restOptions } = options;

  const headers = new Headers(customHeaders);

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = tokenAccessor?.getAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const url = buildUrl(path, params);

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0,
      "NETWORK_ERROR",
    );
  }

  // Auto-refresh on 401
  if (response.status === 401 && tokenAccessor?.getRefreshToken()) {
    // Deduplicate concurrent refresh attempts
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;

    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      try {
        response = await fetch(url, {
          ...restOptions,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } catch (error) {
        throw new ApiError(
          error instanceof Error ? error.message : "Network error",
          0,
          "NETWORK_ERROR",
        );
      }
    }
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "POST", body });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "PUT", body });
  },
  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(path, { ...options, method: "PATCH", body });
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

/** Callable API client used by endpoint files. */
export { request as apiClient };
