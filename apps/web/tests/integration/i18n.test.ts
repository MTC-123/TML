import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const localesDir = path.resolve(__dirname, "../../public/locales");

const EXPECTED_LOCALES = ["en", "fr", "ar", "tzm"];
const EXPECTED_NAMESPACES = [
  "common.json",
  "auth.json",
  "projects.json",
  "attestations.json",
  "public.json",
];

describe("i18n locale files", () => {
  it("has all four locale directories", () => {
    for (const locale of EXPECTED_LOCALES) {
      const dir = path.join(localesDir, locale);
      expect(fs.existsSync(dir), `Missing locale directory: ${locale}`).toBe(
        true,
      );
    }
  });

  it("has all namespace files in every locale", () => {
    for (const locale of EXPECTED_LOCALES) {
      for (const ns of EXPECTED_NAMESPACES) {
        const file = path.join(localesDir, locale, ns);
        expect(
          fs.existsSync(file),
          `Missing ${ns} in ${locale}`,
        ).toBe(true);
      }
    }
  });

  it("all JSON files are valid JSON", () => {
    for (const locale of EXPECTED_LOCALES) {
      for (const ns of EXPECTED_NAMESPACES) {
        const file = path.join(localesDir, locale, ns);
        const content = fs.readFileSync(file, "utf-8");
        expect(() => JSON.parse(content)).not.toThrow();
      }
    }
  });

  it("common.json has English in language section for all locales", () => {
    for (const locale of EXPECTED_LOCALES) {
      const file = path.join(localesDir, locale, "common.json");
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      expect(
        data.language.en,
        `Missing language.en in ${locale}/common.json`,
      ).toBe("English");
    }
  });

  it("French is the structure reference — all locales have matching top-level keys", () => {
    const frCommon = JSON.parse(
      fs.readFileSync(path.join(localesDir, "fr", "common.json"), "utf-8"),
    );
    const frKeys = Object.keys(frCommon).sort();

    for (const locale of EXPECTED_LOCALES) {
      if (locale === "fr") continue;
      const data = JSON.parse(
        fs.readFileSync(path.join(localesDir, locale, "common.json"), "utf-8"),
      );
      const keys = Object.keys(data).sort();
      expect(keys, `${locale}/common.json top-level keys mismatch`).toEqual(
        frKeys,
      );
    }
  });

  it("Arabic is marked as RTL in config", async () => {
    const { isRtlLocale } = await import("@/i18n/config");
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("fr")).toBe(false);
    expect(isRtlLocale("en")).toBe(false);
  });
});
