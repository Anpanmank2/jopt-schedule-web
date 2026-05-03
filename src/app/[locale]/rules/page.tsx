import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { rulesContent, type RuleLocale } from "@/data/rules-content";
import RuleTOC from "@/components/rules/RuleTOC";
import RuleSectionCard from "@/components/rules/RuleSectionCard";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const PDF_PATH = "/jopt-official-rule-2026.pdf";

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

  const sections = rulesContent[locale as RuleLocale];

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-6">
      {/* top back nav */}
      <nav className="mb-3 md:mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs md:text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
        >
          {t("back_to_schedule")}
        </Link>
      </nav>

      {/* page header card */}
      <header className="rounded-md border border-border-default bg-white shadow-sm px-4 md:px-6 py-4 md:py-5 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-blue-900">
          {t("page_title")}
        </h1>
        <p className="mt-1 text-xs md:text-sm text-text-secondary leading-relaxed">
          {t("page_subtitle")}
        </p>
        <p className="mt-1.5 text-[11px] md:text-xs text-text-muted leading-relaxed">
          {t("translation_notice")}
        </p>
        <div className="mt-3 md:mt-4 flex flex-wrap gap-2">
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
      </header>

      {/* mobile/tablet TOC */}
      <div className="lg:hidden mb-4">
        <RuleTOC sections={sections} label={t("toc_label")} />
      </div>

      {/* desktop 2-column layout */}
      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <RuleTOC sections={sections} label={t("toc_label")} />
        </aside>

        <div className="space-y-4 md:space-y-5">
          {sections.map((section) => (
            <RuleSectionCard
              key={section.id}
              section={section}
              orderedListAriaLabel={t("contract_list_aria")}
              emailLinkAriaLabel={t("email_link_aria")}
            />
          ))}
        </div>
      </div>

      {/* bottom back nav */}
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
