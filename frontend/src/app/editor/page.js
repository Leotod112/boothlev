"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, GripHorizontal, ImagePlus, Plus, X, Palette as PaletteIcon, ChevronLeft, ChevronRight, Camera, LayoutTemplate, Image as ImageIcon } from "lucide-react";
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
import { fetchServerFrames } from "@/lib/frameApi";

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
function SlotEditor({ index, image, shape, onUpload, onDelete, onSwap, isSelected, onSelect, config, onUpdateConfig }) {
  const [isDragReady, setIsDragReady] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) { const r = new FileReader(); r.addEventListener("load", () => onUpload(r.result)); r.readAsDataURL(e.target.files[0]); }
  };

  return (
    <div
      className="relative w-full h-full group"
      draggable={isDragReady}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDragStart={(e) => { e.dataTransfer.setData("slotIndex", index); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragReady(false);
        
        const src = e.dataTransfer.getData("slotIndex");
        const url = e.dataTransfer.getData("photoUrl");
        const files = e.dataTransfer.files;

        if (src && src !== index.toString()) {
          onSwap(parseInt(src), index);
        } else if (url) {
          onUpload(url);
        } else if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => onUpload(ev.target.result);
            reader.readAsDataURL(file);
          }
        }
      }}
      onDragEnd={() => setIsDragReady(false)}
    >
      {/* Inner container for image masking */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          borderRadius: shape === 'rounded' ? '24px' : shape === 'deco' ? '0px 40px 0px 40px' : 0,
          border: shape === 'wavy' ? '4px dashed rgba(0,0,0,0.2)' : 'none',
        }}
      >
        {image ? (
          <div className="pointer-events-auto w-full h-full">
            <Cropper image={image} crop={config.crop} zoom={config.zoom} rotation={config.rotation} aspect={undefined} onCropChange={(c) => onUpdateConfig('crop', c)} onZoomChange={(z) => onUpdateConfig('zoom', z)} onRotationChange={(r) => onUpdateConfig('rotation', r)} showGrid={false}
              style={{ containerStyle: { width: '100%', height: '100%', backgroundColor: 'transparent' }, cropAreaStyle: { border: 'none', boxShadow: 'none' } }} />
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} className="pointer-events-auto absolute inset-0 w-full h-full flex flex-col items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors z-10 bg-black/5">
            <ImagePlus className="w-6 h-6 mb-1 opacity-50" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Klik / Drop</span>
          </button>
        )}
      </div>

      {/* Grip Handle inside the slot when selected */}
      {isSelected && image && (
        <div onMouseDown={() => setIsDragReady(true)} onMouseUp={() => setIsDragReady(false)} onMouseLeave={() => setIsDragReady(false)}
             className="absolute top-2 left-2 z-50 p-2 bg-blue-500 text-white shadow-md rounded cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center brutal-border" title="Tarik untuk memindah slot">
             <GripHorizontal className="w-4 h-4" />
        </div>
      )}
      
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
    </div>
  );
}

