"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Camera, ImagePlus, Clock, ArrowRight, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store/useStore";

import { templates } from "@/lib/templates";

const BATCH_OPTIONS = [2, 4, 6, 8, 10];
const TIMER_OPTIONS = [2, 3, 5, 10];

function BoothPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const customFrames = useCustomFrameStore((s) => s.frames);
  const selectedTemplate = [...templates, ...customFrames].find((t) => t.id === templateId);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [permissionState, setPermissionState] = useState("checking"); // 'checking' | 'prompting' | 'granted' | 'denied'
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const gallery = useStore((s) => s.photoGallery);
  const [localPhotos, setLocalPhotos] = useState([]);
  const [batchCount, setBatchCount] = useState(4);
  const [timerSec, setTimerSec] = useState(3);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(true);
  const addToGallery = useStore((s) => s.addToGallery);
  const removeFromGallery = useStore((s) => s.removeFromGallery);

  // Restore photos from gallery on mount
  useEffect(() => {
    if (gallery.length > 0) {
      setLocalPhotos([...gallery]);
      setShowSettings(false);
    }
  }, []);

  // Check initial permission status on mount
  useEffect(() => {
    const checkPerm = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        if (result.state === 'granted') {
          startCamera();
        } else if (result.state === 'denied') {
          setPermissionState('denied');
        } else {
          setPermissionState('prompting'); // 'prompt' means we need to ask
        }
        
        result.onchange = () => {
          if (result.state === 'granted') startCamera();
          else if (result.state === 'denied') { setPermissionState('denied'); stopCamera(); }
        };
      } catch (e) {
        // Fallback for browsers that don't support permissions.query for camera
        setPermissionState('prompting');
      }
    };
    checkPerm();
    return () => stopCamera();
  }, []);

  const requestCameraAccess = () => {
    startCamera();
  };

  const startCamera = async () => {
    try {
      setPermissionState('prompting');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setPermissionState('granted');
      setError("");
    } catch (err) {
      console.error("Camera Error:", err);
      setPermissionState('denied');
      if (err.name === 'NotAllowedError') {
        setError("Izin kamera ditolak browser. Cek ikon gembok (🔒) di URL bar dan izinkan akses kamera, lalu refresh.");
      } else if (err.name === 'NotFoundError') {
        setError("Tidak ada kamera yang terdeteksi di perangkat ini.");
      } else if (err.name === 'NotReadableError') {
        setError("Kamera sedang digunakan oleh aplikasi lain (Zoom, Meet, dll). Tutup dulu aplikasinya.");
      } else {
        setError(`Gagal mengakses kamera: ${err.message || err.name}`);
      }
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

  const runCountdown = (seconds, callback) => {
    let count = seconds;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) setCountdown(count);
      else { clearInterval(interval); setCountdown(null); callback(); }
    }, 1000);
  };

  const startBatch = () => {
    setShowSettings(false);
    setIsBatchRunning(true);
    setBatchProgress(0);
    let taken = 0;

    const shootNext = () => {
      if (taken >= batchCount) {
        setIsBatchRunning(false);
        return;
      }
      setBatchProgress(taken + 1);
      runCountdown(timerSec, () => {
        takePhoto();
        taken++;
        setTimeout(shootNext, 800);
      });
    };

    shootNext();
  };

  const handleSingleShot = () => {
    setShowSettings(false);
    runCountdown(timerSec, () => takePhoto());
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
    removeFromGallery(index);
  };

  const proceedToTemplates = () => {
    stopCamera();
    if (templateId) {
      router.push(`/editor?template=${templateId}`);
    } else {
      router.push("/templates");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-white brutal-border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <button onClick={() => {
          stopCamera();
          if (templateId) router.push(`/templates`);
          else router.push("/");
        }} className="font-archivo text-xl hover:underline decoration-4">
          ← Kembali
        </button>
        <div className="font-archivo text-xl uppercase tracking-tighter">SYZHAA</div>
        <div className="text-sm font-bold text-gray-500">{localPhotos.length} foto</div>
      </div>

      {permissionState === 'prompting' && !error ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white brutal-border brutal-shadow-lg w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b-4 border-black bg-primary">
              <h3 className="font-archivo text-xl uppercase tracking-tighter text-center">Izin Kamera</h3>
            </div>
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center brutal-border mb-2 animate-bounce">
                <Camera className="w-8 h-8" />
              </div>
              <p className="font-bold text-lg leading-tight">Syzhaa Booth butuh akses kamera kamu nih!</p>
              <p className="text-xs text-gray-600 font-medium mb-2">
                Biar bisa jepret foto langsung dari browser. Tenang aja, ini aman 100% dan ga disimpan di server tanpa izin.
              </p>
              <Button onClick={requestCameraAccess} className="w-full bg-accent text-white hover:bg-black text-lg h-14">
                OKE, IZINKAN!
              </Button>
              <p className="text-[10px] text-gray-400 font-bold mt-2">
                Nanti akan muncul popup browser, klik "Allow" atau "Izinkan".
              </p>
            </div>
          </div>
        </div>
      ) : permissionState === 'denied' || error ? (
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

              {/* Batch progress overlay */}
              {isBatchRunning && countdown === null && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded brutal-border text-xs font-bold z-10">
                  Memproses foto {batchProgress}/{batchCount}...
                </div>
              )}
            </div>

            {/* Settings panel */}
            {showSettings && localPhotos.length === 0 && (
              <div className="w-full max-w-lg bg-white brutal-border brutal-shadow-sm p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4" />
                  <span className="font-black uppercase text-xs">Pengaturan Foto</span>
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <label className="text-[10px] font-bold uppercase block mb-1">Jumlah Foto</label>
                    <div className="flex gap-1.5">
                      {BATCH_OPTIONS.map(v => (
                        <button key={v} onClick={() => setBatchCount(v)}
                          className={`px-3 py-1.5 text-xs font-bold rounded brutal-border ${batchCount === v ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase block mb-1"><Clock className="w-3 h-3 inline" /> Timer (detik)</label>
                    <div className="flex gap-1.5">
                      {TIMER_OPTIONS.map(v => (
                        <button key={v} onClick={() => setTimerSec(v)}
                          className={`px-3 py-1.5 text-xs font-bold rounded brutal-border ${timerSec === v ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
                          {v}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 flex-wrap justify-center">
              {!isBatchRunning ? (
                <>
                  {localPhotos.length === 0 ? (
                    <Button onClick={startBatch} className="bg-accent text-white hover:bg-black h-14 px-8 text-lg">
                      <Camera className="mr-2 w-5 h-5" /> MULAI {batchCount} FOTO
                    </Button>
                  ) : (
                    <Button onClick={handleSingleShot} className="bg-accent text-white hover:bg-black h-14 px-8 text-lg">
                      <Camera className="mr-2 w-5 h-5" /> AMBIL LAGI
                    </Button>
                  )}
                  <Button onClick={() => document.getElementById("fileUpload2").click()} variant="outline" className="h-14 px-6">
                    <ImagePlus className="mr-2 w-4 h-4" /> UPLOAD
                  </Button>
                </>
              ) : (
                <div className="bg-yellow-100 border-4 border-black px-6 py-3 rounded brutal-shadow-sm text-center">
                  <p className="font-bold uppercase text-sm">Mengambil foto...</p>
                  <p className="text-xs mt-1">Progress: {batchProgress}/{batchCount}</p>
                </div>
              )}
              <input id="fileUpload2" type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </div>
          </div>

          {/* Sidebar - Photo list + proceed */}
          <div className="w-full md:w-72 bg-white border-t-4 md:border-t-0 md:border-l-4 border-black flex flex-col">
            <div className="p-3 border-b-4 border-black flex items-center justify-between">
              <h3 className="font-archivo text-lg uppercase">Foto Kamu</h3>
              <span className="text-xs font-bold text-gray-500">{localPhotos.length} foto</span>
            </div>
            
            {/* Show which template is selected, if any */}
            {selectedTemplate && (
              <div className="bg-yellow-100 p-2 text-xs font-bold uppercase text-center brutal-border-b">
                Mode: {selectedTemplate.name}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {localPhotos.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold uppercase">Belum ada foto</p>
                  <p className="text-[10px] mt-1">Atur jumlah & timer, lalu mulai</p>
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
                {templateId ? "SELESAI" : "PILIH BINGKAI"} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-[10px] text-gray-500 text-center mt-2 font-bold uppercase">
                {localPhotos.length === 0 ? "Atur lalu mulai foto" : `${localPhotos.length} foto siap`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BoothPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <BoothPageContent />
    </Suspense>
  );
}
