"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, ScanSearch, MousePointerSquareDashed, Trash2, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCustomFrameStore } from "@/store/useCustomFrameStore";
import { saveTwibbonOverlay } from "@/lib/twibbonOverlayStorage";

import { saveServerFrame } from "@/lib/frameApi";

export default function UploadBingkaiPage() {
  const router = useRouter();
  const store = useCustomFrameStore();
  const fileRef = useRef(null);
  const canvasRef = useRef(null);

  const [imageUrl, setImageUrl] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [slots, setSlots] = useState([]);
  const [frameName, setFrameName] = useState("Bingkai Baru");
  
  // Modes: 'idle' | 'drawing' (drag to draw box) | 'magic' (click to auto-fill transparent/black box)
  const [mode, setMode] = useState("idle"); 
  const [dragStart, setDragStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSourceFile(file);
    
    const img = new Image();
    img.onload = () => {
      setImageSize({ w: img.width, h: img.height });
      setImageUrl(url);
      setSlots([]); // Reset slots
    };
    img.src = url;
  };

  // Helper untuk mendapatkan koordinat pointer yang akurat di atas canvas yang di-scale
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = imageSize.w / rect.width;
    const scaleY = imageSize.h / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // MAGIC WAND: Flood Fill bounding box
  // Mencari kotak transparan ATAU warna pekat solid (hitam/putih/hijau/dll yang homogen)
  const magicWandDetect = (startX, startY) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { w, h } = imageSize;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const targetIdx = (Math.floor(startY) * w + Math.floor(startX)) * 4;
    const targetR = data[targetIdx];
    const targetG = data[targetIdx+1];
    const targetB = data[targetIdx+2];
    const targetA = data[targetIdx+3];

    // Toleransi warna (kalau hitam/putih pekat atau transparan, toleransi lebih tinggi)
    const isTargetTransparent = targetA < 50;
    const tolerance = isTargetTransparent ? 50 : 20; 

    const colorMatch = (idx) => {
      const a = data[idx+3];
      if (isTargetTransparent) return a < 50;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      return Math.abs(r-targetR) < tolerance && Math.abs(g-targetG) < tolerance && Math.abs(b-targetB) < tolerance && Math.abs(a-targetA) < tolerance;
    };

    let minX = Math.floor(startX), maxX = minX;
    let minY = Math.floor(startY), maxY = minY;
    const visited = new Uint8Array(w * h);
    const stack = [[minX, minY]];

    let pixelCount = 0;

    // Scan horizontal & vertikal cepat untuk mencari bounding box
    while(stack.length > 0 && pixelCount < 300000) { // Limit prevent freeze
      const [cx, cy] = stack.pop();
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
      
      const vIdx = cy * w + cx;
      if (visited[vIdx]) continue;
      visited[vIdx] = 1;

      const dIdx = vIdx * 4;
      if (colorMatch(dIdx)) {
        pixelCount++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // Spread in 4 directions (step by 2px for speed)
        stack.push([cx+2, cy], [cx-2, cy], [cx, cy+2], [cx, cy-2]);
      }
    }

    // Jika area yang terdeteksi cukup besar, jadikan slot
    if (maxX - minX > 50 && maxY - minY > 50) {
      setSlots(prev => [...prev, {
        x: Math.max(0, minX - 2),
        y: Math.max(0, minY - 2),
        w: Math.min(w, (maxX - minX) + 4),
        h: Math.min(h, (maxY - minY) + 4)
      }]);
    } else {
      alert("Area tidak jelas. Gunakan Draw Manual atau klik area kotak yang lebih solid warnanya.");
    }
  };

  // FULL AUTO DETECT (Scan seluruh layar cari kotak hitam / transparan)
  const fullAutoDetect = () => {
    if (!imageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { w, h } = imageSize;
    const data = ctx.getImageData(0, 0, w, h).data;
    
    // Cari kotak bolong (transparan) atau kotak Hitam Solid (0,0,0) yang biasa jadi slot
    const isSlotColor = (idx) => {
      const a = data[idx+3];
      if (a < 50) return true; // Transparent
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Jika nyaris hitam pekat (hitam RGB < 20)
      if (r < 25 && g < 25 && b < 25 && a > 200) return true; 
      return false;
    };

    const visited = new Uint8Array(w * h);
    const foundSlots = [];

    // Scan the image jumping every 10 pixels for performance
    for (let y = 10; y < h; y += 10) {
      for (let x = 10; x < w; x += 10) {
        const vIdx = y * w + x;
        if (visited[vIdx]) continue;

        if (isSlotColor(vIdx * 4)) {
          let minX = x, maxX = x, minY = y, maxY = y;
          const stack = [[x, y]];
          
          while(stack.length > 0 && stack.length < 20000) {
            const [cx, cy] = stack.pop();
            if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
            
            const currVIdx = cy * w + cx;
            if (visited[currVIdx]) continue;
            
            if (isSlotColor(currVIdx * 4)) {
              visited[currVIdx] = 1;
              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;
              // Expand
              stack.push([cx+5, cy], [cx-5, cy], [cx, cy+5], [cx, cy-5]);
            }
          }

          if (maxX - minX > 80 && maxY - minY > 80) { // Valid slot size
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
      alert(`Auto-detect menemukan ${foundSlots.length} slot foto!`);
    } else {
      alert("Gagal auto-detect (tidak ada kotak hitam/transparan pekat). Silakan gunakan 'Auto Klik Area' (Magic Wand) atau 'Manual Draw'.");
    }
  };

  // Manual Drawing Events
  const handlePointerDown = (e) => {
    const pos = getCanvasPos(e);
    if (mode === "magic") {
      magicWandDetect(pos.x, pos.y);
      return;
    }
    if (mode !== "drawing") return;
    
    setDragStart(pos);
    setCurrentBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handlePointerMove = (e) => {
    if (mode !== "drawing" || !dragStart) return;
    const pos = getCanvasPos(e);
    setCurrentBox({
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      w: Math.abs(pos.x - dragStart.x),
      h: Math.abs(pos.y - dragStart.y)
    });
  };

  const handlePointerUp = () => {
    if (mode !== "drawing" || !dragStart || !currentBox) return;
    if (currentBox.w > 30 && currentBox.h > 30) {
      setSlots([...slots, currentBox]);
    }
    setDragStart(null);
    setCurrentBox(null);
    // Don't reset mode, let them keep drawing multiple
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!sourceFile) return alert("Upload gambar dulu!");
    if (slots.length === 0) return alert("Buat minimal 1 slot foto!");
    
    setIsSaving(true);
    try {
      const id = `upload-${Date.now()}`;
      
      const draftFrame = {
        id,
        name: frameName,
        category: "CUSTOM",
        description: "Bingkai Upload Sendiri",
        width: imageSize.w,
        height: imageSize.h,
        slots: slots.length,
        frameColor: "transparent",
        textColor: "#FFFFFF",
        slotShape: "square",
        slotBgColor: "#e5e7eb",
        slotBorderWidth: 0,
        layout: slots,
        stickers: [],
      };

      // Ensure sourceFile is a File or Blob
      const fileToUpload = sourceFile instanceof File ? sourceFile : new File([sourceFile], "overlay.png", { type: sourceFile.type || "image/png" });

      const serverFrame = await saveServerFrame(draftFrame, fileToUpload);
      store.upsertFrame(serverFrame);

      alert(`Bingkai "${serverFrame.name}" berhasil disimpan ke server!`);
      router.push("/templates");
    } catch (err) {
      console.error("Gagal menyimpan bingkai:", err);
      alert("Gagal menyimpan bingkai. Coba gunakan file PNG yang lebih kecil. Error: " + err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
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
        <Button onClick={handleSave} variant="primary" disabled={!imageUrl || slots.length === 0 || isSaving} className="gap-2">
          <Save className="w-5 h-5" /> {isSaving ? "MENYIMPAN..." : "SIMPAN"}
        </Button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-6">
        
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="bg-white brutal-border brutal-shadow-sm p-5 space-y-4">
            <h2 className="font-archivo text-xl uppercase">1. Upload Frame</h2>
            <Button onClick={(e) => { e.preventDefault(); fileRef.current?.click(); }} type="button" className="w-full bg-accent text-white hover:bg-black">
              <Upload className="w-5 h-5 mr-2" /> UPLOAD FILE PNG
            </Button>
            <input type="file" accept="image/png, image/webp" ref={fileRef} onChange={handleUpload} className="hidden" />
          </div>

          <div className={`bg-white brutal-border brutal-shadow-sm p-5 space-y-3 transition-opacity ${!imageUrl ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="font-archivo text-xl uppercase">2. Buat Slot Foto</h2>
            
            <Button onClick={fullAutoDetect} variant="outline" className="w-full bg-yellow-200 hover:bg-yellow-300">
              <ScanSearch className="w-5 h-5 mr-2" /> FULL AUTO DETECT
            </Button>
            
            <Button onClick={() => setMode(mode === "magic" ? "idle" : "magic")} variant={mode === "magic" ? "primary" : "outline"} className="w-full">
              <Wand2 className="w-5 h-5 mr-2" /> AUTO KLIK AREA
            </Button>

            <Button onClick={() => setMode(mode === "drawing" ? "idle" : "drawing")} variant={mode === "drawing" ? "primary" : "outline"} className="w-full">
              <MousePointerSquareDashed className="w-5 h-5 mr-2" /> GAMBAR MANUAL
            </Button>

            {mode === "magic" && <p className="text-[10px] text-blue-600 font-bold text-center leading-tight">Klik langsung di area kotak hitam/kosong pada gambar, sistem akan membentuk ukurannya otomatis!</p>}
            {mode === "drawing" && <p className="text-[10px] text-red-500 font-bold text-center leading-tight">Klik tahan & seret (drag) membentuk kotak pada gambar!</p>}
          </div>

          <div className={`bg-white brutal-border brutal-shadow-sm p-5 flex-1 overflow-hidden flex flex-col transition-opacity ${slots.length === 0 ? 'opacity-50' : ''}`}>
            <h2 className="font-archivo text-xl uppercase mb-3 shrink-0">Slot ({slots.length})</h2>
            <div className="space-y-2 overflow-y-auto pr-1">
              {slots.map((s, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-100 brutal-border text-xs font-bold">
                  <span>Slot #{i + 1} ({Math.round(s.w)}x{Math.round(s.h)})</span>
                  <button onClick={() => setSlots(slots.filter((_, idx) => idx !== i))} className="text-red-500 hover:scale-125"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {slots.length > 0 && (
                <Button onClick={() => setSlots([])} variant="ghost" className="w-full text-red-500 text-xs mt-2">Reset Semua</Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[url('/checkers.svg')] bg-repeat brutal-border flex items-center justify-center p-4 relative overflow-hidden">
          {!imageUrl ? (
            <div className="text-gray-400 text-center font-bold uppercase tracking-widest">Belum ada gambar</div>
          ) : (
            <div 
              className={`relative shadow-2xl ${mode === 'drawing' ? 'cursor-crosshair' : mode === 'magic' ? 'cursor-pointer' : ''}`}
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
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
              <img 
                src={imageUrl} 
                alt="Overlay" 
                className={`w-full h-full object-contain pointer-events-none ${mode !== 'idle' ? 'opacity-50' : ''}`} 
                onLoad={(e) => {
                  const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
                  canvasRef.current.width = imageSize.w;
                  canvasRef.current.height = imageSize.h;
                  ctx.drawImage(e.target, 0, 0, imageSize.w, imageSize.h);
                }}
              />
              
              {slots.map((s, i) => (
                <div key={i} className="absolute bg-blue-500/40 border-2 border-blue-500 flex items-center justify-center pointer-events-none"
                  style={{
                    left: `${(s.x / imageSize.w) * 100}%`, top: `${(s.y / imageSize.h) * 100}%`,
                    width: `${(s.w / imageSize.w) * 100}%`, height: `${(s.h / imageSize.h) * 100}%`,
                  }}>
                  <span className="bg-blue-600 text-white font-bold px-2 py-1 text-xs rounded">Slot {i+1}</span>
                </div>
              ))}

              {currentBox && (
                <div className="absolute border-2 border-dashed border-red-500 bg-red-500/30 pointer-events-none"
                  style={{
                    left: `${(currentBox.x / imageSize.w) * 100}%`, top: `${(currentBox.y / imageSize.h) * 100}%`,
                    width: `${(currentBox.w / imageSize.w) * 100}%`, height: `${(currentBox.h / imageSize.h) * 100}%`,
                  }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
