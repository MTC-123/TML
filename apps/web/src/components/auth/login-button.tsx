"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";

export function LoginButton() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleLogin} disabled={loading} size="lg" className="w-full">
      {loading ? "Redirecting..." : "Continue with Mon e-ID"}
    </Button>
  );
}
