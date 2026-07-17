import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-text-dark text-white py-10 text-center brutal-border border-t-[6px] border-b-0 border-l-0 border-r-0 border-primary">
      <p className="font-mono text-sm">
        © {new Date().getFullYear()} Syzhaa. Open Source Project by{" "}
        <a 
          href="https://poketo.id" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4 font-bold"
        >
          PT Lembur Demi Waifu
        </a>
        .
      </p>
      <div className="flex items-center justify-center mt-3 text-sm font-bold text-gray-300 gap-2">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> Fork from <a href="https://github.com/Leotod112/boothlev" target="_blank" className="hover:text-white underline underline-offset-4 decoration-white">BOOTHLEV</a>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-xs font-archivo uppercase opacity-60">
        <Link href="/tos" className="hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">
          Terms of Service
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
