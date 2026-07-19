"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Sembunyikan Navbar dan Footer di halaman editor/kamera yang butuh layar penuh
  const isFullscreenApp = 
    pathname.startsWith("/custom-frame") || 
    pathname.startsWith("/booth") || 
    pathname.startsWith("/capture") ||
    pathname.startsWith("/twibbon") ||
    pathname.startsWith("/editor");

  if (isFullscreenApp) {
    return (
      <main className="flex-1 flex flex-col h-[100dvh] w-full overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
