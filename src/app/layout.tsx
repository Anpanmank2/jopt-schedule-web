import type { Metadata, Viewport } from "next";
import { Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JOPT 2026 Grand Final — Schedule",
  description:
    "JOPT 2026 Grand Final トーナメントスケジュール（2026-04-24〜05-06 / ベルサール高田馬場）",
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
    <html lang="ja" className={notoSerifJP.className}>
      <body>{children}</body>
    </html>
  );
}
