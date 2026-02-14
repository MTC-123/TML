import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function getAllFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  function walk(d: string) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(d, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, .next, tests
        if (
          entry.name === "node_modules" ||
          entry.name === ".next" ||
          entry.name === "tests"
        )
          continue;
        walk(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

describe("Branding compliance", () => {
  const srcDir = path.resolve(__dirname, "../../src");
  const files = getAllFiles(srcDir, [".ts", ".tsx", ".json"]);

  const forbiddenPatterns = [
    /\bClaude\b/i,
    /\bAnthropic\b/i,
    /\bAI assistant\b/i,
    /\bbuilt with AI\b/i,
    /\bpowered by AI\b/i,
  ];

  const forbiddenNames = [
    /\bTaha\b/,
    /\bChraibi\b/,
    /\bLina\b/,
    /\bBouyahyaoui\b/,
    /\bBenhayoun\b/,
    /\bHouda\b/,
    /\bChakiri\b/,
    /\bAl Akhawayn\b/,
  ];

  it("does not contain references to external tools or services", () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          violations.push(
            `${path.relative(srcDir, file)} matches ${pattern.source}`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not contain personal names", () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      for (const pattern of forbiddenNames) {
        if (pattern.test(content)) {
          violations.push(
            `${path.relative(srcDir, file)} matches ${pattern.source}`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
