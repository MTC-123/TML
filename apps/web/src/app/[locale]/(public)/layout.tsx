"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SkipNavigation } from "@/components/shared/skip-navigation";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  ShieldCheck,
  Globe,
  Scale,
  FileCheck,
  ExternalLink,
} from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("public");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/" as const, label: t("nav.home") },
    { href: "/about" as const, label: t("nav.about") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SkipNavigation />
      {/* ═══ Premium Sticky Header ═══ */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e2ddd5]/60 bg-[#faf7f2]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#faf7f2]/60">
        <div className="gold-accent" />
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-3">
              <span
                className="text-2xl font-bold tracking-tight text-[#0a1628]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                TML
              </span>
              <span className="text-[#d4a017] text-xs">&#9670;</span>
              <span className="hidden text-xs font-medium uppercase tracking-[0.2em] text-[#64748b] sm:inline">
                {t("nav.tagline")}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative px-4 py-2 text-sm font-medium text-[#64748b] transition-colors duration-300 hover:text-[#0a1628]"
                  >
                    {link.label}
                    <span className="absolute inset-x-4 -bottom-px h-px origin-left scale-x-0 bg-[#d4a017] transition-transform duration-300 group-hover:scale-x-100" />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Verify Certificate CTA */}
            <Link
              href="/verify"
              className="hidden items-center gap-2 rounded-lg bg-[#10b981] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#059669] hover:shadow-md md:inline-flex"
            >
              <ShieldCheck className="h-4 w-4" />
              {t("nav.verify")}
            </Link>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#0a1628] transition-colors hover:bg-[#f0ebe3] md:hidden"
                  aria-label={t("nav.openMenu")}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-[#faf7f2] p-0">
                <SheetHeader className="border-b border-[#e2ddd5] px-6 py-5">
                  <SheetTitle
                    className="text-left text-xl font-bold text-[#0a1628]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    TML <span className="text-[#d4a017]">&#9670;</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className="rounded-lg px-4 py-3 text-sm font-medium text-[#0a1628] transition-colors hover:bg-[#f0ebe3]"
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/verify"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center gap-2 rounded-lg bg-[#10b981] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#059669]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t("nav.verify")}
                  </Link>
                  <div className="mt-4 border-t border-[#e2ddd5] pt-4">
                    <LanguageSwitcher />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main id="main-content" className="flex-1">{children}</main>

      {/* ═══ Rich Footer ═══ */}
      <footer role="contentinfo" className="relative border-t border-[#e2ddd5] bg-[#0a1628] zellige-pattern">
        {/* Morocco flag accent line */}
        <div className="flex h-1">
          <div className="flex-1 bg-[#c1272d]" />
          <div className="flex-1 bg-[#006233]" />
          <div className="flex-1 bg-[#c1272d]" />
        </div>

        <div className="container mx-auto px-4 py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="text-2xl font-bold text-[#faf7f2]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  TML
                </span>
                <span className="text-[#d4a017]">&#9670;</span>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-[#faf7f2]/60">
                {t("footer.description")}
              </p>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#d4a017]" />
                <span className="text-xs font-medium uppercase tracking-wider text-[#faf7f2]/40">
                  FR / AR / AMZ
                </span>
              </div>
            </div>

            {/* Platform Column */}
            <div>
              <h3
                className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#d4a017]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.15em" }}
              >
                {t("footer.platform")}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/verify"
                    className="group flex items-center gap-2 text-sm text-[#faf7f2]/60 transition-colors hover:text-[#10b981]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t("footer.verifyCertificate")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="group flex items-center gap-2 text-sm text-[#faf7f2]/60 transition-colors hover:text-[#10b981]"
                  >
                    <Scale className="h-3.5 w-3.5" />
                    {t("footer.aboutTml")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="group flex items-center gap-2 text-sm text-[#faf7f2]/60 transition-colors hover:text-[#10b981]"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    {t("footer.howItWorks")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* About Column */}
            <div>
              <h3
                className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#d4a017]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.15em" }}
              >
                {t("footer.aboutHeading")}
              </h3>
              <ul className="space-y-3">
                <li>
                  <span className="text-sm text-[#faf7f2]/60">
                    {t("footer.cnieBinding")}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-[#faf7f2]/60">
                    {t("footer.multiPartyAttestation")}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-[#faf7f2]/60">
                    {t("footer.tgrIntegration")}
                  </span>
                </li>
                <li>
                  <span className="text-sm text-[#faf7f2]/60">
                    {t("footer.ed25519Cryptography")}
                  </span>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3
                className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#d4a017]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.15em" }}
              >
                {t("footer.legal")}
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-1 text-sm text-[#faf7f2]/60 transition-colors hover:text-[#faf7f2]"
                  >
                    {t("footer.privacyPolicy")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-1 text-sm text-[#faf7f2]/60 transition-colors hover:text-[#faf7f2]"
                  >
                    {t("footer.termsOfService")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="flex items-center gap-1 text-sm text-[#faf7f2]/60 transition-colors hover:text-[#faf7f2]"
                  >
                    {t("footer.dataProtection")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 border-t border-[#1e3a5f] pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-xs text-[#faf7f2]/40">
                &copy; 2026 {t("footer.copyright")}
              </p>
              <p className="text-xs text-[#faf7f2]/30">
                {t("footer.tagline")}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
