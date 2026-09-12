import type { Metadata } from "next";
import { Geist, Noto_Sans_JP, Roboto_Condensed } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import { SITE_URL } from "@/lib/site";
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

// `metadataBase` is what turns the relative paths elsewhere in the metadata into
// the absolute URLs Open Graph requires; without it Next warns and emits a
// localhost origin into the tags.
//
// Deliberately absent: `openGraph.title` and `openGraph.description`. Next
// already derives both from whatever `title`/`description` the page itself
// resolved — a shared player link previews as that player. Setting them here
// would pin the home page's wording onto all 956 pages instead (verified in the
// rendered head: /players/118920 emits `og:title` "鈴木彩艶 | Premier Fan Data").
//
// Also deliberately absent: `alternates.canonical`. A canonical set on the root
// layout is inherited, so every page would declare itself a copy of "/".
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "プレミアリーグ 順位表・日本人選手データ | Premier Fan Data",
  description:
    "プレミアリーグの順位表・日程・全20クラブと全選手のデータを日本語で。プレミアで戦う日本人選手の出場時間とチーム内の序列も、日本時間で4時間ごとに更新しています。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "Premier Fan Data",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${notoSansJp.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
