import "./globals.css";
import { Providers } from "./providers";
import AppLayout from "./AppLayout";
import { Space_Grotesk, Inter } from "next/font/google";
import LiquidToastContainer from "@/Components/LiquidToastContainer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport = {
  themeColor: "#17020B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://groove.amplecen.com'));

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GrooveEstrella | Open Music Discovery & Social Sharing",
    template: "%s | GrooveEstrella",
  },
  description:
    "Discover curated tracks, albums, pressings, and artists powered by MusicBrainz & Cover Art Archive. Create custom GrooveCards, scan QR codes, and share music seamlessly across platforms.",
  openGraph: {
    siteName: "GrooveEstrella",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "GrooveEstrella",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@GrooveEstrella",
    images: ["/icon-512.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/in.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GrooveEstrella",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full ${spaceGrotesk.variable} ${inter.variable}`} data-theme="dark">
      <body className="min-h-full flex flex-col scrollb-none antialiased font-sans bg-[var(--theme-bg)] text-[var(--theme-fg)]">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <LiquidToastContainer />
      </body>
    </html>
  );
}
