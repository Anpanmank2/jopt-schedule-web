import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import manifest from "@/data/rule-pdf-manifest.json";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const PDF_PATH = "/jopt-official-rule-2026.pdf";
const IMG_PATH = (n: number) => `/rule-pdfs/p${n}.png`;

export default async function RulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "rules" });

  const pages = manifest.pages ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-4 md:py-6">
      <nav className="mb-3 md:mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
        >
          {t("back_to_schedule")}
        </Link>
      </nav>

      <header className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-blue-900">
          {t("page_title")}
        </h1>
        <p className="mt-1 text-xs md:text-sm text-text-secondary leading-relaxed">
          {t("page_subtitle")}
        </p>
        <p className="mt-1 text-[11px] md:text-xs text-text-muted italic">
          {t("japanese_only_notice")}
        </p>
      </header>

      {pages > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <a
              href={PDF_PATH}
              download
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-900 text-white px-3 py-1.5 text-xs md:text-sm font-semibold shadow-sm hover:bg-blue-800 transition-colors no-underline"
            >
              {t("download_button")}
            </a>
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white text-blue-900 px-3 py-1.5 text-xs md:text-sm font-semibold shadow-sm hover:bg-blue-50 transition-colors no-underline"
            >
              {t("open_pdf_button")}
            </a>
          </div>

          <ol className="space-y-3 md:space-y-4 list-none p-0">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <li
                key={n}
                className="rounded-md overflow-hidden border border-border-default bg-white shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMG_PATH(n)}
                  alt={t("page_alt", { n, total: pages })}
                  loading={n <= 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="block w-full h-auto"
                />
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="rounded-md border border-blue-200 bg-blue-50/70 px-4 py-6 text-center">
          <p className="text-sm md:text-base font-semibold text-blue-900">
            {t("preparing_title")}
          </p>
          <p className="mt-1 text-xs md:text-sm text-text-secondary">
            {t("preparing_subtitle")}
          </p>
        </div>
      )}

      <nav className="mt-6 md:mt-8 pt-4 border-t border-border-default">
        <Link
          href="/"
          className="inline-flex items-center text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
        >
          {t("back_to_schedule")}
        </Link>
      </nav>
    </div>
  );
}
