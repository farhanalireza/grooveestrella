// src/app/layout.js
import "./globals.css";
import { Providers } from "./providers";
import AppLayout from "./AppLayout";
import { Space_Grotesk, Inter } from "next/font/google";

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
  description: "Discover curated Spotify tracks, albums, artists, and playlists. Create custom GrooveCards, scan QR codes, and share your favorite tracks seamlessly.",
};

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full ${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col scrollb-none antialiased font-sans">
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
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
