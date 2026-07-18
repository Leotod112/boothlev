"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchServerFrames, deleteServerFrame } from "@/lib/frameApi";
import { templates as builtInTemplates } from "@/lib/templates";

export default function AdminPage() {
  const [serverFrames, setServerFrames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFrames = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchServerFrames();
      setServerFrames(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFrames();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Yakin mau menghapus bingkai "${name}" dari database server?`)) return;
    
    try {
      await deleteServerFrame(id);
      setServerFrames(prev => prev.filter(f => f.id !== id));
      
      // Hapus juga dari localStorage agar browser tidak bingung
      const localDataStr = localStorage.getItem('syzhaa-custom-frames');
      if (localDataStr) {
        try {
          const localData = JSON.parse(localDataStr);
          if (localData.state && localData.state.frames) {
            localData.state.frames = localData.state.frames.filter(f => f.id !== id);
            localStorage.setItem('syzhaa-custom-frames', JSON.stringify(localData));
          }
        } catch(e) {}
      }

    } catch (err) {
      alert("Gagal menghapus bingkai: " + err.message);
    }
  };

  return (
    <div className="min-h-[100dvh] p-6 md:p-12 bg-gray-100">
      <nav className="mb-8 flex items-center justify-between">
         <Link href="/" className="font-archivo text-xl uppercase tracking-tighter hover:underline decoration-4 underline-offset-4 flex items-center gap-2">
           <ArrowLeft className="w-5 h-5" /> Kembali ke Beranda
         </Link>
         <Button onClick={loadFrames} variant="outline" className="gap-2 bg-white">
           <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
         </Button>
      </nav>

      <div className="max-w-4xl mx-auto">
        <h1 className="font-archivo text-4xl uppercase tracking-tighter mb-2">Panel Admin</h1>
        <p className="text-gray-600 mb-8 font-medium">Kelola daftar bingkai yang tersimpan di server Database SQLite.</p>

        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-4 mb-8 rounded font-bold">
            Error: {error}
          </div>
        )}

        <div className="bg-white brutal-border brutal-shadow p-6 mb-8">
          <h2 className="font-archivo text-2xl uppercase mb-4 border-b-4 border-black pb-2">Bingkai Server (Upload User)</h2>
          
          {isLoading ? (
            <p className="text-gray-500 italic py-4 text-center">Memuat data server...</p>
          ) : serverFrames.length === 0 ? (
            <p className="text-gray-500 italic py-4 text-center">Belum ada bingkai yang diupload ke server.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {serverFrames.map((frame) => (
                <div key={frame.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 brutal-border gap-4">
                  <div className="flex items-center gap-4">
                    {frame.overlayUrl ? (
                      <div className="w-16 h-16 bg-gray-200 border-2 border-black rounded shrink-0 relative overflow-hidden">
                        <img src={frame.overlayUrl} alt={frame.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 border-2 border-black rounded shrink-0 flex items-center justify-center text-xs font-bold text-gray-400">
                        {frame.slots} Slot
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{frame.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">ID: {frame.id}</p>
                      <p className="text-xs text-gray-600 mt-1">{frame.slots} slot | Dibuat: {frame.created_at ? new Date(frame.created_at).toLocaleString('id-ID') : 'Baru saja'}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleDelete(frame.id, frame.name)} 
                    className="bg-red-500 hover:bg-red-600 text-white shrink-0 w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> HAPUS
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-200 brutal-border p-6 opacity-70">
          <h2 className="font-archivo text-2xl uppercase mb-4 border-b-4 border-black pb-2">Bingkai Bawaan (Read Only)</h2>
          <p className="text-xs mb-4 text-gray-600 font-bold">Bingkai ini ada di dalam source code (templates.js) dan tidak bisa dihapus lewat panel ini.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {builtInTemplates.map(t => (
              <div key={t.id} className="p-2 border-2 border-gray-400 rounded text-sm bg-white">
                <p className="font-bold">{t.name}</p>
                <p className="text-xs text-gray-500 font-mono">{t.id}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
