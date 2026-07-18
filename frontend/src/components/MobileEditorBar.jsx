"use client";
import { Camera, Palette, Sparkles, Download } from "lucide-react";

const TABS = [
  { id: "photos", label: "Foto", icon: Camera },
  { id: "frame", label: "Frame", icon: Palette },
  { id: "stickers", label: "Stiker", icon: Sparkles },
  { id: "export", label: "Download", icon: Download },
];

export default function MobileEditorBar({ activeTab, setActiveTab, onExport, isExporting }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black flex md:hidden">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "export") { onExport?.(); return; }
              setActiveTab(activeTab === tab.id ? null : tab.id);
            }}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors
              ${activeTab === tab.id ? 'bg-primary text-black' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Icon className="w-5 h-5" />
            <span>{isExporting && tab.id === "export" ? "..." : tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
