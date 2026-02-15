"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth-store";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const { user, accessToken, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !accessToken)) {
      router.push("/login" as any);
    }
  }, [isLoading, user, accessToken, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-bold text-destructive">403 — Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have the required permissions to view this page.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
