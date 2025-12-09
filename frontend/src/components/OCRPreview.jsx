// src/components/OCRPreview.jsx
import React from "react";
import { FileText, ScanLine } from "lucide-react";

export default function OCRPreview({ ocr = null, progress = 0, running = false, quality = null }) {
  // If there's nothing to show, render nothing (keeps UI clean)
  if (!ocr && !running && !quality) return null;

  // Interpret quality (frontend labels)
  const qualityLabel = (quality && quality.qualityLabel) || "good";
  const isPoor = quality && qualityLabel === "poor";
  const isMarginal = quality && qualityLabel === "marginal";
  const reasons = (quality && quality.reasons) || [];

  // Helper: mask numeric/alpha strings but keep last 4 chars visible
  const maskTrailing = (s) => {
    if (!s) return "N/A";
    const chars = (s.match(/[A-Za-z0-9]/g) || []).length;
    if (chars <= 4) return s;
    let seen = 0;
    return s.replace(/[A-Za-z0-9]/g, (m) => {
      seen++;
      return seen > chars - 4 ? m : "X";
    });
  };

  return (
    <div className="glass-panel p-6 h-full relative">
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-400/30">
          <ScanLine className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Extracted Data</h3>
      </div>

      {/* Image quality banner */}
      {quality && (
        <div
          className={`mb-4 p-3 rounded-lg border ${isPoor ? "bg-rose-600/10 border-rose-500/20" : isMarginal ? "bg-amber-500/10 border-amber-400/20" : "bg-emerald-500/10 border-emerald-400/20"
            }`}
        >
          <div className="flex items-start gap-3">
            <div className="text-sm font-bold" style={{ minWidth: 0 }}>
              <div className={`${isPoor ? "text-rose-300" : isMarginal ? "text-amber-300" : "text-emerald-300"} font-semibold`}>
                {isPoor ? "Poor Image Quality" : isMarginal ? "Marginal Image Quality" : "Good Image Quality"}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {isPoor ? "Please retake the photo for better OCR results." : isMarginal ? "Consider retaking the photo for higher accuracy." : "Looks good — ready for submission."}
              </div>
            </div>

            {/* small metric boxes */}
            <div className="ml-auto flex items-center gap-2">
              <div className="text-xs font-mono text-slate-300">Blur: {quality && quality.blurVariance == null ? "N/A" : (quality && quality.blurVariance != null ? quality.blurVariance.toFixed(1) : "N/A")}</div>
              <div className="text-xs font-mono text-slate-300">Fill: {quality && quality.cropRatio == null ? "N/A" : (quality && quality.cropRatio != null ? quality.cropRatio.toFixed(2) : "N/A")}</div>
            </div>
          </div>

          {/* show reasons */}
          {reasons.length > 0 && (
            <div className="mt-2 text-xs text-slate-300">
              <strong>Reasons:</strong> {reasons.join(" • ")}
            </div>
          )}
        </div>
      )}

      {running && (
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-1">Local OCR Preview — {progress}%</div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
            <div className="h-full bg-purple-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</div>
            <div className="text-white font-medium">{ocr?.name || "N/A"}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Aadhaar Number</div>
              <div className="text-cyan-300 font-mono tracking-widest text-sm">{maskTrailing(ocr?.maskedAadhaar || ocr?.aadhaar || "")}</div>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PAN Number</div>
              <div className="text-cyan-300 font-mono tracking-widest text-sm">{maskTrailing(ocr?.pan || ocr?.maskedPan || "")}</div>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Driving Licence</div>
              <div className="text-purple-300 font-mono tracking-widest text-sm">{maskTrailing(ocr?.maskedDl || ocr?.dlNumber || "")}</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-3 h-3" /> Raw Optical Data
          </div>
          <div className="bg-[#020617] text-green-400 p-4 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto shadow-inner h-32">
            <p className="opacity-80 whitespace-pre-wrap">{ocr?.rawText || "// No raw text data stream available..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
