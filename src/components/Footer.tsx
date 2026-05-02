import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EVENT_CONFIG } from "@/config/eventConfig";

export default function Footer() {
  const t = useTranslations("header");
  const tRules = useTranslations("rules");
  return (
    <footer className="mt-auto border-t border-border-default bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 flex items-center justify-between gap-4">
        <a
          href="https://japanopenpoker.com/"
          aria-label={t("home_link_aria")}
          className="inline-block transition-opacity hover:opacity-80"
        >
          <Image
            src="/jopt-logo.png"
            alt={EVENT_CONFIG.organizer}
            width={200}
            height={238}
            className="h-20 md:h-28 w-auto"
            priority={false}
          />
        </a>
        <Link
          href="/rules"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 backdrop-blur shadow-sm px-2.5 py-1 text-[11px] md:text-xs font-semibold text-blue-900 hover:bg-blue-50 transition-colors no-underline"
        >
          {tRules("footer_link_label")}
        </Link>
        <p className="text-[10px] md:text-xs text-text-muted text-right">
          © {EVENT_CONFIG.copyrightYear} {EVENT_CONFIG.organizer}
        </p>
      </div>
    </footer>
  );
}
