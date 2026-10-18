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
  themeColor: "#470B24",
};

export const metadata = {
  title: "GrooveEstrella | Open Music Discovery & Social Sharing",
  description:
    "Discover curated tracks, albums, and artists powered by MusicBrainz & Cover Art Archive. Create custom GrooveCards, scan QR codes, and share music seamlessly across platforms.",
  manifest: "/manifest.json",
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
