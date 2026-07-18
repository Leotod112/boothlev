"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, Palette,
  Move, Square, Maximize2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCustomFrameStore, DEFAULT_CUSTOM_FRAME } from "@/store/useCustomFrameStore";

const COLORS = ["#111111","#FFFFFF","#FDE047","#F9A8D4","#4F46E5","#22C55E","#EF4444","#F97316","#80C9ED","#FFF0C7","#050505","#e5e7eb"];

const SHAPES = [
  { id: "square", label: "Persegi" },
  { id: "rounded", label: "Rounded" },
  { id: "deco", label: "Deco" },
  { id: "wavy", label: "Wavy" },
];

const SHAPE_BORDER_RADIUS = {
  square: 0,
  rounded: 24,
  deco: "0px 40px 0px 40px",
  wavy: 0,
};

export default function CustomFramePage() {
  const router = useRouter();
  const store = useCustomFrameStore();
  const [ef, setEf] = useState(store.editingFrame || DEFAULT_CUSTOM_FRAME);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [scale, setScale] = useState(0.5);
  const [gridRows, setGridRows] = useState(2);
  const [gridCols, setGridCols] = useState(1);
  const [bottomMargin, setBottomMargin] = useState(35);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragStart = useRef(null);
  const savedFrames = useCustomFrameStore((s) => s.frames);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth - 32;
        setScale(Math.min(1, cw / ef.width));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ef.width]);

  const update = useCallback((updates) => {
    setEf(prev => ({ ...prev, ...updates }));
  }, []);

  const updateSlot = useCallback((i, u) => {
    setEf(prev => {
      const l = [...prev.layout];
      l[i] = { ...l[i], ...u };
      return { ...prev, layout: l };
    });
  }, []);

  const handleSave = () => {
    if (!ef.name.trim()) return alert("Nama bingkai harus diisi!");
    const final = { ...ef, id: ef.id || `custom-${Date.now()}` };
    store.saveFrame(final);
    alert(`Bingkai "${ef.name}" disimpan!`);
    router.push("/templates");
  };

  // mouse handlers for dragging slots
  const handleSlotPointerDown = (i, e) => {
    e.preventDefault();
    const slot = ef.layout[i];
    setSelectedSlot(i);
    setDragging(i);
    dragStart.current = { x: e.clientX, y: e.clientY, slotX: slot.x, slotY: slot.y };

    const onMove = (me) => {
      const dx = (me.clientX - dragStart.current.x) / scale;
      const dy = (me.clientY - dragStart.current.y) / scale;
      updateSlot(i, { x: Math.max(0, dragStart.current.slotX + dx), y: Math.max(0, dragStart.current.slotY + dy) });
    };
    const onUp = () => { setDragging(null); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // resize handlers
  const handleResizeStart = (i, corner, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(corner);
    const slot = ef.layout[i];
    setSelectedSlot(i);
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      sx: slot.x, sy: slot.y, sw: slot.w, sh: slot.h,
      corner,
    };

    const onMove = (me) => {
      const dx = (me.clientX - dragStart.current.x) / scale;
      const dy = (me.clientY - dragStart.current.y) / scale;
      const { sx, sy, sw, sh, corner: c } = dragStart.current;
      let updates = {};
      if (c.includes('e')) updates.w = Math.max(80, sw + dx);
      if (c.includes('w')) { updates.w = Math.max(80, sw - dx); updates.x = sx + dx; }
      if (c.includes('s')) updates.h = Math.max(80, sh + dy);
      if (c.includes('n')) { updates.h = Math.max(80, sh - dy); updates.y = sy + dy; }
      updateSlot(i, updates);
    };
    const onUp = () => { setResizing(null); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const buildGrid = (rows, cols) => {
    const n = rows * cols;
    const gap = 18;
    const m = 35;
    const bm = bottomMargin;
    const aw = ef.width - m * 2 - gap * (cols - 1);
    const sw = Math.floor(aw / cols);
    const ah = ef.height - m - bm - gap * (rows - 1);
    const sh = Math.floor(ah / rows);
    const layout = [];
    for (let i = 0; i < n; i++) {
      layout.push({ x: m + (i % cols) * (sw + gap), y: m + Math.floor(i / cols) * (sh + gap), w: sw, h: sh });
    }
    setGridRows(rows);
    setGridCols(cols);
    setEf(prev => ({ ...prev, slots: n, layout }));
    setSelectedSlot(null);
  };

  const addRow = () => buildGrid(gridRows + 1, gridCols);
  const addCol = () => buildGrid(gridRows, gridCols + 1);

  const borderStr = (s) => ef.slotBorderWidth > 0 ? `${ef.slotBorderWidth}px solid ${ef.slotBorderColor}` : 'none';
  const slotRadius = (s) => {
    if (ef.slotShape === 'rounded') return 24;
    if (ef.slotShape === 'deco') return '0px 40px 0px 40px';
    return 0;
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white brutal-border-b px-4 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/templates" className="inline-flex items-center font-archivo text-xl hover:underline decoration-4">
            <ArrowLeft className="mr-2 w-5 h-5" /> Kembali
          </Link>
          <input
            value={ef.name}
            onChange={(e) => update({ name: e.target.value })}
            className="font-archivo text-2xl bg-transparent border-b-4 border-black px-2 py-1 max-w-[260px] focus:outline-none focus:bg-yellow-100"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-500">{gridRows}×{gridCols} ({ef.layout.length} slot)</span>
          <Button onClick={handleSave} variant="primary" className="gap-2">
            <Save className="w-5 h-5" /> Simpan
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[url('/checkers.svg')] bg-repeat relative overflow-hidden"
        >
          <div
            style={{
              width: ef.width * scale,
              height: ef.height * scale,
              position: 'relative',
            }}
          >
            <div
              ref={canvasRef}
              className="absolute top-0 left-0 shadow-2xl overflow-hidden"
              style={{
                width: ef.width,
                height: ef.height,
                backgroundColor: ef.frameColor,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Grid background lines when editing */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 ${ef.width} ${ef.height}`}>
                <defs>
                  <pattern id="builder-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#builder-grid)" />
              </svg>

              {/* Slots */}
              {ef.layout.map((slot, i) => (
                <div key={i} style={{ position: 'absolute', left: slot.x, top: slot.y, width: slot.w, height: slot.h, zIndex: 10 }}>
                  {/* Slot background / placeholder */}
                  <div
                    className={`w-full h-full overflow-hidden flex items-center justify-center cursor-grab transition-shadow ${selectedSlot === i ? 'ring-4 ring-blue-500 ring-offset-2 z-20' : ''}`}
                    style={{
                      backgroundColor: ef.slotBgColor,
                      borderRadius: slotRadius(i),
                      border: borderStr(i),
                    }}
                    onPointerDown={(e) => handleSlotPointerDown(i, e)}
                  >
                    <div className="flex flex-col items-center text-gray-400 select-none opacity-60">
                      <Move className="w-6 h-6" />
                      <span className="text-[10px] font-bold mt-1 uppercase">Slot {i+1}</span>
                    </div>
                  </div>

                  {/* Resize handles */}
                  {selectedSlot === i && (
                    <>
                      {['nw','ne','sw','se'].map(corner => (
                        <div
                          key={corner}
                          className="absolute w-5 h-5 bg-white brutal-border z-30 cursor-nw-resize flex items-center justify-center"
                          style={{
                            [corner.includes('n') ? 'top' : 'bottom']: -10,
                            [corner.includes('w') ? 'left' : 'right']: -10,
                            cursor: corner + '-resize',
                          }}
                          onPointerDown={(e) => handleResizeStart(i, corner, e)}
                        >
                          <Maximize2 className="w-2.5 h-2.5" />
                        </div>
                      ))}
                      {/* Delete button */}
                      {ef.layout.length > 1 && (
                        <button
                          className="absolute -top-8 -right-8 z-30 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 brutal-border text-xs"
                          onClick={() => {
                            setEf(prev => ({
                              ...prev,
                              slots: prev.slots - 1,
                              layout: prev.layout.filter((_, j) => j !== i),
                            }));
                            setSelectedSlot(null);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="w-full md:w-80 bg-white brutal-border-l p-5 overflow-y-auto md:h-[calc(100dvh-80px)] space-y-6">
          <h2 className="font-archivo text-xl uppercase tracking-tight">Kontrol Frame</h2>

          {/* Dimensions */}
          <div>
            <label className="font-black uppercase text-xs mb-2 block">Ukuran (px)</label>
            <div className="flex gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-500">Lebar</span>
                <input type="number" value={ef.width} onChange={(e) => update({ width: Math.max(200, +e.target.value) })}
                  className="w-full border-2 border-black p-2 font-bold text-sm rounded" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500">Tinggi</span>
                <input type="number" value={ef.height} onChange={(e) => update({ height: Math.max(200, +e.target.value) })}
                  className="w-full border-2 border-black p-2 font-bold text-sm rounded" />
              </div>
            </div>
          </div>

          {/* Bottom Margin */}
          <div>
            <label className="font-black uppercase text-xs mb-2 flex items-center gap-1">
              Margin Bawah (Polaroid)
            </label>
            <div className="flex gap-2 items-center">
              <input type="range" min="10" max="200" value={bottomMargin}
                onChange={(e) => setBottomMargin(+e.target.value)}
                className="flex-1" />
              <span className="font-bold text-sm w-9">{bottomMargin}px</span>
            </div>
            <div className="flex gap-1 mt-1">
              {[20, 35, 60, 100, 150, 200].map(v => (
                <button key={v} onClick={() => setBottomMargin(v)}
                  className={`px-2 py-1 text-[10px] font-bold rounded brutal-border ${bottomMargin === v ? 'bg-black text-white' : 'bg-white'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Color */}
          <div>
            <label className="font-black uppercase text-xs mb-2 flex items-center gap-1"><Palette className="w-3 h-3" /> Warna Frame</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map(c => (
                <button key={c} onClick={() => update({ frameColor: c })}
                  className={`w-8 h-8 rounded-full brutal-border ${ef.frameColor === c ? 'ring-4 ring-black ring-offset-2 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Slot Background Color */}
          <div>
            <label className="font-black uppercase text-xs mb-2">Warna Slot</label>
            <div className="flex flex-wrap gap-1.5">
              {["#050505","#e5e7eb","#FFFFFF","#FDE047","#F9A8D4","#4F46E5","#22C55E","#FFF0C7"].map(c => (
                <button key={c} onClick={() => update({ slotBgColor: c })}
                  className={`w-8 h-8 rounded-full brutal-border ${ef.slotBgColor === c ? 'ring-4 ring-black ring-offset-2 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Slot Border */}
          <div>
            <label className="font-black uppercase text-xs mb-2">Border Slot</label>
            <div className="flex gap-2 items-center mb-2">
              <span className="text-xs font-bold">Tebal:</span>
              <input type="range" min="0" max="20" value={ef.slotBorderWidth}
                onChange={(e) => update({ slotBorderWidth: +e.target.value })}
                className="flex-1" />
              <span className="text-xs font-bold w-6">{ef.slotBorderWidth}px</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["#111111","#FFFFFF","#FFF0C7","#FDE047","#F9A8D4","#80C9ED","#EF4444"].map(c => (
                <button key={c} onClick={() => update({ slotBorderColor: c })}
                  className={`w-7 h-7 rounded-full brutal-border ${ef.slotBorderColor === c ? 'ring-2 ring-black scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Slot Shape */}
          <div>
            <label className="font-black uppercase text-xs mb-2"><Square className="w-3 h-3 inline" /> Bentuk Slot</label>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map(s => (
                <button key={s.id} onClick={() => update({ slotShape: s.id })}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded brutal-border ${ef.slotShape === s.id ? 'bg-black text-white' : 'bg-white'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t-4 border-black">
            <label className="font-black uppercase text-xs mb-1">Preset Grid</label>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => buildGrid(1, 2)} variant={gridRows === 1 && gridCols === 2 ? "primary" : "outline"} className="gap-1 text-xs">
                1×2
              </Button>
              <Button onClick={() => buildGrid(2, 2)} variant={gridRows === 2 && gridCols === 2 ? "primary" : "outline"} className="gap-1 text-xs">
                2×2
              </Button>
              <Button onClick={() => buildGrid(1, 3)} variant={gridRows === 1 && gridCols === 3 ? "primary" : "outline"} className="gap-1 text-xs">
                1×3
              </Button>
              <Button onClick={() => buildGrid(2, 3)} variant={gridRows === 2 && gridCols === 3 ? "primary" : "outline"} className="gap-1 text-xs">
                2×3
              </Button>
              <Button onClick={() => buildGrid(3, 3)} variant={gridRows === 3 && gridCols === 3 ? "primary" : "outline"} className="gap-1 text-xs">
                3×3
              </Button>
              <Button onClick={() => buildGrid(3, 4)} variant={gridRows === 3 && gridCols === 4 ? "primary" : "outline"} className="gap-1 text-xs">
                3×4
              </Button>
            </div>
            <label className="font-black uppercase text-xs flex items-center gap-1 mt-2">
              <Plus className="w-3 h-3" /> Tambah Baris / Kolom
            </label>
            <div className="flex gap-2">
              <Button onClick={addCol} variant="outline" className="flex-1 gap-1 text-xs">
                ← Kolom ({gridCols})
              </Button>
              <Button onClick={addRow} variant="outline" className="flex-1 gap-1 text-xs">
                Baris ↓ ({gridRows})
              </Button>
            </div>
            <Button onClick={() => {
              setEf(prev => ({ ...DEFAULT_CUSTOM_FRAME, id: prev.id, name: prev.name }));
              setSelectedSlot(null);
              setGridRows(2); setGridCols(1);
            }} variant="ghost" className="w-full gap-2 text-red-500">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          </div>

          {/* Preview hint */}
          <div className="bg-gray-100 p-4 rounded-lg text-xs space-y-2">
            <p className="font-bold uppercase text-gray-600">💡 Tips:</p>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li>Klik preset grid (1×2, 2×3, dll) untuk atur jumlah slot</li>
              <li>"← Kolom" tambah slot ke samping, "Baris ↓" tambah ke bawah</li>
              <li>Klik slot untuk memilih (muncul handle resize)</li>
              <li>Simpan, lalu pilih di menu template!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
