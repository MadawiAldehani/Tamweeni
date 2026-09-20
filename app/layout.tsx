import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { LOCALE_COOKIE, dirFor, resolveLocale } from "@/lib/i18n/config";
import { LanguageProvider } from "@/lib/i18n/provider";
import { translate } from "@/lib/i18n/translate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  // No size-adjusted local fallback: it would cover Arabic glyphs before Plex Arabic gets the chance.
  adjustFontFallback: false,
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

async function currentLocale() {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

// Metadata follows the language cookie so Arabic users get an Arabic tab title and home-screen name.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const name = translate(locale, locale === "ar" ? "app.nameArabic" : "app.name");
  const description = translate(locale, "app.tagline");

  return {
    title: { default: name, template: `%s · ${name}` },
    description,
    applicationName: name,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: name },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/icons/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1F6F4A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The language cookie is read on the server so Arabic users get RTL on first paint.
  const locale = await currentLocale();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${inter.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
