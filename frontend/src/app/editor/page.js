"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, GripHorizontal, ImagePlus, Plus, X, Palette as PaletteIcon } from "lucide-react";
import { templates } from "@/lib/templates";
import { useStore } from "@/store/useStore";
import { useCustomFrameStore } from "@/store/useCustomFrameStore";
import MaskEditorModal from "@/components/MaskEditorModal";
import PixenzeFrameDecor from "@/components/PixenzeFrameDecor";
import PhotoGallery from "@/components/PhotoGallery";
import MobileEditorBar from "@/components/MobileEditorBar";
import { loadTwibbonOverlay, revokeTwibbonOverlay } from "@/lib/twibbonOverlayStorage";
import Cropper from "react-easy-crop";
import * as htmlToImage from "html-to-image";

const getContrastColor = (hex) => {
  if (!hex) return "#111111";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#111111' : '#FFFFFF';
};

// ---- Sticker component (same as before) ----
function DraggableSticker({ sticker, index, scaleFactor, updateStickerPosition, onUpdateSize, onDelete }) {
  const stickerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const initX = sticker.x, initY = sticker.y;
    const onMove = (me) => { updateStickerPosition(index, initX + (me.clientX - startX) / scaleFactor, initY + (me.clientY - startY) / scaleFactor); };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  return (
    <div ref={stickerRef} onPointerDown={handlePointerDown} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      className={`absolute z-30 cursor-grab active:cursor-grabbing drop-shadow-md select-none touch-none leading-none ${isHovered ? 'ring-4 ring-blue-500 bg-white/20 rounded-lg' : ''}`}
      style={{ left: sticker.x, top: sticker.y, fontSize: sticker.type !== 'image' ? sticker.size : undefined }}>
      {sticker.type === 'image' ? <img src={sticker.url} alt="" style={{ width: sticker.size, height: 'auto', pointerEvents: 'none' }} /> : sticker.emoji}
      {isHovered && (<>
        <button onPointerDown={(e) => { e.stopPropagation(); onDelete(index); }} className="absolute -top-8 -right-8 bg-red-500 text-white rounded-full p-3 z-40 brutal-border hover:bg-red-600 scale-100" title="Hapus"><Trash2 className="w-8 h-8" /></button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center bg-white brutal-border rounded-full p-2 z-40 scale-100 text-4xl">
          <button onPointerDown={(e) => { e.stopPropagation(); onUpdateSize(index, Math.max(50, sticker.size - 20)); }} className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 font-black">-</button>
          <button onPointerDown={(e) => { e.stopPropagation(); onUpdateSize(index, Math.min(600, sticker.size + 20)); }} className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 font-black ml-2">+</button>
        </div>
      </>)}
    </div>
  );
}

