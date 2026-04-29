import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ja", "en", "ko"],
  defaultLocale: "ja",
  // /ja prefix は不要、/en /ko のみ prefix
  localePrefix: "as-needed",
  // Accept-Language 自動判定を off (Owner 指示 2026-04-29):
  // URL prefix のない `/` は常に default locale (ja) を返す。
  localeDetection: false,
  // cookie 由来の自動判定も off (Owner 指示 2026-04-29):
  // 一度 EN/KOR にしたユーザーが `/` に戻ったとき cookie で別 locale に解決される
  // 動作を防ぐ。LanguageSwitcher は <Link> ベースで URL 直接遷移するため cookie 不要。
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
