"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const localeLabels: Record<string, string> = {
  fr: "Français",
  ar: "العربية",
  amz: "ⵜⴰⵎⴰⵣⵉⵖⵜ",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function onLocaleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale as "fr" | "ar" | "amz" });
  }

  return (
    <div data-testid="language-switcher">
      <Select value={locale} onValueChange={onLocaleChange}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {routing.locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {localeLabels[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
