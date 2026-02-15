"use client";

import { useState, useEffect, type ReactNode } from "react";

/**
 * Defers rendering children until after client-side hydration.
 * This prevents React hydration mismatch warnings caused by
 * browser extensions (e.g. Bitdefender's `bis_skin_checked`)
 * that inject attributes into DOM elements between SSR and hydration.
 */
export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
