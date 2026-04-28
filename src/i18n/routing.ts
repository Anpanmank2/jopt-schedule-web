import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ja", "en", "ko"],
  defaultLocale: "ja",
  // /ja prefix は不要、/en /ko のみ prefix
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
