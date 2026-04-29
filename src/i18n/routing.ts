import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ja", "en", "ko"],
  defaultLocale: "ja",
  // /ja prefix は不要、/en /ko のみ prefix
  localePrefix: "as-needed",
  // Accept-Language 自動判定を off (Owner 指示 2026-04-29):
  // URL prefix のない `/` は常に default locale (ja) を返す。
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
