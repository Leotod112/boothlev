"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, ImagePlus, Check, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store/useStore";

export default function BoothPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [localPhotos, setLocalPhotos] = useState([]);
  const addToGallery = useStore((s) => s.addToGallery);
  const gallery = useStore((s) => s.photoGallery);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setHasPermission(true);
      setError("");
    } catch (err) {
      setError("Gagal mengakses kamera. Pastikan kamu sudah memberikan izin kamera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    addToGallery(dataUrl);
    setLocalPhotos((prev) => [...prev, dataUrl]);
  };

  const handleTakePhoto = () => {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) setCountdown(count);
      else { clearInterval(interval); setCountdown(null); takePhoto(); }
    }, 1000);
  };

  const handleUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const r = new FileReader();
      r.onload = (ev) => { addToGallery(ev.target.result); setLocalPhotos((prev) => [...prev, ev.target.result]); };
      r.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const deletePhoto = (index) => {
    setLocalPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const proceedToTemplates = () => {
    stopCamera();
    router.push("/templates");
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white brutal-border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-archivo text-xl hover:underline decoration-4">← Beranda</Link>
        <div className="font-archivo text-xl uppercase tracking-tighter">SYZHAA</div>
        <div className="text-sm font-bold text-gray-500">{localPhotos.length} foto</div>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-red-200 border-4 border-black p-6 shadow-[8px_8px_0_#111111] max-w-md text-center">
            <h2 className="font-archivo text-2xl mb-4">KAMERA ERROR</h2>
            <p className="font-medium text-red-900 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={startCamera} className="w-full">COBA LAGI</Button>
              <Button onClick={() => document.getElementById("fileUpload").click()} variant="outline" className="w-full">
                <ImagePlus className="mr-2 w-4 h-4" /> UPLOAD FOTO
              </Button>
              <input id="fileUpload" type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row">
          {/* Camera area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="relative w-full max-w-lg aspect-[3/4] md:aspect-video bg-black brutal-border brutal-shadow overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              <canvas ref={canvasRef} className="hidden" />
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                  <span className="text-white font-archivo text-9xl drop-shadow-md animate-ping">{countdown}</span>
                </div>
              )}
              {isFlashing && <div className="absolute inset-0 bg-white z-20 opacity-100 transition-opacity duration-100" />}
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={handleTakePhoto} className="bg-accent text-white hover:bg-black h-14 px-8 text-lg">
                <Camera className="mr-2 w-5 h-5" /> {localPhotos.length === 0 ? "AMBIL FOTO" : "AMBIL LAGI"}
              </Button>
              <Button onClick={() => document.getElementById("fileUpload2").click()} variant="outline" className="h-14 px-6">
                <ImagePlus className="mr-2 w-4 h-4" /> UPLOAD
              </Button>
              <input id="fileUpload2" type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </div>
          </div>

          {/* Sidebar - Photo list + proceed */}
          <div className="w-full md:w-72 bg-white border-t-4 md:border-t-0 md:border-l-4 border-black flex flex-col">
            <div className="p-3 border-b-4 border-black flex items-center justify-between">
              <h3 className="font-archivo text-lg uppercase">Foto Kamu</h3>
              <span className="text-xs font-bold text-gray-500">max 10</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {localPhotos.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold uppercase">Belum ada foto</p>
                </div>
              )}
              {localPhotos.map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 brutal-border rounded p-1.5">
                  <img src={url} alt={`Foto ${i+1}`} className="w-14 h-14 object-cover rounded border-2 border-black shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold block truncate">Foto #{i+1}</span>
                  </div>
                  <button onClick={() => deletePhoto(i)} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-3 border-t-4 border-black">
              <Button onClick={proceedToTemplates} disabled={localPhotos.length === 0} className="w-full h-14 bg-primary text-black hover:bg-[#86efac] text-lg">
                PILIH BINGKAI <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-[10px] text-gray-500 text-center mt-2 font-bold uppercase">
                {localPhotos.length === 0 ? "Ambil minimal 1 foto dulu" : `${localPhotos.length} foto siap`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
