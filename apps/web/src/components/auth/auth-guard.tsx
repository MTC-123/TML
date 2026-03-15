"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import type { ActorRole } from "@tml/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: ActorRole[];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuthStore();
  const isAuthenticated = !!accessToken && !!user;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) =>
        user?.roles.includes(role),
      );
      if (!hasRequiredRole) {
        return;
      }
    }
  }, [isAuthenticated, isLoading, requiredRoles, router, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div role="status" aria-live="polite">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (
    requiredRoles &&
    requiredRoles.length > 0 &&
    !requiredRoles.some((role) => user?.roles.includes(role))
  ) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">403 — Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
