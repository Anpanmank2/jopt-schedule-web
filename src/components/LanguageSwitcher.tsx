"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const ORDER: Locale[] = ["ja", "en", "ko"];

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("language");
  const tHeader = useTranslations("header");

  return (
    <nav
      className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden"
      aria-label={tHeader("language_switcher_aria")}
    >
      {routing.locales.map((_, _idx) => null) /* keep type-check warning quiet */}
      {ORDER.map((l, i) => {
        const active = l === locale;
        const labelKey = l === "ko" ? "ko_beta" : l;
        return (
          <Link
            key={l}
            href={pathname}
            locale={l}
            replace
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={`px-2.5 py-1 text-[11px] md:text-xs font-semibold tabular-nums transition-colors no-underline ${
              active ? "bg-blue-900 text-white" : "text-blue-900 hover:bg-blue-50"
            } ${i > 0 ? "border-l border-blue-200" : ""}`}
          >
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
