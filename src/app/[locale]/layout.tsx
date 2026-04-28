import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { EVENT_CONFIG } from "@/config/eventConfig";
import { routing } from "@/i18n/routing";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const tEvent = await getTranslations({ locale, namespace: "event_meta" });
  return {
    title: `${EVENT_CONFIG.organizer} ${EVENT_CONFIG.year} (JOPT) | Grand Final Schedule`,
    description: t("description", {
      organizer: EVENT_CONFIG.organizer,
      year: EVENT_CONFIG.year,
      dateRangeVenue: tEvent("date_range_venue"),
    }),
  };
}

export const viewport: Viewport = {
  themeColor: "#1A4B8C",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={notoSansJP.className}>
      <body className="flex flex-col min-h-dvh">
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
