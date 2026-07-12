import "./globals.css";
import { Providers } from "./providers";
import AppLayout from "./AppLayout";
import { Space_Grotesk, Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

export const metadata = {
  title: "GrooveEstrella | Premium Music Discovery & Social Sharing",
  description:
    "Discover curated Spotify tracks, albums, artists, and playlists. Create custom GrooveCards, scan QR codes, and share your favorite tracks seamlessly.",
  manifest: "/manifest.json",
  themeColor: "#07090F",
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
    <html lang="en" className={`h-full ${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col scrollb-none antialiased font-sans bg-[#07090F] text-[#F4F7FF]">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <ToastContainer
          position="bottom-right"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </body>
    </html>
  );
}
