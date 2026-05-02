import Image from "next/image";
import { useTranslations } from "next-intl";
import { EVENT_CONFIG } from "@/config/eventConfig";

export default function Footer() {
  const t = useTranslations("header");
  return (
    <footer className="mt-auto border-t border-border-default bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 flex items-center justify-between gap-6">
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
        <p className="text-[10px] md:text-xs text-text-muted text-right">
          © {EVENT_CONFIG.copyrightYear} {EVENT_CONFIG.organizer}
        </p>
      </div>
    </footer>
  );
}
