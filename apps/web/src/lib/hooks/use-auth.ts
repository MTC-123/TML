"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  getLoginRedirectUrl,
  exchangeAuthCode,
  logout as logoutApi,
} from "@/lib/api/endpoints/auth";
import type { ActorRole } from "@tml/types";

export interface UseAuthReturn {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth state is still loading from storage */
  isLoading: boolean;
  /** The authenticated user, or null */
  user: { id: string; did: string; roles: ActorRole[] } | null;
  /** Initiate MOSIP login redirect */
  login: () => Promise<void>;
  /** Handle the OAuth callback with an authorization code */
  handleCallback: (code: string) => Promise<void>;
  /** Log the user out */
  logout: () => Promise<void>;
  /** Check if the user has a specific role */
  hasRole: (role: ActorRole) => boolean;
  /** Check if the user has any of the specified roles */
  hasAnyRole: (roles: ActorRole[]) => boolean;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const {
    user,
    accessToken,
    refreshToken,
    isLoading,
    setAuth,
    clearAuth,
  } = useAuthStore();

  const isAuthenticated = !!accessToken && !!user;

  const login = useCallback(async () => {
    const { redirectUrl } = await getLoginRedirectUrl();
    window.location.href = redirectUrl;
  }, []);

  const handleCallback = useCallback(
    async (code: string) => {
      const { tokens, user: authUser } = await exchangeAuthCode(code);
      setAuth(authUser, tokens.accessToken, tokens.refreshToken);
      router.replace("/dashboard");
    },
    [setAuth, router],
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch {
        // Server-side logout failed, still clear local state
      }
    }
    clearAuth();
    router.replace("/login");
  }, [refreshToken, clearAuth, router]);

  const hasRole = useCallback(
    (role: ActorRole): boolean => {
      return user?.roles.includes(role) ?? false;
    },
    [user],
  );

  const hasAnyRole = useCallback(
    (roles: ActorRole[]): boolean => {
      return roles.some((role) => user?.roles.includes(role)) ?? false;
    },
    [user],
  );

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    handleCallback,
    logout,
    hasRole,
    hasAnyRole,
  };
}
