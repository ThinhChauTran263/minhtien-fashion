import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Providers } from "@/components/providers";
import { CompareBar } from "@/components/compare/compare-bar";
import { AnalyticsLoader } from "@/components/analytics/analytics-loader";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { TawkChat } from "@/components/chat/tawk-chat";
import { PageTransition } from "@/components/page-transition";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin", "vietnamese"], display: "swap", variable: "--font-display" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Minh Tien Fashion - Menswear Essentials",
    template: "%s | Minh Tien Fashion",
  },
  description: "Premium menswear essentials: polo, shirts, t-shirts and sweatshirts with refined materials and modern fit.",
  keywords: ["ao nam", "polo nam", "t-shirt nam", "so mi nam", "thoi trang nam", "minh tien fashion"],
  authors: [{ name: "Minh Tien Fashion" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "Minh Tien Fashion",
    title: "Minh Tien Fashion - Menswear Essentials",
    description: "Premium menswear essentials with refined materials and modern fit.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minh Tien Fashion - Menswear Essentials",
    description: "Premium menswear essentials with refined materials and modern fit.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Minh Tien",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Minh Tien Fashion",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    sameAs: [],
  };

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-surface-secondary font-sans text-primary-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <Header />
            <main className="relative z-0 min-h-screen pb-mobile-nav md:pb-0">
              <PageTransition>{children}</PageTransition>
            </main>
            <CompareBar />
            <Footer />
            <BottomNav />
            <AnalyticsLoader />
            <ServiceWorkerRegister />
            <TawkChat />
          </Providers>
        </NextIntlClientProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </body>
    </html>
  );
}

