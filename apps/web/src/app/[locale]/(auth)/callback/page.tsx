"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/hooks/use-auth";

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const { handleCallback } = useAuth();
  const t = useTranslations("auth.login");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    const code = searchParams.get("code");
    if (code) {
      calledRef.current = true;
      handleCallback(code);
    }
  }, [searchParams, handleCallback]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    </div>
  );
}
