"use client";

import { useRouter } from "@/i18n/navigation";
import { useAuthStore, type AuthUser } from "@/store/auth-store";
import { ClientOnly } from "@/components/client-only";
import { Reveal } from "@/components/reveal";
import { Shield, HardHat, Eye, Users, ArrowLeft, ArrowRight, Fingerprint } from "lucide-react";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────── */
/*  Demo actor profiles                                           */
/* ────────────────────────────────────────────────────────────── */
const actors: {
  role: string;
  apiRole: string;
  label: string;
  description: string;
  icon: typeof HardHat;
  iconTone: string;
  iconColor: string;
  user: AuthUser;
}[] = [
  {
    role: "inspector",
    apiRole: "contractor_engineer",
    label: "Inspector",
    description:
      "Field inspector verifying construction milestones on-site with GPS-backed attestations.",
    icon: HardHat,
    iconTone: "bg-warning/10",
    iconColor: "text-warning",
    user: {
      id: "demo-inspector-001",
      did: "did:tml:ma:CNIE:AB123456",
      roles: ["inspector"],
    },
  },
  {
    role: "auditor",
    apiRole: "independent_auditor",
    label: "Auditor",
    description:
      "Financial auditor reviewing payment clearance certificates and cross-checking quorum results.",
    icon: Eye,
    iconTone: "bg-primary/10",
    iconColor: "text-primary",
    user: {
      id: "demo-auditor-001",
      did: "did:tml:ma:CNIE:CD789012",
      roles: ["auditor"],
    },
  },
  {
    role: "citizen",
    apiRole: "citizen",
    label: "Citizen",
    description:
      "Community member participating in quorum attestations and filing disputes when needed.",
    icon: Users,
    iconTone: "bg-accent/10",
    iconColor: "text-accent",
    user: {
      id: "demo-citizen-001",
      did: "did:tml:ma:CNIE:EF345678",
      roles: ["citizen"],
    },
  },
];

/* ────────────────────────────────────────────────────────────── */
/*  Login page                                                    */
/* ────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  function handleSelect(actor: (typeof actors)[number]) {
    login({
      user: actor.user,
      accessToken: `demo-token-${actor.role}-${Date.now()}`,
      refreshToken: `demo-refresh-${actor.role}-${Date.now()}`,
    });
    // Also set localStorage keys for API client compatibility
    localStorage.setItem("tml_access_token", `demo-token-${actor.role}-${Date.now()}`);
    localStorage.setItem("tml_refresh_token", `demo-refresh-${actor.role}-${Date.now()}`);
    router.push("/dashboard" as any);
  }

  return (
    <ClientOnly fallback={<div className="min-h-screen bg-background" />}>
    <div className="min-h-screen bg-background flex flex-col">

      {/* Back nav */}
      <div className="container mx-auto px-4 pt-6">
        <Reveal animation="fade-in">
          <Link
            href={"/" as any}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </Reveal>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <Reveal animation="fade-up">
            <div className="text-center mb-14">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-6 shadow">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
                Choose your role
              </h1>
              <p className="mt-4 text-muted-foreground max-w-md mx-auto text-[15px] leading-relaxed">
                Select a demo actor to explore the TML dashboard. Each role has a
                unique view of infrastructure projects and verification workflows.
              </p>
            </div>
          </Reveal>

          {/* Actor cards */}
          <div className="grid gap-5 sm:grid-cols-3">
            {actors.map((actor, i) => {
              const Icon = actor.icon;
              return (
                <Reveal key={actor.role} animation="fade-up" delay={i * 120}>
                  <button
                    onClick={() => handleSelect(actor)}
                    className="group relative flex w-full flex-col items-start rounded-2xl border border-border bg-card p-7 text-left transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30"
                  >
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-7 right-7 h-0.5 rounded-b-full bg-border transition-all group-hover:bg-primary/30" />

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${actor.iconTone} mb-6 transition-transform duration-300 group-hover:scale-110 ${actor.iconColor}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1.5 tracking-tight">
                      {actor.label}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {actor.description}
                    </p>

                    <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      Enter as {actor.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {/* DID note */}
          <Reveal animation="fade-in" delay={500}>
            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Fingerprint className="h-3.5 w-3.5" />
              <span>
                Demo accounts use sandboxed DIDs anchored to fictional CNIE
                numbers. No real data is stored.
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
    </ClientOnly>
  );
}
