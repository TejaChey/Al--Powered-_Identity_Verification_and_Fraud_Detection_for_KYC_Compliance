import React from "react";

export default function SubmissionsTable({ submissions = [], onRefresh = () => {} }) {
  if (!Array.isArray(submissions) || submissions.length === 0) return null;

  const getStatusBadge = (status) => {
    if (status === "Verified") return <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">PASS</span>;
    if (status === "Invalid") return <span className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">FAIL</span>;
    return <span className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">PENDING</span>;
  };

  return (
    <div className="overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Database Records</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-cyan-400 font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 rounded-tl-lg">ID Hash</th>
              <th className="p-4">Doc Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Risk %</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4 rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {submissions.map((s, idx) => {
              const shortId = s?.submissionId?.slice(0, 8) || `DOC-${idx}`;
              return (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-slate-400">{shortId}</td>
                  <td className="p-4 text-white font-medium">{s?.documentType || "-"}</td>
                  <td className="p-4">{getStatusBadge(s?.verified ? "Verified" : "Invalid")}</td>
                  <td className="p-4 font-mono text-slate-300">{s?.fraud?.score ? s.fraud.score + '%' : '0%'}</td>
                  <td className="p-4 text-slate-400 text-xs">{new Date(s?.timestamp || Date.now()).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button onClick={() => onRefresh(s?.submissionId)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-wider hover:underline">Sync</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}