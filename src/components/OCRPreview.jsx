import React from "react";
import { FileText, ScanLine } from "lucide-react";

export default function OCRPreview({ ocr }) {
  if (!ocr) return null;
  return (
    <div className="glass-panel p-6 h-full">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-400/30">
          <ScanLine className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Extracted Data</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</div>
            <div className="text-white font-medium">{ocr.name || "N/A"}</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Aadhaar Number</div>
            <div className="text-cyan-300 font-mono tracking-widest">{ocr.maskedAadhaar || "N/A"}</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PAN Number</div>
            <div className="text-cyan-300 font-mono tracking-widest">{ocr.pan || "N/A"}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
             <FileText className="w-3 h-3" /> Raw Optical Data
          </div>
          <div className="bg-[#020617] text-green-400 p-4 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto shadow-inner h-32">
             <p className="opacity-80 whitespace-pre-wrap">{ocr.rawText || "// No raw text data stream available..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}