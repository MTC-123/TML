"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useAuthStore } from "@/store/auth-store";
import { setTokenAccessor } from "@/lib/api/client";
import type { ActorRole } from "@tml/types";

interface AuthContextValue {
  user: { id: string; did: string; roles: ActorRole[] } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: ActorRole) => boolean;
  hasAnyRole: (roles: ActorRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, refreshToken, isLoading, clearAuth } =
    useAuthStore();

  useEffect(() => {
    setTokenAccessor({
      getAccessToken: () => useAuthStore.getState().accessToken,
      getRefreshToken: () => useAuthStore.getState().refreshToken,
      setTokens: (access, refresh) =>
        useAuthStore.getState().setAuth(useAuthStore.getState().user!, access, refresh),
      clearTokens: () => useAuthStore.getState().clearAuth(),
    });
  }, []);

  const isAuthenticated = !!accessToken && !!user;

  const hasRole = (role: ActorRole): boolean =>
    user?.roles.includes(role) ?? false;

  const hasAnyRole = (roles: ActorRole[]): boolean =>
    roles.some((role) => user?.roles.includes(role));

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, hasRole, hasAnyRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
