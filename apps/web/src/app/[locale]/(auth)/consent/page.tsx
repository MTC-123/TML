"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  UserCheck,
  Scale,
  ArrowRight,
  Info,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const DATA_POINTS = [
  {
    key: "cnieHash",
    icon: KeyRound,
    iconBg: "bg-[#d4a017]/10",
    iconColor: "text-[#d4a017]",
  },
  {
    key: "authLevel",
    icon: Lock,
    iconBg: "bg-[#1e3a5f]/10",
    iconColor: "text-[#1e3a5f]",
  },
  {
    key: "roleAssignment",
    icon: UserCheck,
    iconBg: "bg-[#10b981]/10",
    iconColor: "text-[#10b981]",
  },
] as const;

const CONSENT_TOGGLE_IDS = ["identity", "attestation", "analytics"] as const;
const CONSENT_REQUIRED: Record<string, boolean> = { identity: true, attestation: false, analytics: false };

export default function ConsentPage() {
  const t = useTranslations("consent");
  const router = useRouter();
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const [consents, setConsents] = useState({
    identity: true,
    attestation: true,
    analytics: false,
  });

  const handleAccept = () => {
    window.location.href = "/api/v1/auth/login";
  };

  const handleDecline = () => {
    router.push("/");
  };

  const toggleConsent = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2] zellige-pattern px-4 py-12">
      <div className="w-full max-w-xl animate-fade-up">
        <Card className="overflow-hidden border-0 shadow-lg shadow-[#0a1628]/5 rounded-xl">
          {/* Gold top border */}
          <div className="h-[3px] bg-gradient-to-r from-transparent via-[#d4a017] to-transparent" />

          <CardHeader className="text-center pt-10 pb-6 px-8">
            {/* Shield icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f] animate-fade-up">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>

            <CardTitle className="font-[family-name:var(--font-display)] text-2xl text-[#0a1628] animate-fade-up stagger-1">
              {t("title")}
            </CardTitle>
            <CardDescription className="mt-2 font-[family-name:var(--font-body)] text-[#0a1628]/50 animate-fade-up stagger-2">
              {t("description")}
            </CardDescription>

            {/* Gold accent line */}
            <div className="gold-line-animated mt-4" />
          </CardHeader>

          <CardContent className="space-y-6 px-8">
            {/* Data Points */}
            <div className="animate-fade-up stagger-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1e3a5f]/60 font-[family-name:var(--font-body)]">
                {t("dataShared")}
              </h3>
              <ul className="space-y-3">
                {DATA_POINTS.map(
                  ({ key, icon: Icon, iconBg, iconColor }, index) => (
                    <li
                      key={key}
                      className={`group flex items-start gap-4 rounded-lg border border-[#0a1628]/5 bg-[#faf7f2]/50 px-4 py-3.5 card-hover animate-fade-up stagger-${index + 2}`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0a1628] font-[family-name:var(--font-body)]">
                          {t(`data.${key}.label`)}
                        </p>
                        <p className="text-xs text-[#0a1628]/50 mt-0.5 font-[family-name:var(--font-body)]">
                          {t(`data.${key}.description`)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-1 shrink-0 text-[#0a1628]/20 hover:text-[#0a1628]/50 transition-colors"
                        aria-label={`More info about ${t(`data.${key}.label`)}`}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Privacy Notice */}
            <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-5 py-4 animate-fade-up stagger-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Scale className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 font-[family-name:var(--font-body)]">
                    {t("privacyNotice.title")}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-amber-700/80 font-[family-name:var(--font-body)]">
                    {t("privacyNotice.body")}
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-amber-800 font-[family-name:var(--font-body)]">
                    {t("privacyNotice.law")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPolicyExpanded(!policyExpanded)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                  >
                    <span>{t("readFullPolicy")}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${policyExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                  {policyExpanded && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs leading-relaxed text-amber-700/70 font-[family-name:var(--font-body)]">
                      {t("fullPolicyText")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consent Toggles */}
            <div className="space-y-3 animate-fade-up stagger-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#1e3a5f]/60 font-[family-name:var(--font-body)]">
                {t("consentPreferences")}
              </h3>
              {CONSENT_TOGGLE_IDS.map((id) => {
                const required = CONSENT_REQUIRED[id];
                return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border border-[#0a1628]/5 bg-white px-4 py-3"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#0a1628] font-[family-name:var(--font-body)]">
                        {t(`toggles.${id}.label`)}
                      </p>
                      {required && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#1e3a5f]/40 bg-[#1e3a5f]/5 px-1.5 py-0.5 rounded">
                          {t("required")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#0a1628]/45 mt-0.5 font-[family-name:var(--font-body)]">
                      {t(`toggles.${id}.description`)}
                    </p>
                  </div>
                  <Switch
                    checked={consents[id as keyof typeof consents]}
                    onCheckedChange={() =>
                      !required && toggleConsent(id)
                    }
                    disabled={required}
                    className={required ? "opacity-50" : ""}
                    aria-label={t(`toggles.${id}.label`)}
                  />
                </div>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 sm:flex-row px-8 pb-8 pt-4 animate-fade-up stagger-5">
            <Button
              variant="outline"
              className="w-full sm:w-1/2 border-[#0a1628]/10 text-[#0a1628]/60 hover:text-[#0a1628] hover:bg-[#0a1628]/5 transition-colors"
              onClick={handleDecline}
            >
              {t("decline")}
            </Button>
            <Button
              className="w-full sm:w-1/2 bg-[#10b981] text-white hover:bg-[#0d9668] gap-2 transition-colors"
              onClick={handleAccept}
            >
              {t("accept")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
