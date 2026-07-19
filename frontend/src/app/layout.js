import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import LayoutWrapper from "@/components/ui/LayoutWrapper";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata = {
  title: "Syzhaa | Neo-Brutalist Photobooth",
  description: "Authentic photobooth experience in your browser",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-inter bg-bg-light text-text-dark">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
