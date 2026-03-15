import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/contexts/query-client-provider";
import { Toaster } from "sonner";
import { locales, isRtlLocale, type Locale } from "@/i18n/config";
import { LocaleHtmlAttributes } from "@/components/shared/locale-html-attributes";
import { SkipNavigation } from "@/components/shared/skip-navigation";
import { AccessibilityToggle } from "@/components/shared/accessibility-toggle";
import { OfflineIndicator } from "@/components/shared/offline-indicator";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = isRtlLocale(locale as Locale) ? "rtl" : "ltr";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
    >
      <QueryProvider>
        <NextIntlClientProvider messages={messages}>
          <LocaleHtmlAttributes lang={locale} dir={dir} />
          <SkipNavigation />
          <div className="fixed top-4 z-50" style={{ insetInlineEnd: '1rem' }}>
            <AccessibilityToggle />
          </div>
          {children}
          <OfflineIndicator />
          <Toaster position={dir === "rtl" ? "top-left" : "top-right"} richColors dir={dir} />
        </NextIntlClientProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
