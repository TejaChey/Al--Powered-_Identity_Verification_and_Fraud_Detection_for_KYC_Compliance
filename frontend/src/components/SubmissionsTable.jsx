
import React, { useState } from "react";
import { AlertCircle, CheckCircle, Clock, Download, FileText } from "lucide-react";

import { useToast } from "../contexts/ToastContext";

export default function SubmissionsTable({ submissions = [], onRefresh = () => { }, loading = false }) {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/compliance/documents/report", {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "My_KYC_Submission_Report.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Report downloaded successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to download report. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (!loading && (!Array.isArray(submissions) || submissions.length === 0))
    return <div className="p-4 text-center text-slate-500 italic">No submissions found to report.</div>;

  const getStatusBadge = (item) => {
    // Normalize status from backend 'decision' or fallback to 'verified' boolean
    let status = item.decision;
    if (!status) status = item.verified ? "Pass" : "Flagged";

    let reasons = [];
    if (item.fraud?.reasons) reasons = [...reasons, ...item.fraud.reasons];
    if (item.aml_results) reasons = [...reasons, ...item.aml_results];

    // De-duplicate reasons
    reasons = [...new Set(reasons)];

    // Check if GNN/CNN were involved for special highlighting
    const isAI = reasons.some(r => r.includes("AI detected") || r.includes("GNN detected"));

    if (status === "Pass" || status === "Approve") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <CheckCircle className="w-3 h-3" /> PASS
        </span>
      );
    }

    if (status === "Flagged" || status === "Reject" || status === "Fail") {
      return (
        <div className="group relative inline-block">
          <span className="cursor-help inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
            <AlertCircle className="w-3 h-3" /> {isAI ? "AI REJECT" : "REJECTED"}
          </span>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-rose-500/50 rounded-lg shadow-2xl text-xs text-slate-200 hidden group-hover:block z-50">
            <div className="font-bold text-rose-400 mb-1 border-b border-rose-500/20 pb-1">Rejection Reasons:</div>
            <ul className="list-disc list-inside space-y-1">
              {reasons.length > 0 ? reasons.map((r, i) => <li key={i}>{r}</li>) : <li>Compliance checks failed</li>}
            </ul>
          </div>
        </div>
      );
    }

    if (status === "Review") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
          <Clock className="w-3 h-3" /> REVIEW
        </span>
      );
    }

    return <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">PENDING</span>;
  };

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Database Records</h3>

        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-cyan-400 transition-colors disabled:opacity-50"
        >
          {downloading ? <Clock className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          {downloading ? "Generating..." : "Download Report"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-white/5 text-cyan-400 font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 rounded-tl-lg">ID Hash</th>
              <th className="p-4">Doc Type</th>
              <th className="p-4">Status & Reason</th>
              <th className="p-4">Risk %</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={`sk-${i}`} className="animate-pulse">
                  <td className="p-4"><div className="h-4 bg-slate-700/50 rounded w-20"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-700/50 rounded w-32"></div></td>
                  <td className="p-4"><div className="h-6 bg-slate-700/50 rounded w-24"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-700/50 rounded w-12"></div></td>
                  <td className="p-4"><div className="h-4 bg-slate-700/50 rounded w-24"></div></td>
                </tr>
              ))
            ) : (
              submissions.map((s, idx) => {
                const shortId = s?.submissionId ? String(s.submissionId).slice(0, 8) : `DOC-${idx}`;
                return (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-slate-400">{shortId}</td>
                    <td className="p-4 text-white font-medium">
                      {s?.verification?.filename ? (
                        <div className="flex flex-col">
                          <span>{s?.documentType || "-"}</span>
                          <span className="text-[10px] text-slate-500">{s.verification.filename}</span>
                        </div>
                      ) : (
                        s?.documentType || "-"
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(s)}</td>
                    <td className="p-4 font-mono text-slate-300">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${s?.fraud?.score || 0}%` }}></div>
                        </div>
                        <span>{s?.fraud?.score ? s.fraud.score + '%' : '0%'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(s?.timestamp || s?.createdAt || Date.now()).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}