"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import TMLAsciiLogo from "@/components/landing/ascii-logo";

const steps = [
  {
    titleKey: "howItWorks.contractor.title" as const,
    descKey: "howItWorks.contractor.description" as const,
    icon: "1",
  },
  {
    titleKey: "howItWorks.auditor.title" as const,
    descKey: "howItWorks.auditor.description" as const,
    icon: "2",
  },
  {
    titleKey: "howItWorks.citizen.title" as const,
    descKey: "howItWorks.citizen.description" as const,
    icon: "3",
  },
];

const stats = [
  { valueKey: "stats.projects" as const, labelKey: "stats.projectsLabel" as const },
  { valueKey: "stats.verification" as const, labelKey: "stats.verificationLabel" as const },
  { valueKey: "stats.citizens" as const, labelKey: "stats.citizensLabel" as const },
  { valueKey: "stats.fraud" as const, labelKey: "stats.fraudLabel" as const },
];

export default function LandingPage() {
  const t = useTranslations("landing");
  const router = useRouter();
  const [hash, setHash] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handleVerify() {
    if (hash.trim()) {
      router.push(`/verify?hash=${encodeURIComponent(hash.trim())}`);
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#05080f] pt-8 pb-16 text-white">
        <div className="container mx-auto px-4">
          <TMLAsciiLogo reducedMotion={prefersReducedMotion} />
          <div className="text-center mt-10">
            <Badge className="mb-6 bg-[#2d8a4e] text-white hover:bg-[#2d8a4e]/90">
              {t("hero.badge")}
            </Badge>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
              {t("hero.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#1e3a5f]">
            {t("howItWorks.title")}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.icon} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2d8a4e] text-lg font-bold text-white">
                    {step.icon}
                  </div>
                  <CardTitle className="mt-4">{t(step.titleKey)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t(step.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Trust Metrics */}
      <section className="bg-[#1e3a5f] py-16">
        <div className="container mx-auto grid grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.labelKey} className="text-center text-white">
              <div className="text-3xl font-bold">{t(stat.valueKey)}</div>
              <div className="mt-1 text-sm text-white/70">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* CTA — Verify Certificate */}
      <section className="py-20">
        <div className="container mx-auto max-w-xl px-4 text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#1e3a5f]">
            {t("cta.title")}
          </h2>
          <p className="mb-8 text-muted-foreground">{t("cta.subtitle")}</p>
          <div className="flex gap-2">
            <Input
              placeholder={t("cta.placeholder")}
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <Button onClick={handleVerify} className="bg-[#2d8a4e] hover:bg-[#2d8a4e]/90">
              {t("cta.button")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
