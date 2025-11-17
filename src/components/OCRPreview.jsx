// src/components/OCRPreview.jsx
import React from "react";

export default function OCRPreview({ ocr }) {
  if (!ocr) return null;
  return (
    <div className="mb-6 bg-white rounded-2xl card-shadow p-6 animate-slide-up hover-lift border border-surface-stroke">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gradient-to-br from-luxury-gold to-luxury-neon rounded-lg mr-3 shadow">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-extrabold font-display tracking-tight text-text-primary">OCR Preview</h3>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-1">Name</div>
            <div className="text-lg font-bold text-text-primary">{ocr.name || "N/A"}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-1">Aadhaar</div>
            <div className="text-lg font-bold text-text-primary font-mono">{ocr.maskedAadhaar || "N/A"}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-1">PAN</div>
            <div className="text-lg font-bold text-text-primary font-mono">{ocr.pan || "N/A"}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold text-text-secondary mb-2">Raw Text</div>
          <pre className="whitespace-pre-wrap text-xs bg-white text-text-primary p-4 rounded-xl border border-surface-stroke font-mono overflow-x-auto">{ocr.rawText || "No raw text available"}</pre>
        </div>
      </div>
    </div>
  );
}
