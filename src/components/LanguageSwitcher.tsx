"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { routing, type Locale } from "@/i18n/routing";

const ORDER: Locale[] = ["ja", "en", "ko"];

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const t = useTranslations("language");
  const tHeader = useTranslations("header");
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;

    // 現在の path から locale prefix を取り除く
    const stripped = stripLocalePrefix(pathname);
    const target = next === routing.defaultLocale ? stripped : `/${next}${stripped}`;

    startTransition(() => {
      router.replace(target || "/");
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden"
      role="group"
      aria-label={tHeader("language_switcher_aria")}
    >
      {ORDER.map((l, i) => {
        const active = l === locale;
        const labelKey = l === "ko" ? "ko_beta" : l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            disabled={isPending}
            aria-pressed={active}
            className={`px-2.5 py-1 text-[11px] md:text-xs font-semibold tabular-nums transition-colors ${
              active
                ? "bg-blue-900 text-white"
                : "text-blue-900 hover:bg-blue-50"
            } ${i > 0 ? "border-l border-blue-200" : ""}`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function stripLocalePrefix(pathname: string): string {
  for (const l of routing.locales) {
    if (l === routing.defaultLocale) continue;
    if (pathname === `/${l}`) return "";
    if (pathname.startsWith(`/${l}/`)) return pathname.substring(`/${l}`.length);
  }
  return pathname;
}
