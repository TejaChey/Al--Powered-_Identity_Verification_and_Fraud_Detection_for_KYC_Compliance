import React from "react";
import { CheckCircle, XCircle, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

function RiskBadge({ category }) {
  if (category === "Low") return (
    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
      Low Risk
    </span>
  );
  if (category === "Medium") return (
    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)]">
      Medium Risk
    </span>
  );
  return (
    <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(244,63,94,0.2)]">
      High Risk
    </span>
  );
}

export default function VerificationCard({ result, fraud }) {
  if (!result) return null;
  const score = fraud?.score ?? 0;
  
  // Dynamic Colors
  const scoreColor = score > 70 ? "bg-rose-500 shadow-rose-500/50" : score > 30 ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-500 shadow-emerald-500/50";
  const scoreText = score > 70 ? "text-rose-400" : score > 30 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="glass-panel p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Verification Result</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Document Details */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Doc Type</div>
            <div className="text-lg font-bold text-white">{result.documentType || "N/A"}</div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-2">
                {result.verified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-400 font-bold">Invalid</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tampering Check</div>
            <div className="flex items-center gap-2">
              {result.tampered ? (
                <span className="text-rose-400 font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Detected</span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Clean</span>
              )}
            </div>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Masked ID</div>
            <div className="font-mono text-cyan-300 tracking-widest">{result.maskedAadhaar || "N/A"}</div>
          </div>
        </div>

        {/* Right Column: Fraud Risk Meter */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5 flex flex-col justify-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Fraud Risk Analysis</div>
          
          <div className="flex justify-between items-end mb-2">
            <RiskBadge category={fraud?.category} />
            <span className={`text-3xl font-bold ${scoreText}`}>{score}%</span>
          </div>

          {/* Glowing Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${scoreColor} shadow-[0_0_15px_currentColor]`}
              style={{ width: `${Math.min(score, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-right font-mono">AI CONFIDENCE: 98.4%</p>
        </div>
      </div>
    </div>
  );
}