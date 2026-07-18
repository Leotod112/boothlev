"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, ScanSearch, MousePointerSquareDashed, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCustomFrameStore } from "@/store/useCustomFrameStore";

export default function TwibbonBuilderPage() {
  const router = useRouter();
  const store = useCustomFrameStore();
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [slots, setSlots] = useState([]);
  const [frameName, setFrameName] = useState("Twibbon Baru");
  const [mode, setMode] = useState("idle"); // 'idle' | 'drawing'
  const [dragStart, setDragStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    
    const img = new Image();
    img.onload = () => {
      setImageSize({ w: img.width, h: img.height });
      setImageUrl(url);
      setSlots([]); // Reset slots
    };
    img.src = url;
  };

  // Fungsi Deteksi Otomatis (Mencari kotak transparan/bolong)
  const autoDetectSlots = () => {
    if (!imageUrl || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { w, h } = imageSize;
    
    // Scan pixel by pixel looking for transparent areas (alpha < 50)
    const imgData = ctx.getImageData(0, 0, w, h).data;
    const visited = new Uint8Array(w * h);
    const foundSlots = [];

    const getAlpha = (x, y) => imgData[(y * w + x) * 4 + 3];

    for (let y = 0; y < h; y += 5) { // Step by 5 for performance
      for (let x = 0; x < w; x += 5) {
        const idx = y * w + x;
        if (visited[idx]) continue;

        // If highly transparent
        if (getAlpha(x, y) < 50) {
          // Flood fill or simple bounding box expansion
          let minX = x, maxX = x, minY = y, maxY = y;
          const stack = [[x, y]];
          
          // Simplified expansion to find boundaries of this transparent hole
          while(stack.length > 0 && stack.length < 50000) {
            const [cx, cy] = stack.pop();
            if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
            
            const cIdx = cy * w + cx;
            if (visited[cIdx]) continue;
            
            if (getAlpha(cx, cy) < 50) {
              visited[cIdx] = 1;
              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              // Push neighbors (step 5px for speed)
              stack.push([cx+5, cy], [cx-5, cy], [cx, cy+5], [cx, cy-5]);
            }
          }

          // If the hole is reasonably large (at least 50x50 pixels)
          if (maxX - minX > 50 && maxY - minY > 50) {
            // Expand slightly to ensure it fills behind the overlay edge
            foundSlots.push({
              x: Math.max(0, minX - 5),
              y: Math.max(0, minY - 5),
              w: Math.min(w, (maxX - minX) + 10),
              h: Math.min(h, (maxY - minY) + 10)
            });
          }
        }
      }
    }

    if (foundSlots.length > 0) {
      setSlots(foundSlots);
      alert(`Berhasil mendeteksi ${foundSlots.length} area transparan!`);
    } else {
      alert("Tidak menemukan area transparan kotak yang jelas. Silakan tandai manual.");
    }
  };

  // Manual Drawing
  const handlePointerDown = (e) => {
    if (mode !== "drawing") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = imageSize.w / rect.width;
    const scaleY = imageSize.h / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setDragStart({ x, y });
    setCurrentBox({ x, y, w: 0, h: 0 });
  };

  const handlePointerMove = (e) => {
    if (mode !== "drawing" || !dragStart) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = imageSize.w / rect.width;
    const scaleY = imageSize.h / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    
    setCurrentBox({
      x: Math.min(dragStart.x, currentX),
      y: Math.min(dragStart.y, currentY),
      w: Math.abs(currentX - dragStart.x),
      h: Math.abs(currentY - dragStart.y)
    });
  };

  const handlePointerUp = () => {
    if (mode !== "drawing" || !dragStart || !currentBox) return;
    if (currentBox.w > 20 && currentBox.h > 20) {
      setSlots([...slots, currentBox]);
    }
    setDragStart(null);
    setCurrentBox(null);
    setMode("idle");
  };

  const handleSave = () => {
    if (!imageUrl) return alert("Upload gambar dulu!");
    if (slots.length === 0) return alert("Buat minimal 1 slot foto!");
    
    // Save to custom frame store using a special structure
    const finalFrame = {
      id: `twibbon-${Date.now()}`,
      name: frameName,
      category: "CUSTOM",
      description: "Bingkai Overlay (Twibbon)",
      width: imageSize.w,
      height: imageSize.h,
      slots: slots.length,
      frameColor: "transparent", // Base is transparent
      textColor: "#FFFFFF",
      slotShape: "square",
      slotBgColor: "#e5e7eb",
      slotBorderWidth: 0,
      layout: slots,
      stickers: [],
      overlayImage: imageUrl // New property! We will modify Editor to render this on top
    };

    store.saveFrame(finalFrame);
    alert(`Bingkai "${frameName}" berhasil disimpan!`);
    router.push("/templates");
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white brutal-border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/templates" className="inline-flex items-center font-archivo text-xl hover:underline decoration-4">
          <ArrowLeft className="mr-2 w-5 h-5" /> Batal
        </Link>
        <input
          value={frameName}
          onChange={(e) => setFrameName(e.target.value)}
          className="font-archivo text-2xl bg-transparent border-b-4 border-black px-2 py-1 max-w-[260px] text-center focus:outline-none focus:bg-yellow-100"
          placeholder="Nama Bingkai"
        />
        <Button onClick={handleSave} variant="primary" disabled={!imageUrl || slots.length === 0} className="gap-2">
          <Save className="w-5 h-5" /> SIMPAN
        </Button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-6">
        
        {/* Kontrol Kiri */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-white brutal-border brutal-shadow-sm p-5 space-y-4">
            <h2 className="font-archivo text-xl uppercase">1. Upload File</h2>
            <p className="text-xs text-gray-600 font-medium">
              Gunakan file format <strong>PNG</strong> yang berukuran resolusi tinggi (misal 1080x1920) dengan area tengah yang sudah bolong (transparan).
            </p>
            <Button onClick={() => fileRef.current?.click()} className="w-full bg-accent text-white hover:bg-black">
              <Upload className="w-5 h-5 mr-2" /> UPLOAD GAMBAR PNG
            </Button>
            <input type="file" accept="image/png, image/webp" ref={fileRef} onChange={handleUpload} className="hidden" />
          </div>

          <div className={`bg-white brutal-border brutal-shadow-sm p-5 space-y-4 transition-opacity ${!imageUrl ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="font-archivo text-xl uppercase">2. Atur Slot Foto</h2>
            <p className="text-xs text-gray-600 font-medium mb-2">
              Biar foto kamu nanti masuk ke tempat yang pas di belakang bingkai.
            </p>

            <Button onClick={autoDetectSlots} variant="outline" className="w-full bg-yellow-200 hover:bg-yellow-300">
              <ScanSearch className="w-5 h-5 mr-2" /> AUTO DETEKSI AREA
            </Button>
            
            <div className="text-center text-xs font-bold my-2 text-gray-400">ATAU</div>

            <Button onClick={() => setMode(mode === "drawing" ? "idle" : "drawing")} variant={mode === "drawing" ? "primary" : "outline"} className="w-full">
              <MousePointerSquareDashed className="w-5 h-5 mr-2" /> TANDAI MANUAL
            </Button>
            {mode === "drawing" && <p className="text-[10px] text-red-500 font-bold text-center">Klik & Seret kursor di gambar kanan!</p>}
          </div>

          <div className={`bg-white brutal-border brutal-shadow-sm p-5 transition-opacity ${slots.length === 0 ? 'opacity-50' : ''}`}>
            <h2 className="font-archivo text-xl uppercase mb-3">Daftar Slot ({slots.length})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {slots.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-100 brutal-border text-xs font-bold">
                  <span>Slot #{i + 1} ({Math.round(s.w)}x{Math.round(s.h)})</span>
                  <button onClick={() => setSlots(slots.filter((_, idx) => idx !== i))} className="text-red-500 hover:scale-125"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Kanvas Gambar */}
        <div className="flex-1 bg-[url('/checkers.svg')] bg-repeat brutal-border flex items-center justify-center p-4 relative overflow-hidden">
          {!imageUrl ? (
            <div className="text-gray-400 text-center font-bold uppercase tracking-widest">
              Belum ada gambar
            </div>
          ) : (
            <div 
              className={`relative shadow-2xl ${mode === 'drawing' ? 'cursor-crosshair' : ''}`}
              style={{
                width: "auto", height: "auto",
                maxWidth: "100%", maxHeight: "100%",
                aspectRatio: `${imageSize.w} / ${imageSize.h}`
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <img src={imageUrl} alt="Overlay" className="w-full h-full object-contain pointer-events-none opacity-80" />
              
              {/* Gambar aslinya digambar ke canvas ini secara hidden buat proses auto-detect */}
              <canvas ref={canvasRef} width={imageSize.w} height={imageSize.h} className="hidden" />

              {/* Render Slots yang sudah ada */}
              {slots.map((s, i) => (
                <div key={i} className="absolute bg-blue-500/40 border-2 border-blue-500 flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${(s.x / imageSize.w) * 100}%`,
                    top: `${(s.y / imageSize.h) * 100}%`,
                    width: `${(s.w / imageSize.w) * 100}%`,
                    height: `${(s.h / imageSize.h) * 100}%`,
                  }}>
                  <span className="bg-blue-600 text-white font-bold px-2 py-1 text-xs rounded">Slot {i+1}</span>
                </div>
              ))}

              {/* Box yang sedang digambar manual */}
              {currentBox && (
                <div className="absolute border-2 border-dashed border-red-500 bg-red-500/30 pointer-events-none"
                  style={{
                    left: `${(currentBox.x / imageSize.w) * 100}%`,
                    top: `${(currentBox.y / imageSize.h) * 100}%`,
                    width: `${(currentBox.w / imageSize.w) * 100}%`,
                    height: `${(currentBox.h / imageSize.h) * 100}%`,
                  }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
