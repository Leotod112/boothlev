"use client";
import { useRef } from "react";
import { Trash2, Camera, ImagePlus } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function PhotoGallery({ onSelectPhoto, setActiveTab }) {
  const gallery = useStore((s) => s.photoGallery);
  const addToGallery = useStore((s) => s.addToGallery);
  const removeFromGallery = useStore((s) => s.removeFromGallery);
  const fileRef = useRef(null);

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      const canvas = document.createElement("canvas");
      await new Promise((resolve) => { video.onloadedmetadata = () => { canvas.width = video.videoWidth; canvas.height = video.videoHeight; resolve(); }; });
      await new Promise((r) => setTimeout(r, 500));
      canvas.getContext("2d").drawImage(video, 0, 0);
      stream.getTracks().forEach(t => t.stop());
      addToGallery(canvas.toDataURL("image/jpeg", 0.85));
    } catch (e) {
      // fallback: open file picker
      fileRef.current?.click();
    }
  };

  const handleUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => addToGallery(ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b-4 border-black bg-white flex items-center justify-between">
        <h3 className="font-archivo text-lg uppercase tracking-tight">Foto</h3>
        <span className="text-xs font-bold text-gray-500">{gallery.length} foto</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {gallery.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold uppercase">Belum ada foto</p>
            <p className="text-[10px] mt-1">Ambil foto atau upload dulu</p>
          </div>
        )}
        {gallery.map((url, i) => (
          <div key={i} className="group relative rounded-md overflow-hidden brutal-border cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("photoUrl", url);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => onSelectPhoto?.(url)}
          >
            <img src={url} alt={`Foto ${i+1}`} className="w-full h-24 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button
              onClick={(e) => { e.stopPropagation(); removeFromGallery(i); }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              #{i+1}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t-4 border-black bg-white space-y-2">
        <button onClick={handleCapture}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-black text-white font-bold text-xs uppercase rounded brutal-border hover:bg-gray-800 active:scale-95 transition-all">
          <Camera className="w-4 h-4" /> Ambil Foto
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black font-bold text-xs uppercase rounded brutal-border hover:bg-gray-100 active:scale-95 transition-all">
          <ImagePlus className="w-4 h-4" /> Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      </div>
    </div>
  );
}
