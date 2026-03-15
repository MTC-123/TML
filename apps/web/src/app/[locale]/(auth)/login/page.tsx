"use client";

import { useTranslations } from "next-intl";
import { Fingerprint, Smartphone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginButton } from "@/components/auth/login-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function LoginPage() {
  const t = useTranslations("auth.login");

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Saharan Modernism branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[60%] relative gradient-mesh zellige-pattern overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16">
          {/* TML Brand */}
          <h1 className="font-[family-name:var(--font-display)] text-6xl xl:text-7xl font-bold text-[#d4a017] tracking-wide animate-fade-up">
            TML
          </h1>

          {/* Gold Diamond Separator */}
          <div className="my-6 text-[#d4a017] text-2xl animate-fade-up stagger-1">
            &#9670;
          </div>

          {/* Tagline */}
          <p className="font-[family-name:var(--font-display)] text-2xl xl:text-3xl italic text-white/90 text-center animate-fade-up stagger-2">
            {t("tagline")}
          </p>

          {/* Subtitle */}
          <p className="mt-4 font-[family-name:var(--font-body)] text-base xl:text-lg text-white/60 text-center max-w-md animate-fade-up stagger-3">
            {t("brandSubtitle")}
          </p>

          {/* Feature Bullets */}
          <div className="mt-16 space-y-4 animate-fade-up stagger-4">
            {(["cnie", "clearance", "attestation"] as const).map((key) => (
              <div
                key={key}
                className="flex items-center gap-3 text-white/70"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#d4a017] shrink-0" />
                <span className="font-[family-name:var(--font-body)] text-sm tracking-wide">
                  {t(`features.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex w-full lg:w-[40%] flex-col justify-center items-center bg-[#faf7f2] px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile-only TML logo */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold text-[#1e3a5f]">
              TML
            </h1>
            <div className="gold-line-animated mt-2" />
          </div>

          {/* Heading */}
          <div className="text-center mb-10">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[#0a1628]">
              {t("title")}
            </h2>
            <p className="mt-3 font-[family-name:var(--font-body)] text-sm text-[#0a1628]/60">
              {t("subtitle")}
            </p>
            <div className="gold-line-animated mt-4" />
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3 stagger-2 animate-fade-up">
            {/* Primary: Mon e-ID */}
            <LoginButton />

            {/* USSD — disabled */}
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 border-[#1e3a5f]/20 text-[#1e3a5f]/50 bg-white hover:bg-white cursor-not-allowed"
              disabled
            >
              <Smartphone className="h-4 w-4" />
              {t("ussdButton")}
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6 animate-fade-up stagger-3">
            <div className="flex-1 h-px bg-[#0a1628]/10" />
            <span className="text-xs font-[family-name:var(--font-body)] text-[#0a1628]/40 uppercase tracking-widest">
              {t("or")}
            </span>
            <div className="flex-1 h-px bg-[#0a1628]/10" />
          </div>

          {/* Digital ID option */}
          <div className="animate-fade-up stagger-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 border-[#d4a017]/30 text-[#0a1628] bg-white hover:bg-[#d4a017]/5 hover:border-[#d4a017]/50 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-[#d4a017]" />
              {t("digitalIdButton")}
            </Button>
          </div>

          {/* Language Switcher */}
          <div className="flex justify-center mt-10 animate-fade-up stagger-4">
            <LanguageSwitcher />
          </div>

          {/* Legal text */}
          <p className="mt-8 text-center text-[10px] leading-relaxed text-[#0a1628]/40 font-[family-name:var(--font-body)] animate-fade-up stagger-5">
            {t("legal")}
          </p>
        </div>
      </div>
    </div>
  );
}
