import Link from "next/link";
import { Camera, LayoutTemplate } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-[calc(100dvh-140px)] bg-gray-100">
      <div className="text-center mb-10">
        <h1 className="font-archivo text-5xl md:text-7xl uppercase tracking-tighter mb-4">
          <span className="bg-white px-4 brutal-border inline-block -rotate-2 shadow-sm">SYZHAA</span>
          <span className="bg-accent text-white px-4 brutal-border inline-block rotate-2 mt-2 md:mt-0 md:ml-2 shadow-sm">BOOTH</span>
        </h1>
        <p className="font-bold text-gray-700 uppercase tracking-widest text-xs md:text-sm bg-yellow-200 inline-block px-4 py-2 brutal-border mt-2">
          Photobooth langsung dari browser!
        </p>
      </div>

      <div className="w-full max-w-md">
        {/* Card 1: Ambil Foto */}
        <Link href="/booth" className="group bg-white brutal-border brutal-shadow p-8 md:p-12 flex flex-col items-center justify-center hover:-translate-y-2 hover:shadow-[8px_8px_0_#111111] transition-all aspect-square text-center">
          <div className="w-24 h-24 bg-primary rounded-full brutal-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Camera className="w-12 h-12 text-black" />
          </div>
          <h2 className="font-archivo text-4xl uppercase mb-3">Mulai Foto</h2>
          <p className="text-gray-600 font-medium text-base">
            Jepret atau upload fotomu tanpa batas, lalu hias dengan stiker lucu!
          </p>
        </Link>
      </div>

      <div className="mt-12">
        <Link href="/admin" className="text-sm font-bold text-gray-500 hover:text-black uppercase tracking-widest underline decoration-2 underline-offset-4">
          Buka Panel Admin
        </Link>
      </div>
    </div>
  );
}
