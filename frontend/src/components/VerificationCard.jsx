// VerificationCard.jsx — Enhanced to show all extracted fields
import React from "react";
import { CheckCircle, XCircle, FileText, User, Calendar, Car, CreditCard } from "lucide-react";

export default function VerificationCard({ result = {} }) {
  const { verified, maskedAadhaar, maskedPan, maskedDl, timestamp, fraud, parsed, verification } = result || {};

  // Get parsed data from different possible locations
  const data = parsed || verification?.parsed || {};
  const name = data.name || null;
  const dob = data.dob || null;
  const gender = data.gender || null;
  const docType = data.documentType || null;
  const address = data.address || null;
  const dlNumber = maskedDl || data.maskedDl || data.dlNumber || null;

  const score = fraud?.score ?? null;
  const riskLabel =
    score == null ? "Unknown" : score > 70 ? "High Risk" : score > 30 ? "Medium" : "Low";
  const riskColor = score == null ? "text-slate-400" : score > 70 ? "text-rose-400" : score > 30 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="glass-panel p-6 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Verification Summary</h3>
          <p className="text-xs text-slate-400">Processed: {timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          {verified ? (
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm font-semibold">Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-300">
              <XCircle className="w-6 h-6" />
              <span className="text-sm font-semibold">Not Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary IDs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Aadhaar
          </div>
          <div className="font-mono text-cyan-300">{maskedAadhaar || "N/A"}</div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <FileText className="w-3 h-3" /> PAN
          </div>
          <div className="font-mono text-cyan-300">{maskedPan || "N/A"}</div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Car className="w-3 h-3" /> Driving Licence
          </div>
          <div className="font-mono text-purple-300">{dlNumber || "N/A"}</div>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Fraud Score</div>
          <div className="flex items-center justify-between">
            <div className={`font-bold ${riskColor}`}>{score == null ? "—" : score}</div>
            <div className={`text-xs ${riskColor}`}>{riskLabel}</div>
          </div>
        </div>
      </div>

      {/* Additional Extracted Fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {name && (
          <div className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Name
            </div>
            <div className="text-sm text-white truncate">{name}</div>
          </div>
        )}

        {dlNumber && (
          <div className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Car className="w-3 h-3" /> DL Number
            </div>
            <div className="text-sm text-cyan-300 font-mono">{dlNumber}</div>
          </div>
        )}

        {dob && (
          <div className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> DOB
            </div>
            <div className="text-sm text-white font-mono">{dob}</div>
          </div>
        )}

        {gender && (
          <div className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Gender</div>
            <div className="text-sm text-white">{gender}</div>
          </div>
        )}

        {docType && (
          <div className="p-3 bg-slate-900/30 rounded-lg border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Doc Type</div>
            <div className="text-sm text-purple-300 font-medium">{docType}</div>
          </div>
        )}
      </div>
    </div>
  );
}