// ---- Main Editor ----
function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplateId = searchParams.get("template");
  
  const customFrames = useCustomFrameStore((s) => s.frames);
  const setServerFrames = useCustomFrameStore((s) => s.setServerFrames);
  const customFramesReady = useCustomFrameStore((s) => s.hasHydrated);

  useEffect(() => {
    let active = true;
    fetchServerFrames()
      .then((frames) => { if (active) setServerFrames(frames); })
      .catch((error) => console.error(error));
    return () => { active = false; };
  }, [setServerFrames]);

  const allTemplates = [...templates, ...customFrames.filter(f => f && f.layout && f.layout.length > 0)];
  const [activeTemplateId, setActiveTemplateId] = useState(initialTemplateId || templates[0].id);

  useEffect(() => {
    if (initialTemplateId) setActiveTemplateId(initialTemplateId);
  }, [initialTemplateId]);

  const template = allTemplates.find((t) => t.id === activeTemplateId) || templates[0];

  const globalPhotos = useStore((s) => s.photos);
  const replacePhoto = useStore((s) => s.replacePhoto);
  const [photos, setPhotos] = useState([]);
  const bgColor = useStore((s) => s.bgColor);
  const setBgColor = useStore((s) => s.setBgColor);
  const stickers = useStore((s) => s.stickers);
  const setStickers = useStore((s) => s.setStickers);
  const [customEmoji, setCustomEmoji] = useState("");
  const [customName, setCustomName] = useState("SYZHAA");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [slotConfigs, setSlotConfigs] = useState({});
  const handleUpdateConfig = (index, key, value) => {
    setSlotConfigs(prev => ({
      ...prev,
      [index]: { ...(prev[index] || { zoom: 1, rotation: 0, crop: { x: 0, y: 0 } }), [key]: typeof value === 'function' ? value(prev[index]?.[key] ?? (key === 'zoom' ? 1 : 0)) : value }
    }));
  };
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
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activeDesktopTab, setActiveDesktopTab] = useState('frame'); // 'frame', 'stickers', 'text', 'color'
  const [manualZoom, setManualZoom] = useState(1);

  const [pastPhotos, setPastPhotos] = useState([]);
  const [futurePhotos, setFuturePhotos] = useState([]);
  const isUndoing = useRef(false);

  useEffect(() => {
    if (isUndoing.current) {
      isUndoing.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPastPhotos(p => {
        const last = p[p.length - 1];
        if (JSON.stringify(last) !== JSON.stringify(photos)) {
          return [...p, photos];
        }
        return p;
      });
      setFuturePhotos([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [photos]);

  const handleUndo = useCallback(() => {
    setPastPhotos(p => {
      if (p.length < 2) return p;
      const prev = p[p.length - 2];
      const current = p[p.length - 1];
      setFuturePhotos(f => [current, ...f]);
      isUndoing.current = true;
      setPhotos(prev);
      return p.slice(0, p.length - 1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setFuturePhotos(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setPastPhotos(p => [...p, next]);
      isUndoing.current = true;
      setPhotos(next);
      return f.slice(1);
    });
  }, []);

  const handleZoomIn = useCallback(() => setManualZoom(z => Math.min(3, z + 0.1)), []);
  const handleZoomOut = useCallback(() => setManualZoom(z => Math.max(0.2, z - 0.1)), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleZoomIn, handleZoomOut]);

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
  
  const handleAutoFillPhoto = (url) => {
    const emptyIndex = photos.findIndex(p => p === null);
    if (emptyIndex !== -1) {
      handleUpload(emptyIndex, url);
    } else {
      alert("Semua slot sudah terisi! Silakan drag & drop foto langsung ke slot yang ingin ditukar.");
    }
  };

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
    
    setSelectedSlotIndex(null); // Sembunyikan toolbar sebelum render
    await new Promise(r => setTimeout(r, 100)); // Tunggu render selesai
    
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(templateRef.current, { 
        pixelRatio: 3,
        width: template.width,
        height: template.height,
        style: {
          transform: 'none',
          width: `${template.width}px`,
          height: `${template.height}px`
        }
      });
      const link = document.createElement("a"); link.download = `syzhaa-${template.id}-${Date.now()}.png`; link.href = dataUrl; link.click();
    } catch (err) { console.error("Export failed:", err); alert("Gagal mengunduh foto."); }
    finally { setIsExporting(false); }
  };

  if (!template) return null;

  const slotRadius = template.slotShape === 'rounded' ? 28 : template.slotShape === 'deco' ? '0px 40px 0px 40px' : 0;
  const slotBorder = template.slotBorderWidth ? `${template.slotBorderWidth}px solid ${template.slotBorderColor || '#111111'}` : 'none';

  // Right panel content (Tabbed Desktop / Mobile Overlay)
  const currentTab = mobileTab && mobileTab !== 'photos' ? mobileTab : activeDesktopTab;
  
  const rightPanelContent = (
    <div className="h-full flex flex-col bg-white">
      {/* Desktop Panel Header */}
      <div className="hidden md:flex p-4 border-b-4 border-black justify-between items-center bg-gray-50 shrink-0">
         <h3 className="font-archivo text-lg uppercase tracking-tighter">
            {currentTab === 'frame' && "Pilih Bingkai"}
            {currentTab === 'stickers' && "Stiker & Emoji"}
            {currentTab === 'text' && "Teks Footer"}
            {currentTab === 'color' && "Warna Latar"}
         </h3>
         <button onClick={() => setShowRightPanel(false)} className="hover:bg-gray-200 p-1.5 rounded brutal-border active:scale-95 transition-transform bg-white">
           <X className="w-5 h-5" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white space-y-6">
        {/* Bingkai / Templates */}
        {currentTab === 'frame' && (
          <div>
            <div className="grid grid-cols-2 gap-3 pr-1">
              {allTemplates.map(t => (
                <button key={t.id} onClick={() => setActiveTemplateId(t.id)} className={`relative border-2 ${activeTemplateId === t.id ? 'border-black shadow-[4px_4px_0_#111111] scale-105 z-10' : 'border-gray-300 hover:border-gray-500'} rounded overflow-hidden aspect-[3/4] flex items-center justify-center bg-gray-100 transition-all`}>
                  <div style={{ width: '80%', height: '80%', backgroundColor: t.frameColor, aspectRatio: `${t.width}/${t.height}` }} className="relative shadow-sm overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 w-full h-full">
                        {t.layout.map((s, idx) => (
                          <div key={idx} className="absolute bg-gray-300" style={{ left: `${(s.x/t.width)*100}%`, top: `${(s.y/t.height)*100}%`, width: `${(s.w/t.width)*100}%`, height: `${(s.h/t.height)*100}%` }} />
                        ))}
                      </div>
                  </div>
                  {activeTemplateId === t.id && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 brutal-border" />}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Stickers */}
        {currentTab === 'stickers' && (
          <div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {["✨","🔥","🎀","🍒","⭐","🎸","🌈","⚡","🎈","🧸","🌸","👑","💎","🦋","🍄","🍔","😎","👾","💖","💯","🚀","💅","🍿","🎥"].map((e, i) => (
                <button key={i} onClick={() => handleAddSticker(e)} className="aspect-square rounded brutal-border bg-gray-50 flex items-center justify-center text-2xl hover:bg-yellow-200 hover:-translate-y-1 active:scale-90 transition-all">{e}</button>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <input value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} placeholder="🍕" className="w-16 text-center border-2 border-black rounded font-bold text-xl" maxLength={2} />
              <button onClick={() => { handleAddSticker(customEmoji); setCustomEmoji(""); }} className="flex-1 bg-black text-white text-sm font-bold rounded brutal-border hover:bg-gray-800">Tambah Emoji</button>
            </div>
            <button onClick={handleResetStickers} className="w-full py-2 bg-red-100 text-red-600 border-2 border-red-500 font-bold rounded hover:bg-red-200 brutal-border">Hapus Semua Stiker</button>
            
            <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-200">
              <label className="font-black uppercase text-xs mb-2 block">Upload Stiker Sendiri (AI)</label>
              <button onClick={() => customImageInputRef.current?.click()} className="w-full bg-blue-100 border-2 border-blue-500 text-blue-700 font-bold py-3 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors brutal-border active:scale-95">
                <ImagePlus className="w-4 h-4" /> UNGGAH FOTO KE AI
              </button>
              <input type="file" accept="image/*" ref={customImageInputRef} onChange={handleCustomStickerUpload} className="hidden" />
            </div>
          </div>
        )}

        {/* Name Input */}
        {currentTab === 'text' && (
          <div>
            <label className="font-bold text-gray-500 text-xs mb-2 block">Teks bagian bawah frame (opsional)</label>
            <input 
              type="text" 
              value={customName} 
              onChange={(e) => setCustomName(e.target.value)} 
              className="w-full border-4 border-black rounded-xl p-4 font-black text-center text-2xl uppercase brutal-shadow focus:outline-none focus:translate-y-1 focus:shadow-[2px_2px_0_#111111] transition-all" 
              placeholder="SYZHAA"
              maxLength={15}
            />
          </div>
        )}

        {/* Colors */}
        {currentTab === 'color' && (
          <div>
            <div className="grid grid-cols-4 gap-3">
              {["#111111","#FFFFFF","#F9A8D4","#FCD34D","#86EFAC","#93C5FD","#C4B5FD","#F97316","#80C9ED","#FFF0C7","#e5e7eb","#050505"].map(c => (
                <button key={c} onClick={() => setBgColor(c)} className={`aspect-square rounded-full brutal-border transition-transform hover:scale-110 active:scale-95 ${bgColor === c ? 'ring-4 ring-black ring-offset-2' : ''}`} style={{ backgroundColor: c }} />
              ))}
              <div className="relative aspect-square">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-full opacity-0 absolute inset-0 cursor-pointer z-10" id="colorPicker" />
                <div className="absolute inset-0 rounded-full brutal-border bg-[conic-gradient(red,yellow,green,blue,magenta,red)] flex items-center justify-center" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Download Button (Only shows when mobile overlay is active) */}
      <div className="md:hidden p-4 border-t-4 border-black bg-white">
        <button onClick={handleExport} disabled={isExporting} className="w-full bg-accent text-white font-bold py-3 rounded brutal-border hover:bg-black active:scale-95 transition-all text-sm uppercase tracking-widest">
          {isExporting ? "RENDER..." : "⬇ Download"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-gray-100 flex flex-col relative">
      {loadingStatus && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex flex-col items-center justify-center text-white backdrop-blur-sm">
          <div className="w-12 h-12 mb-4 border-4 border-white border-t-accent rounded-full animate-spin" />
          <h2 className="font-archivo text-2xl uppercase mb-2">Memproses AI...</h2>
          <p className="font-bold uppercase tracking-widest text-sm opacity-80">{loadingStatus}</p>
        </div>
      )}

      {/* TOP BAR */}
      <div className="bg-white border-b-4 border-black px-4 py-3 flex items-center justify-between z-20">
        <div className="flex gap-2">
          <Link href="/" className="flex items-center gap-2 font-archivo text-lg hover:underline brutal-border px-3 py-1 bg-white hover:bg-gray-100 transition-colors"><ArrowLeft className="w-5 h-5" /> Kembali</Link>
          <button onClick={handleZoomOut} className="hidden sm:flex w-8 h-8 bg-white border-2 border-black items-center justify-center brutal-shadow hover:bg-gray-100 font-bold active:translate-y-px" title="Zoom Out (Ctrl -)">-</button>
          <button onClick={handleZoomIn} className="hidden sm:flex w-8 h-8 bg-white border-2 border-black items-center justify-center brutal-shadow hover:bg-gray-100 font-bold active:translate-y-px" title="Zoom In (Ctrl +)">+</button>
        </div>
        
        <span className="text-xs font-bold text-gray-500 hidden lg:block">{template.name} • {template.slots} slot</span>
        
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={isExporting} className="hidden md:flex px-4 py-1.5 bg-[#86efac] text-black rounded brutal-border text-sm font-black transition-transform hover:-translate-y-1 active:translate-y-0">
            {isExporting ? "RENDER..." : "⬇ SIMPAN"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex relative overflow-hidden" style={{ height: 'calc(100dvh - 60px)' }}>

        {/* CENTER - Canvas */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 bg-[url('/checkers.svg')] bg-repeat relative overflow-hidden md:pb-4 pb-20" onClick={() => setSelectedSlotIndex(null)}>

          {/* Floating Toolbar Outside Frame */}
          {selectedSlotIndex !== null && photos[selectedSlotIndex] && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0_#111111] flex items-center p-2 gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="font-bold text-xs uppercase px-2 bg-gray-100 rounded border border-gray-300 hidden sm:block">Foto {selectedSlotIndex + 1}</span>
              <button onClick={() => handleDelete(selectedSlotIndex)} className="p-2 hover:bg-red-100 text-red-500 rounded transition-colors" title="Hapus Foto"><Trash2 className="w-4 h-4" /></button>
              
              <div className="w-px h-8 bg-gray-200 mx-1" />
              
              {/* D-Pad Position Controls */}
              <div className="flex flex-col items-center bg-gray-100 p-1 rounded border border-gray-200">
                <button onClick={() => handleUpdateConfig(selectedSlotIndex, 'crop', c => ({ ...c, y: c.y - 15 }))} className="w-6 h-5 hover:bg-gray-300 rounded text-[10px] flex items-center justify-center active:scale-90 transition-transform">▲</button>
                <div className="flex gap-4">
                  <button onClick={() => handleUpdateConfig(selectedSlotIndex, 'crop', c => ({ ...c, x: c.x - 15 }))} className="w-6 h-5 hover:bg-gray-300 rounded text-[10px] flex items-center justify-center active:scale-90 transition-transform">◀</button>
                  <button onClick={() => handleUpdateConfig(selectedSlotIndex, 'crop', c => ({ ...c, x: c.x + 15 }))} className="w-6 h-5 hover:bg-gray-300 rounded text-[10px] flex items-center justify-center active:scale-90 transition-transform">▶</button>
                </div>
                <button onClick={() => handleUpdateConfig(selectedSlotIndex, 'crop', c => ({ ...c, y: c.y + 15 }))} className="w-6 h-5 hover:bg-gray-300 rounded text-[10px] flex items-center justify-center active:scale-90 transition-transform">▼</button>
              </div>

              <div className="w-px h-8 bg-gray-200 mx-1" />
              
              <div className="flex flex-col gap-1">
                <button onClick={() => handleUpdateConfig(selectedSlotIndex, 'zoom', z => Math.min(4, z + 0.1))} className="w-8 h-6 flex items-center justify-center hover:bg-gray-200 bg-gray-100 rounded font-black text-xs active:scale-95 transition-transform" title="Zoom In">+</button>
                <button onClick={() => handleUpdateConfig(selectedSlotIndex, 'zoom', z => Math.max(1, z - 0.1))} className="w-8 h-6 flex items-center justify-center hover:bg-gray-200 bg-gray-100 rounded font-black text-xs active:scale-95 transition-transform" title="Zoom Out">-</button>
              </div>

              <div className="w-px h-8 bg-gray-200 mx-1" />
              
              <button onClick={() => handleUpdateConfig(selectedSlotIndex, 'rotation', r => r + 90)} className="w-8 h-10 flex items-center justify-center hover:bg-gray-200 bg-gray-100 rounded font-black text-sm active:scale-95 transition-transform" title="Putar">↻</button>
            </div>
          )}

          <div style={{ width: template.width * scaleFactor * manualZoom, height: template.height * scaleFactor * manualZoom, position: 'relative' }}>
            <div ref={templateRef} style={{ width: template.width, height: template.height, transform: `scale(${scaleFactor * manualZoom})`, transformOrigin: 'top left' }}
              className="absolute top-0 left-0 shadow-2xl overflow-visible"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
              onDrop={(e) => {
                e.preventDefault();
                const url = e.dataTransfer.getData("photoUrl");
                if (url) handleAutoFillPhoto(url);
                else {
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (ev) => handleAutoFillPhoto(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }
                }
              }}
            >
              <div className="w-full h-full relative overflow-hidden flex flex-col items-center bg-white" style={{ backgroundColor: bgColor }}>
                {template.specialFrame === 'pixenze' && <PixenzeFrameDecor width={template.width} height={template.height} />}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                  {template.layout.map((slot, i) => (
                    <div key={i} className="absolute pointer-events-auto" style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h, backgroundColor: template.slotBgColor || '#e5e7eb', zIndex: 10 + (selectedSlotIndex === i ? 10 : 0) }}>
                      <SlotEditor index={i} image={photos[i]} shape={template.slotShape} onUpload={(url) => handleUpload(i, url)} onDelete={() => handleDelete(i)} onSwap={handleSwap} isSelected={selectedSlotIndex === i} onSelect={() => setSelectedSlotIndex(i)} config={slotConfigs[i] || { zoom: 1, rotation: 0, crop: { x: 0, y: 0 } }} onUpdateConfig={(k, v) => handleUpdateConfig(i, k, v)} />
                    </div>
                  ))}
                </div>
                
                {/* OVERLAY IMAGE */}
                {overlayUrl && (
                  <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <img src={overlayUrl} alt="Overlay Bingkai" className="w-full h-full object-fill" />
                  </div>
                )}
                
                {stickers.map((st, i) => <DraggableSticker key={i} index={i} sticker={st} scaleFactor={scaleFactor} updateStickerPosition={updateStickerPosition} onUpdateSize={updateStickerSize} onDelete={handleDeleteSticker} />)}
                {!template.hideDefaultFooter && (
                  <div className="absolute bottom-8 w-full text-center z-10" style={{ color: getContrastColor(bgColor) }}>
                    <span className="font-archivo text-[50px] uppercase font-bold leading-none block">{customName || "SYZHAA"}</span>
                    <span className="text-sm font-bold">booth.ktik.me</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FIGMA STYLE BOTTOM NAV BAR (DESKTOP) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-1 bg-white border-4 border-black p-1.5 rounded-full brutal-shadow-lg shadow-[8px_8px_0_#111111]">
            <button 
              onClick={() => { setShowLeftPanel(!showLeftPanel); setShowRightPanel(false); setActiveDesktopTab(null); }} 
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-black uppercase text-xs transition-colors ${showLeftPanel ? 'bg-black text-white' : 'hover:bg-gray-200 text-black'}`}
            >
              <ImageIcon className="w-5 h-5" /> Galeri
            </button>
            
            <div className="w-1 h-8 bg-gray-200 rounded-full mx-1" />
            
            <button 
              onClick={() => { setActiveDesktopTab('frame'); setShowRightPanel(true); setShowLeftPanel(false); }} 
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-black uppercase text-xs transition-colors ${activeDesktopTab === 'frame' && showRightPanel ? 'bg-accent text-white' : 'hover:bg-gray-200 text-black'}`}
            >
              <LayoutTemplate className="w-5 h-5" /> Bingkai
            </button>
            <button 
              onClick={() => { setActiveDesktopTab('stickers'); setShowRightPanel(true); setShowLeftPanel(false); }} 
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-black uppercase text-xs transition-colors ${activeDesktopTab === 'stickers' && showRightPanel ? 'bg-accent text-white' : 'hover:bg-gray-200 text-black'}`}
            >
              <Plus className="w-5 h-5" /> Stiker
            </button>
            <button 
              onClick={() => { setActiveDesktopTab('text'); setShowRightPanel(true); setShowLeftPanel(false); }} 
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-black uppercase text-xs transition-colors ${activeDesktopTab === 'text' && showRightPanel ? 'bg-accent text-white' : 'hover:bg-gray-200 text-black'}`}
            >
              <span className="font-archivo text-xl leading-none">T</span> Teks
            </button>
            <button 
              onClick={() => { setActiveDesktopTab('color'); setShowRightPanel(true); setShowLeftPanel(false); }} 
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-black uppercase text-xs transition-colors ${activeDesktopTab === 'color' && showRightPanel ? 'bg-accent text-white' : 'hover:bg-gray-200 text-black'}`}
            >
              <PaletteIcon className="w-5 h-5" /> Warna
            </button>
          </div>
        </div>

        {/* LEFT PANEL - Photo Gallery (Desktop Overlay) */}
        <div 
          className={`absolute top-0 left-0 bottom-0 z-30 hidden md:flex transition-all duration-300 ease-in-out bg-white shadow-2xl overflow-hidden ${showLeftPanel ? 'w-56 lg:w-64 border-r-4 border-black' : 'w-0 border-r-0'}`}
        >
          <div className="w-56 lg:w-64 flex-1 h-full overflow-hidden">
            <PhotoGallery onSelectPhoto={handleAutoFillPhoto} />
          </div>
        </div>

        {/* RIGHT PANEL - Tools (Desktop Overlay) */}
        <div 
          className={`absolute top-0 right-0 bottom-0 z-30 hidden md:flex flex-col transition-all duration-300 ease-in-out bg-white shadow-2xl overflow-hidden ${showRightPanel ? 'w-64 lg:w-72 border-l-4 border-black' : 'w-0 border-l-0'}`}
        >
          <div className="w-64 lg:w-72 flex-1 h-full overflow-hidden">
            {rightPanelContent}
          </div>
        </div>

        {/* MOBILE OVERLAYS */}
        {mobileTab === "photos" && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div className="w-72 bg-white border-r-4 border-black shadow-2xl">
              <PhotoGallery onSelectPhoto={(url) => { handleAutoFillPhoto(url); setMobileTab(null); }} />
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
