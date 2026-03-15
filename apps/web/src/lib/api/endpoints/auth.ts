import { apiClient } from "../client";
import type { ActorRole } from "@tml/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  did: string;
  roles: ActorRole[];
}

export interface AuthCallbackResponse {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface AuthLoginResponse {
  redirectUrl: string;
}

// ─── API Functions ──────────────────────────────────────────────────────────

/**
 * Initiates MOSIP OIDC login by requesting the redirect URL from the backend.
 */
export async function getLoginRedirectUrl(): Promise<AuthLoginResponse> {
  return apiClient<AuthLoginResponse>("/auth/login");
}

/**
 * Exchanges the authorization code from MOSIP callback for JWT tokens.
 */
export async function exchangeAuthCode(
  code: string,
): Promise<AuthCallbackResponse> {
  return apiClient<AuthCallbackResponse>(
    `/auth/callback?code=${encodeURIComponent(code)}`,
  );
}

/**
 * Refreshes the access token using the stored refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthTokens> {
  return apiClient<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

/**
 * Invalidates the current session tokens on the server.
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient<void>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}
