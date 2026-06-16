import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

// Serif display for headings; clean sans for body. Exposed as CSS variables
// consumed by tailwind.config.ts (font-serif / font-sans).
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// TODO(domain): Replace with your production domain once live.
const SITE_URL = "https://bushido.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BUSHIDO AI — The Cultural Intelligence Platform for Authentic Japan",
    template: "%s · BUSHIDO AI",
  },
  description:
    "BUSHIDO AI is an AI cultural intelligence platform for authentic Japan. We use AI and a verified network of local masters to match travelers, schools, and premium clients with kyudo, tea ceremony, calligraphy, Zen, and shrine culture — orchestrating masters, interpreters, travel, and itinerary into one trusted layer.",
  keywords: [
    "AI cultural intelligence platform",
    "authentic Japan",
    "Japanese culture experiences",
    "kyudo",
    "tea ceremony",
    "calligraphy",
    "Zen",
    "cultural experience OS",
    "BUSHIDO AI",
  ],
  authors: [{ name: "BUSHIDO LLC" }],
  creator: "BUSHIDO LLC",
  publisher: "BUSHIDO LLC",
  alternates: {
    canonical: "/",
    languages: { "en": "/", "ja": "/" },
  },
  openGraph: {
    type: "website",
    siteName: "BUSHIDO AI",
    title: "BUSHIDO AI — The Cultural Intelligence Platform for Authentic Japan",
    description:
      "An AI cultural intelligence platform for authentic Japan — verified local masters, orchestrated end-to-end. Not a tour agency. A cultural experience OS.",
    url: SITE_URL,
    locale: "en_US",
    alternateLocale: ["ja_JP"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BUSHIDO AI — The Cultural Intelligence Platform for Authentic Japan",
    description:
      "AI cultural intelligence platform for authentic Japan. Verified masters, orchestrated end-to-end. A cultural experience OS.",
    // TODO(social): set your handle, e.g. "@bushido_ai"
    // creator: "@bushido_ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#0F1B2D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
