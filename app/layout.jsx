import { Inter, Noto_Sans_JP } from "next/font/google";
import site from "@/data/site.json";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://kazuma-oki.github.io/portfolio-2026/"),
  title: {
    default: `${site.siteName} — Portfolio`,
    template: `%s | ${site.siteName}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.siteName} — Portfolio`,
    description: site.description,
    siteName: site.siteName,
    images: ["/images/hero.webp"],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  themeColor: "#f7f7f5",
};

export default function RootLayout({ children }) {
  return (
    // data-scroll-behavior は Next.js への合図。これが無いと、ページ遷移のたびに走る
    // 「先頭へ戻す」処理が globals.css の scroll-behavior: smooth に引きずられて
    // アニメーションしてしまう（＝画面が上に流れながら次のページが出る）
    <html
      lang="ja"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${noto.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          本文へスキップ
        </a>
        <Loader />
        <Header />
        <PageTransition>{children}</PageTransition>
        <Footer />
      </body>
    </html>
  );
}