// ---- Slot component ----
function SlotEditor({ index, image, shape, onUpload, onDelete, onSwap }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragReady, setIsDragReady] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // Accept dropped photos from gallery
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const url = e.dataTransfer.getData("photoUrl");
      if (url) onUpload(url);
    };
    el.addEventListener("dragover", (e) => e.preventDefault());
    el.addEventListener("drop", handler);
    return () => { el.removeEventListener("drop", handler); };
  }, [onUpload]);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) { const r = new FileReader(); r.addEventListener("load", () => onUpload(r.result)); r.readAsDataURL(e.target.files[0]); }
  };

  return (
    <div ref={dropRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden group"
      draggable={isDragReady}
      onDragStart={(e) => { e.dataTransfer.setData("slotIndex", index); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={(e) => { e.preventDefault(); const src = e.dataTransfer.getData("slotIndex"); if (src && src !== index.toString()) onSwap(parseInt(src), index); setIsDragReady(false); }}
      onDragEnd={() => setIsDragReady(false)}
      style={{
        borderRadius: shape === 'rounded' ? '24px' : shape === 'deco' ? '0px 40px 0px 40px' : 0,
        border: shape === 'wavy' ? '4px dashed rgba(0,0,0,0.2)' : 'none',
      }}>
      {image ? (<>
        <Cropper image={image} crop={crop} zoom={zoom} aspect={undefined} onCropChange={setCrop} onZoomChange={setZoom} showGrid={false}
          style={{ containerStyle: { width: '100%', height: '100%', backgroundColor: 'transparent' }, cropAreaStyle: { border: 'none', boxShadow: 'none' } }} />
        <button onClick={() => onDelete()} className="absolute top-2 right-2 z-50 bg-black/60 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all brutal-border shadow-md"><Trash2 className="w-4 h-4" /></button>
        <div onMouseDown={() => setIsDragReady(true)} onMouseUp={() => setIsDragReady(false)} onMouseLeave={() => setIsDragReady(false)}
          className="absolute top-2 left-2 z-50 bg-black/60 hover:bg-blue-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-all brutal-border shadow-md"><GripHorizontal className="w-4 h-4" /></div>
      </>) : (
        <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors z-10">
          <ImagePlus className="w-6 h-6 mb-1 opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Klik / Drop</span>
        </button>
      )}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
}

// ---- Main Editor ----
function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const customFrames = useCustomFrameStore((s) => s.frames);
  const customFramesReady = useCustomFrameStore((s) => s.hasHydrated);
  const template = [...templates, ...customFrames].find((t) => t.id === templateId);

  const globalPhotos = useStore((s) => s.photos);
  const replacePhoto = useStore((s) => s.replacePhoto);
  const [photos, setPhotos] = useState([]);
  const bgColor = useStore((s) => s.bgColor);
  const setBgColor = useStore((s) => s.setBgColor);
  const stickers = useStore((s) => s.stickers);
  const setStickers = useStore((s) => s.setStickers);
  const [customEmoji, setCustomEmoji] = useState("");
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [maskEditorData, setMaskEditorData] = useState({ originalUrl: "", maskUrl: "" });
  const [isExporting, setIsExporting] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(0.4);
  const [loadingStatus, setLoadingStatus] = useState(null);
  const [mobileTab, setMobileTab] = useState(null);
  const [overlayUrl, setOverlayUrl] = useState(null);

  const templateRef = useRef(null);
  const containerRef = useRef(null);
  const customImageInputRef = useRef(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  useEffect(() => {
    if (!template) return;
    const handleResize = () => {
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth - 32;
        const ch = containerRef.current.clientHeight - 32;
        setScaleFactor(Math.min(cw / template.width, ch / template.height, 1));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [template]);

  // Tunggu custom frame selesai dimuat dari localStorage sebelum mencari template.
  useEffect(() => {
    if (!customFramesReady) return;
    if (!template) { router.push("/templates"); return; }
    const initialPhotos = Array.from({ length: template.slots }).map((_, i) => globalPhotos[i] || null);
    setPhotos(initialPhotos);
    setBgColor(template.frameColor);
    setStickers(template.stickers ? [...template.stickers] : []);
  }, [template, globalPhotos, router, customFramesReady]);

  // Ambil overlay Twibbon dari state agar tidak hilang.
  // Template dari server akan membawa properti `overlayUrl` yang langsung terhubung ke API backend,
  // sehingga kita tidak perlu IndexedDB / localStorage lagi untuk sinkronisasi antar perangkat.
  useEffect(() => {
    if (template) {
      setOverlayUrl(template.overlayUrl || template.overlayImage || null);
    }
  }, [template]);
  const handleUpload = (index, dataUrl) => { const newPhotos = [...photos]; newPhotos[index] = dataUrl; setPhotos(newPhotos); };
  const handleDelete = (index) => { const newPhotos = [...photos]; newPhotos[index] = null; setPhotos(newPhotos); };
  const handleSwap = (indexA, indexB) => { const newPhotos = [...photos]; [newPhotos[indexA], newPhotos[indexB]] = [newPhotos[indexB], newPhotos[indexA]]; setPhotos(newPhotos); };
  const updateStickerPosition = (index, newX, newY) => setStickers((prev) => { const ns = [...prev]; ns[index] = { ...ns[index], x: newX, y: newY }; return ns; });
  const updateStickerSize = (index, newSize) => setStickers((prev) => { const ns = [...prev]; ns[index] = { ...ns[index], size: newSize }; return ns; });
  const handleDeleteSticker = (index) => setStickers((prev) => prev.filter((_, i) => i !== index));
  const handleAddSticker = (emojiStr) => { if (!emojiStr.trim()) return; setStickers((prev) => [...prev, { type: 'text', emoji: emojiStr, x: (template.width / 2) - 75, y: (template.height / 2) - 75, size: 150 }]); };
  const handleResetStickers = () => setStickers(template.stickers ? [...template.stickers] : []);

  const handleCustomStickerUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const originalUrl = URL.createObjectURL(file); e.target.value = '';
    setLoadingStatus('Mengirim foto ke Server AI...');
    const formData = new FormData(); formData.append('image', file);
    try {
      const response = await fetch('http://localhost:4000/api/remove-bg', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Gagal diproses oleh server AI.');
      setLoadingStatus('Memuat hasil...');
      const blob = await response.blob();
      const maskUrl = URL.createObjectURL(blob);
      setMaskEditorData({ originalUrl, maskUrl }); setIsMaskEditorOpen(true);
    } catch (err) { console.error(err); alert('Error: ' + err.message); }
    finally { setLoadingStatus(null); }
  };
  const handleApplyMask = (editedDataUrl) => {
    setStickers((prev) => [...prev, { type: 'image', url: editedDataUrl, x: (template.width / 2) - 100, y: (template.height / 2) - 100, size: 200 }]);
    setIsMaskEditorOpen(false); URL.revokeObjectURL(maskEditorData.originalUrl); URL.revokeObjectURL(maskEditorData.maskUrl);
    setMaskEditorData({ originalUrl: "", maskUrl: "" });
  };

  const handleExport = async () => {
    if (!templateRef.current) return;
    if (photos.some(p => p === null)) { alert("Harap isi semua slot foto sebelum download!"); return; }
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(templateRef.current, { pixelRatio: 3 });
      const link = document.createElement("a"); link.download = `syzhaa-${template.id}-${Date.now()}.png`; link.href = dataUrl; link.click();
    } catch (err) { console.error("Export failed:", err); alert("Gagal mengunduh foto."); }
    finally { setIsExporting(false); }
  };

  if (!template) return null;

  const slotRadius = template.slotShape === 'rounded' ? 28 : template.slotShape === 'deco' ? '0px 40px 0px 40px' : 0;
  const slotBorder = template.slotBorderWidth ? `${template.slotBorderWidth}px solid ${template.slotBorderColor || '#111111'}` : 'none';

  // Right panel content (used both in desktop sidebar and mobile overlay)
  const rightPanelContent = (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Stickers */}
      <div className="p-3 border-b-4 border-black">
        <label className="font-black uppercase text-xs flex items-center gap-1 mb-2"><Plus className="w-3 h-3" /> Stiker</label>
        <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto mb-2">
          {["✨","🔥","🎀","🍒","⭐","🎸","🌈","⚡","🎈","🧸","🌸","👑","💎","🦋","🍄","🍔","😎","👾","💖","💯","🚀","💅","🍿","🎥"].map((e, i) => (
            <button key={i} onClick={() => handleAddSticker(e)} className="aspect-square rounded brutal-border bg-gray-50 flex items-center justify-center text-lg hover:bg-yellow-200 active:scale-90">{e}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <input value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} placeholder="🍕" className="w-12 text-center border-2 border-black rounded font-bold text-lg" maxLength={2} />
          <button onClick={() => { handleAddSticker(customEmoji); setCustomEmoji(""); }} className="flex-1 bg-black text-white text-xs font-bold rounded brutal-border">Tambah</button>
          <button onClick={handleResetStickers} className="px-2 text-xs font-bold text-red-500 hover:underline">Reset</button>
        </div>
      </div>
      {/* Colors */}
      <div className="p-3 border-b-4 border-black">
        <label className="font-black uppercase text-xs mb-2 flex items-center gap-1"><PaletteIcon className="w-3 h-3" /> Warna Frame</label>
        <div className="flex flex-wrap gap-1.5">
          {["#111111","#FFFFFF","#F9A8D4","#FCD34D","#86EFAC","#93C5FD","#C4B5FD","#F97316","#80C9ED","#FFF0C7","#e5e7eb","#050505"].map(c => (
            <button key={c} onClick={() => setBgColor(c)} className={`w-8 h-8 rounded-full brutal-border transition-transform active:scale-90 ${bgColor === c ? 'ring-4 ring-black ring-offset-2' : ''}`} style={{ backgroundColor: c }} />
          ))}
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute pointer-events-none" id="colorPicker" />
          <label htmlFor="colorPicker" className="w-8 h-8 rounded-full brutal-border bg-[conic-gradient(red,yellow,green,blue,magenta,red)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" />
        </div>
      </div>
      {/* AI Sticker Upload */}
      <div className="p-3">
        <label className="font-black uppercase text-xs mb-2">Upload Stiker AI</label>
        <button onClick={() => customImageInputRef.current?.click()} className="w-full bg-blue-100 border-2 border-blue-500 text-blue-700 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors brutal-border active:scale-95">
          <ImagePlus className="w-4 h-4" /> UNGGAH FOTO KE AI
        </button>
        <input type="file" accept="image/*" ref={customImageInputRef} onChange={handleCustomStickerUpload} className="hidden" />
        <button onClick={handleExport} disabled={isExporting} className="w-full mt-3 bg-accent text-white font-bold py-3 rounded brutal-border hover:bg-black active:scale-95 transition-all text-sm uppercase tracking-widest">
          {isExporting ? "RENDER..." : "⬇ Download"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
      {loadingStatus && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <div className="w-12 h-12 mb-4 border-4 border-white border-t-accent rounded-full animate-spin" />
          <h2 className="font-archivo text-2xl uppercase mb-2">Memproses AI...</h2>
          <p className="font-bold uppercase tracking-widest text-sm opacity-80">{loadingStatus}</p>
        </div>
      )}

      {/* TOP BAR */}
      <div className="bg-white border-b-4 border-black px-4 py-3 flex items-center justify-between z-20">
        <Link href="/templates" className="flex items-center gap-2 font-archivo text-lg hover:underline"><ArrowLeft className="w-5 h-5" /> Kembali</Link>
        <span className="text-xs font-bold text-gray-500 hidden sm:block">{template.name} • {template.slots} slot</span>
        <div className="flex gap-2">
          <button onClick={() => setShowLeftPanel(v => !v)} className="hidden md:block px-3 py-1.5 bg-gray-200 rounded brutal-border text-xs font-bold">
            {showLeftPanel ? 'Tutup Galeri' : 'Buka Galeri'}
          </button>
          <Link href={`/booth?template=${templateId}`} className="px-3 py-1.5 bg-gray-200 rounded brutal-border text-xs font-bold flex items-center gap-1">
            <Camera className="w-3 h-3" /> Ambil Foto Baru
          </Link>
          <button onClick={handleExport} disabled={isExporting} className="px-4 py-1.5 bg-accent text-white rounded brutal-border text-xs font-bold">{isExporting ? "..." : "Download"}</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex relative overflow-hidden" style={{ height: 'calc(100dvh - 60px)' }}>
        {/* LEFT PANEL - Photo Gallery (Desktop) */}
        <div className={`${showLeftPanel ? 'block' : 'hidden'} md:block w-56 lg:w-64 border-r-4 border-black bg-white shrink-0 overflow-hidden`}>
          <PhotoGallery />
        </div>

        {/* CENTER - Canvas */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 bg-[url('/checkers.svg')] bg-repeat relative overflow-hidden md:pb-4 pb-20">
          <div style={{ width: template.width * scaleFactor, height: template.height * scaleFactor, position: 'relative' }}>
            <div ref={templateRef} style={{ width: template.width, height: template.height, transform: `scale(${scaleFactor})`, transformOrigin: 'top left' }}
              className="absolute top-0 left-0 shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full relative overflow-hidden flex flex-col items-center bg-white" style={{ backgroundColor: bgColor }}>
                {template.specialFrame === 'pixenze' && <PixenzeFrameDecor width={template.width} height={template.height} />}
                <div className="absolute inset-0 w-full h-full">
                  {template.layout.map((slot, i) => (
                    <div key={i} className="absolute overflow-hidden" style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h, backgroundColor: template.slotBgColor || '#e5e7eb', borderRadius: slotRadius, border: slotBorder, zIndex: 10 }}>
                      <SlotEditor index={i} image={photos[i]} shape={template.slotShape} onUpload={(url) => handleUpload(i, url)} onDelete={() => handleDelete(i)} onSwap={handleSwap} />
                    </div>
                  ))}
                </div>
                
                {/* TWIBBON OVERLAY IMAGE */}
                {overlayUrl && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <img src={overlayUrl} alt="Twibbon Overlay" className="w-full h-full object-fill" />
                  </div>
                )}
                
                {stickers.map((st, i) => <DraggableSticker key={i} index={i} sticker={st} scaleFactor={scaleFactor} updateStickerPosition={updateStickerPosition} onUpdateSize={updateStickerSize} onDelete={handleDeleteSticker} />)}
                {!template.hideDefaultFooter && (
                  <div className="absolute bottom-8 w-full text-center z-10" style={{ color: getContrastColor(bgColor) }}>
                    <span className="font-archivo text-[50px] uppercase font-bold leading-none block">SYZHAA</span>
                    <span className="text-sm font-bold">booth.ktik.me</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Controls (Desktop) */}
        <div className="hidden md:block w-56 lg:w-72 border-l-4 border-black bg-white shrink-0 overflow-hidden">
          {rightPanelContent}
        </div>

        {/* MOBILE OVERLAYS */}
        {mobileTab === "photos" && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div className="w-72 bg-white border-r-4 border-black shadow-2xl">
              <PhotoGallery />
            </div>
            <div className="flex-1 bg-black/30" onClick={() => setMobileTab(null)} />
          </div>
        )}
        {mobileTab === "frame" && (
          <div className="fixed inset-0 z-40 md:hidden flex justify-end">
            <div className="flex-1 bg-black/30" onClick={() => setMobileTab(null)} />
            <div className="w-72 bg-white border-l-4 border-black shadow-2xl overflow-y-auto">
              <div className="p-3 border-b-4 border-black flex items-center justify-between">
                <h3 className="font-archivo text-lg uppercase">Frame</h3>
                <button onClick={() => setMobileTab(null)} className="text-gray-500 hover:text-black"><X className="w-5 h-5" /></button>
              </div>
              {rightPanelContent}
            </div>
          </div>
        )}
        {mobileTab === "stickers" && (
          <div className="fixed inset-0 z-40 md:hidden flex justify-end">
            <div className="flex-1 bg-black/30" onClick={() => setMobileTab(null)} />
            <div className="w-72 bg-white border-l-4 border-black shadow-2xl overflow-y-auto">
              <div className="p-3 border-b-4 border-black flex items-center justify-between">
                <h3 className="font-archivo text-lg uppercase">Stiker</h3>
                <button onClick={() => setMobileTab(null)} className="text-gray-500 hover:text-black"><X className="w-5 h-5" /></button>
              </div>
              {rightPanelContent}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM BAR */}
      <MobileEditorBar activeTab={mobileTab} setActiveTab={setMobileTab} onExport={handleExport} isExporting={isExporting} />

      <MaskEditorModal isOpen={isMaskEditorOpen} onClose={() => setIsMaskEditorOpen(false)} onApply={handleApplyMask} originalImageUrl={maskEditorData.originalUrl} maskImageUrl={maskEditorData.maskUrl} />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-gray-100 flex items-center justify-center font-archivo text-2xl uppercase">Loading...</div>}>
      <EditorPageContent />
    </Suspense>
  );
}
