"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function HomeLink() {
  const t = useTranslations("header");
  return (
    <a
      href="https://japanopenpoker.com/"
      aria-label={t("home_link_aria")}
      className="inline-flex items-center gap-1.5 md:gap-2 rounded-full border border-blue-200 bg-white/80 backdrop-blur shadow-sm px-2.5 py-1 text-[11px] md:text-xs font-semibold text-blue-900 hover:bg-blue-50 transition-colors no-underline"
    >
      <Image
        src="/jopt-logo.png"
        alt=""
        width={200}
        height={238}
        className="h-7 md:h-8 w-auto"
        priority={false}
      />
      <span>Top</span>
    </a>
  );
}
