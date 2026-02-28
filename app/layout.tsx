import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const baseUrl = "https://himanga.fun";

// ── Monetag Zone IDs ──────────────────────────────────────────────────────────
// NEXT_PUBLIC_MONETAG_GLOBAL_ZONE_ID → fires on ALL pages (add new zone in Monetag dashboard)
// NEXT_PUBLIC_MONETAG_ZONE_ID        → fires on chapter pages only (via sidebar)
const globalZoneId = process.env.NEXT_PUBLIC_MONETAG_GLOBAL_ZONE_ID;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "HiManga - Read Manga Online | Level Up Your Manga Experience",
    template: "%s | HiManga",
  },
  description:
    "Discover and read your favorite manga with a beautiful, anime-inspired interface. Thousands of manga titles, infinite scroll, and community discussions.",
  keywords: [
    "manga",
    "manga reader",
    "anime",
    "read manga online",
    "manga community",
    "One Piece",
    "Solo Leveling",
    "Kaiju No 8",
    "Naruto",
    "Bleach",
    "Attack on Titan",
    "Demon Slayer",
    "Hentai manga",
  ],
  authors: [{ name: "HiManga" }],
  creator: "HiManga",
  publisher: "HiManga",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "HiManga",
    title: "HiManga - Read Manga Online | Level Up Your Manga Experience",
    description:
      "Discover and read your favorite manga with a beautiful, anime-inspired interface. Thousands of manga titles, infinite scroll, and community discussions.",
    images: [
      {
        url: "https://himanga.fun/Og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HiManga - Manga Reader",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@himanga",
    creator: "@himanga",
    title: "HiManga - Read Manga Online | Level Up Your Manga Experience",
    description:
      "Discover and read your favorite manga with a beautiful, anime-inspired interface",
    images: {
      url: "https://himanga.fun/Og-image.jpg",
      alt: "HiManga - Manga Reader",
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <head>
        {/* ── Monetag Global In-Page Push — fires on ALL pages ── */}
        {globalZoneId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(s){s.dataset.zone='10662299',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`,
            }}
/>
        )}

        {/* Explicit meta tags for WhatsApp */}
        <meta property="og:image" content="https://himanga.fun/Og-image.jpg" />
        <meta
          property="og:image:secure_url"
          content="https://himanga.fun/Og-image.jpg"
        />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="HiManga - Manga Reader" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "HiManga",
              description:
                "Read manga online with a beautiful interface and anime inspired design.",
              url: baseUrl,
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
              },
            }),
          }}
        />

        {/* Buy Me a Coffee Widget */}
        <script
          data-name="BMC-Widget"
          data-cfasync="false"
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-id="luffysfan"
          data-description="Support me on Buy me a coffee!"
          data-message="Buy me a coffee, Your support motivates me."
          data-color="#BD5FFF"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden w-full max-w-[100vw]">
        <AuthProvider>
          <NotificationsProvider>
            <div className="overflow-x-hidden w-full">{children}</div>
            <Analytics />
            <SpeedInsights />
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}