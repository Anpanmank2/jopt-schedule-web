import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Japan Open Poker Tour 2026 (JOPT) | Grand Final Schedule",
  description:
    "Japan Open Poker Tour 2026 Grand Final のトーナメントスケジュール（2026-04-24〜05-06 / ベルサール高田馬場）",
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
