"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import TMLAsciiLogo from "@/components/landing/ascii-logo";
import { LandingTourTrigger } from "@/components/shared/tour-trigger";
import {
  HardHat,
  ClipboardCheck,
  Users,
  Shield,
  Fingerprint,
  Users2,
  Search,
  ArrowDown,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const steps = [
  {
    titleKey: "howItWorks.contractor.title" as const,
    descKey: "howItWorks.contractor.description" as const,
    icon: HardHat,
    step: "01",
  },
  {
    titleKey: "howItWorks.auditor.title" as const,
    descKey: "howItWorks.auditor.description" as const,
    icon: ClipboardCheck,
    step: "02",
  },
  {
    titleKey: "howItWorks.citizen.title" as const,
    descKey: "howItWorks.citizen.description" as const,
    icon: Users,
    step: "03",
  },
];

const stats = [
  { valueKey: "stats.projects" as const, labelKey: "stats.projectsLabel" as const },
  { valueKey: "stats.verification" as const, labelKey: "stats.verificationLabel" as const },
  { valueKey: "stats.citizens" as const, labelKey: "stats.citizensLabel" as const },
  { valueKey: "stats.fraud" as const, labelKey: "stats.fraudLabel" as const },
];

const securityFeatures = [
  {
    titleKey: "security.ed25519.title" as const,
    descKey: "security.ed25519.description" as const,
    icon: Shield,
  },
  {
    titleKey: "security.cnie.title" as const,
    descKey: "security.cnie.description" as const,
    icon: Fingerprint,
  },
  {
    titleKey: "security.multiParty.title" as const,
    descKey: "security.multiParty.description" as const,
    icon: Users2,
  },
];

const partners = [
  "partners.tgr" as const,
  "partners.mosip" as const,
  "partners.w3c" as const,
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useInView(threshold = 0.15): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

function useAnimatedCounter(target: string, inView: boolean, duration = 1800): string {
  const [display, setDisplay] = useState(target);
  const numericPart = target.replace(/[^0-9.]/g, "");
  const suffix = target.replace(/[0-9.]/g, "");
  const numericValue = parseFloat(numericPart);

  useEffect(() => {
    if (!inView || isNaN(numericValue)) {
      setDisplay(target);
      return;
    }

    const startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numericValue * eased;

      if (numericPart.includes(".")) {
        setDisplay(current.toFixed(1) + suffix);
      } else {
        setDisplay(Math.floor(current).toLocaleString() + suffix);
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target, numericValue, numericPart, suffix, duration]);

  return display;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  const scrollToContent = useCallback(() => {
    document.getElementById("trust-metrics")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // In-view observers for each section
  const [statsRef, statsInView] = useInView(0.2);
  const [stepsRef, stepsInView] = useInView(0.15);
  const [securityRef, securityInView] = useInView(0.15);
  const [ctaRef, ctaInView] = useInView(0.2);

  const animClass = (base: string, stagger?: number) => {
    if (prefersReducedMotion) return base;
    return `${base} animate-fade-up${stagger ? ` stagger-${stagger}` : ""}`;
  };

  return (
    <div className={prefersReducedMotion ? "reduce-motion" : ""} style={{ fontFamily: "var(--font-body)" }}>

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ════════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-mesh grain-overlay"
        aria-label="Hero"
      >
        {/* Floating zellige decorative shapes */}
        {!prefersReducedMotion && (
          <>
            {/* Top-left octagon */}
            <div
              className="absolute top-[12%] left-[8%] w-16 h-16 md:w-24 md:h-24 float-slow opacity-[0.06] pointer-events-none"
              style={{
                clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                background: "#d4a017",
              }}
              aria-hidden="true"
            />
            {/* Top-right diamond */}
            <div
              className="absolute top-[18%] right-[10%] w-12 h-12 md:w-20 md:h-20 float-medium opacity-[0.05] pointer-events-none"
              style={{
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                background: "#d4a017",
                animationDelay: "1s",
              }}
              aria-hidden="true"
            />
            {/* Bottom-left star */}
            <div
              className="absolute bottom-[20%] left-[15%] w-10 h-10 md:w-16 md:h-16 float-medium opacity-[0.04] pointer-events-none"
              style={{
                clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                background: "#d4a017",
                animationDelay: "2s",
              }}
              aria-hidden="true"
            />
            {/* Bottom-right hexagon */}
            <div
              className="absolute bottom-[15%] right-[12%] w-14 h-14 md:w-20 md:h-20 float-slow opacity-[0.05] pointer-events-none"
              style={{
                clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                background: "#d4a017",
                animationDelay: "3s",
              }}
              aria-hidden="true"
            />
          </>
        )}

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-8">
          {/* ASCII Logo */}
          <TMLAsciiLogo reducedMotion={prefersReducedMotion} />

          {/* Hero Text */}
          <div className="text-center mt-10 md:mt-14">
            <h1
              className={`mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.1] ${!prefersReducedMotion ? "text-reveal" : ""}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("hero.title")}
            </h1>

            <p
              className={`mx-auto mt-6 md:mt-8 max-w-xl text-base sm:text-lg text-white/60 leading-relaxed ${!prefersReducedMotion ? "animate-fade-up stagger-3" : ""}`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              {t("hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 ${!prefersReducedMotion ? "animate-fade-up stagger-4" : ""}`}
            >
              <button
                onClick={() => document.getElementById("verify-section")?.scrollIntoView({ behavior: "smooth" })}
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 bg-[#10b981] text-white font-semibold rounded-lg transition-all duration-300 hover:bg-[#0d9668] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] pulse-glow"
                aria-label={t("cta.button")}
              >
                <Shield className="w-4 h-4" />
                {t("cta.button")}
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={scrollToContent}
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 text-white/80 font-medium rounded-lg transition-all duration-300 hover:border-white/40 hover:text-white hover:bg-white/5"
              >
                {t("hero.learnMore")}
                <ArrowDown className="w-4 h-4" />
              </button>

              <LandingTourTrigger />
            </div>
          </div>
        </div>

        {/* Animated gold separator line */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <div className={!prefersReducedMotion ? "gold-line-animated" : ""} style={{ width: 120, height: 2, background: "linear-gradient(90deg, transparent, #d4a017, transparent)" }} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — TRUST METRICS
          ════════════════════════════════════════════════════════════ */}
      <section
        id="trust-metrics"
        ref={statsRef as React.RefObject<HTMLElement>}
        className="bg-[#faf7f2] py-20 md:py-24"
        aria-label="Trust metrics"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <StatCard
                key={stat.labelKey}
                value={t(stat.valueKey)}
                label={t(stat.labelKey)}
                inView={statsInView}
                stagger={i + 1}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={stepsRef as React.RefObject<HTMLElement>}
        className="py-20 md:py-28 bg-white"
        aria-label="How it works"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0a1628] ${stepsInView && !prefersReducedMotion ? "animate-fade-up" : ""}`}
              style={{ fontFamily: "var(--font-display)", opacity: prefersReducedMotion || stepsInView ? 1 : 0 }}
            >
              {t("howItWorks.title")}
            </h2>
            <div className="gold-line-animated mt-6" style={prefersReducedMotion ? { width: 120, opacity: 1 } : {}} />
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line (desktop only) */}
            <div
              className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-[2px]"
              style={{ background: "linear-gradient(90deg, rgba(212,160,23,0.15), #d4a017, rgba(212,160,23,0.15))" }}
              aria-hidden="true"
            />

            {steps.map((step, i) => {
              const Icon = step.icon;
              const visible = stepsInView || prefersReducedMotion;
              return (
                <article
                  key={step.step}
                  className={`relative bg-white rounded-xl p-8 text-center card-hover border border-[#e8e4de] ${visible && !prefersReducedMotion ? `animate-fade-up stagger-${i + 1}` : ""}`}
                  style={{ opacity: visible ? 1 : 0 }}
                >
                  {/* Step number */}
                  <div
                    className="text-5xl font-bold text-[#d4a017]/30 mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {step.step}
                  </div>

                  {/* Icon circle */}
                  <div className="mx-auto w-14 h-14 rounded-full bg-[#0a1628] flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-[#d4a017]" />
                  </div>

                  <h3
                    className="text-xl font-semibold text-[#0a1628] mb-3"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-[#4a5568] leading-relaxed text-sm">
                    {t(step.descKey)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 4 — SECURITY FEATURES
          ════════════════════════════════════════════════════════════ */}
      <section
        ref={securityRef as React.RefObject<HTMLElement>}
        className="relative py-20 md:py-28 bg-[#0a1628] zellige-pattern grain-overlay overflow-hidden"
        aria-label="Security features"
      >
        <div className="relative z-10 container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-white ${securityInView && !prefersReducedMotion ? "animate-fade-up" : ""}`}
              style={{ fontFamily: "var(--font-display)", opacity: prefersReducedMotion || securityInView ? 1 : 0 }}
            >
              {t("security.title")}
            </h2>
            <p
              className={`mt-4 text-white/50 max-w-xl mx-auto ${securityInView && !prefersReducedMotion ? "animate-fade-up stagger-1" : ""}`}
              style={{ opacity: prefersReducedMotion || securityInView ? 1 : 0 }}
            >
              {t("security.subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {securityFeatures.map((feature, i) => {
              const Icon = feature.icon;
              const visible = securityInView || prefersReducedMotion;
              return (
                <article
                  key={feature.titleKey}
                  className={`rounded-xl p-8 bg-[#0f1f35] security-glow shimmer ${visible && !prefersReducedMotion ? `animate-fade-up stagger-${i + 2}` : ""}`}
                  style={{ opacity: visible ? 1 : 0 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-[#d4a017]/10 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-[#d4a017]" />
                  </div>
                  <h3
                    className="text-xl font-semibold text-white mb-3"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {t(feature.descKey)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 5 — VERIFY CERTIFICATE CTA
          ════════════════════════════════════════════════════════════ */}
      <section
        id="verify-section"
        ref={ctaRef as React.RefObject<HTMLElement>}
        className="py-20 md:py-28 bg-[#faf7f2]"
        aria-label="Verify a certificate"
      >
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0a1628] mb-4 ${ctaInView && !prefersReducedMotion ? "animate-fade-up" : ""}`}
            style={{ fontFamily: "var(--font-display)", opacity: prefersReducedMotion || ctaInView ? 1 : 0 }}
          >
            {t("cta.title")}
          </h2>
          <p
            className={`text-[#4a5568] mb-10 ${ctaInView && !prefersReducedMotion ? "animate-fade-up stagger-1" : ""}`}
            style={{ opacity: prefersReducedMotion || ctaInView ? 1 : 0 }}
          >
            {t("cta.subtitle")}
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-3 ${ctaInView && !prefersReducedMotion ? "animate-fade-up stagger-2" : ""}`}
            style={{ opacity: prefersReducedMotion || ctaInView ? 1 : 0 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
              <input
                type="text"
                placeholder={t("cta.placeholder")}
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-[#d1d5db] bg-white text-[#0a1628] placeholder:text-[#9ca3af] transition-all duration-300 emerald-focus text-sm"
                aria-label={t("cta.placeholder")}
              />
            </div>
            <button
              onClick={handleVerify}
              className="px-8 py-3.5 bg-[#10b981] text-white font-semibold rounded-lg transition-all duration-300 hover:bg-[#0d9668] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {t("cta.button")}
            </button>
          </div>

          <p className="mt-4 text-xs text-[#9ca3af]">
            {t("cta.helpText")}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 6 — PARTNERS / POWERED BY
          ════════════════════════════════════════════════════════════ */}
      <section
        className="py-12 bg-[#0a1628] border-t border-[#1e3a5f]/30"
        aria-label="Technology partners"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {partners.map((partnerKey) => (
              <div
                key={partnerKey}
                className="flex items-center gap-3 text-white/30 text-sm tracking-wide uppercase"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#d4a017]/50" aria-hidden="true" />
                {t(partnerKey)}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  value,
  label,
  inView,
  stagger,
  prefersReducedMotion,
}: {
  value: string;
  label: string;
  inView: boolean;
  stagger: number;
  prefersReducedMotion: boolean;
}) {
  const animatedValue = useAnimatedCounter(value, inView);
  const visible = inView || prefersReducedMotion;

  return (
    <div
      className={`text-center ${visible && !prefersReducedMotion ? `animate-fade-up stagger-${stagger}` : ""}`}
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Gold top border */}
      <div className="w-12 h-[2px] bg-[#d4a017] mx-auto mb-6" aria-hidden="true" />
      <div
        className="text-4xl sm:text-5xl font-bold text-[#0a1628] mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {prefersReducedMotion ? value : animatedValue}
      </div>
      <div className="text-sm text-[#6b7280] uppercase tracking-wider font-medium">
        {label}
      </div>
    </div>
  );
}
