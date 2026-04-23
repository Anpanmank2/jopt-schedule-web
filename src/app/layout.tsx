import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { EVENT_CONFIG } from "@/config/eventConfig";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.organizer} ${EVENT_CONFIG.year} (JOPT) | Grand Final Schedule`,
  description: `${EVENT_CONFIG.organizer} ${EVENT_CONFIG.year} Grand Final のトーナメントスケジュール（${EVENT_CONFIG.dateRangeVenue}）`,
};

export const viewport: Viewport = {
  themeColor: "#1A4B8C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={notoSansJP.className}>
      <body className="flex flex-col min-h-dvh">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
