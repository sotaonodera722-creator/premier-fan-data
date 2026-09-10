import type { Metadata } from "next";
import { Geist, Noto_Sans_JP, Roboto_Condensed } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// The site's main language had no typeface at all: Geist and Rajdhani are both
// latin-only, so every Japanese character fell through to whatever the device
// supplied — 游ゴシック on Windows, ヒラギノ on iOS, Noto on Android. The same
// page had a different face on every device, and 游ゴシック's bold is thin
// enough that headings never read as headings.
//
// `subsets` only decides what gets preloaded, so no japanese subset is declared
// (the family doesn't offer one) and the Japanese chunks load on demand.
const notoSansJp = Noto_Sans_JP({
  variable: "--font-ja",
  subsets: ["latin"],
  weight: "variable",
});

// Replaces Rajdhani, which carries no OpenType features at all — `tabular-nums`
// was silently doing nothing, so the figures never lined up. Of the faces that
// can align digits, this is the one that moves the existing layout least:
// +4.1% average advance against Rajdhani, and identical widths across weights.
const robotoCondensed = Roboto_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Premier Fan Data",
  description: "プレミアリーグの順位表・チーム情報・選手データを日本語でまとめたデータベース。日本人選手の活躍もひと目で確認できます。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${notoSansJp.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <div className="pitch-lines fixed inset-0 -z-10 pointer-events-none" />
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
