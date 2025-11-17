// src/components/SubmissionsTable.jsx
import React from "react";

/**
 * SubmissionsTable - defensive rendering so missing fields don't crash the UI.
 *
 * Props:
 *  - submissions: array (may contain items from backend docs or mock combined objects)
 *  - onRefresh(submissionId)
 */
export default function SubmissionsTable({ submissions = [], onRefresh = () => {} }) {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return null;
  }

  const getStatusBadge = (status) => {
    if (status === "Verified") {
      return <span className="px-3 py-1 rounded-full bg-indigo-50 text-luxury-gold font-semibold text-xs border border-luxury-gold/30">✓ Verified</span>;
    }
    if (status === "Invalid") {
      return <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200">✗ Invalid</span>;
    }
    return (
      <span className="px-3 py-1 rounded-full bg-surface-muted text-text-secondary font-semibold text-xs border border-surface-stroke">
        {status}
      </span>
    );
  };

  const getRiskBadge = (category) => {
    if (category === "Low") {
      return <span className="px-3 py-1 rounded-full bg-indigo-50 text-luxury-gold font-semibold text-xs border border-luxury-gold/30">Low</span>;
    }
    if (category === "Medium") {
      return <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-500 font-semibold text-xs border border-amber-200">Medium</span>;
    }
    if (category === "High") {
      return <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200">High</span>;
    }
    return <span className="text-text-secondary">-</span>;
  };

  return (
    <div className="bg-white rounded-2xl card-shadow p-6 animate-slide-up hover-lift border border-surface-stroke">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-br from-luxury-gold to-luxury-neon rounded-lg mr-3 shadow">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-2xl font-extrabold font-display tracking-tight text-text-primary">Submissions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-surface-stroke">
              <th className="pb-4 text-left text-text-secondary font-bold">ID</th>
              <th className="pb-4 text-left text-text-secondary font-bold">Document</th>
              <th className="pb-4 text-left text-text-secondary font-bold">Status</th>
              <th className="pb-4 text-left text-text-secondary font-bold">Fraud Risk</th>
              <th className="pb-4 text-left text-text-secondary font-bold">Time</th>
              <th className="pb-4 text-left text-text-secondary font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s, idx) => {
              // Defensive id handling: use submissionId (mock), fallback to _id (mongo), fallback to index-based id
              const rawId = s?.submissionId ?? s?._id ?? `unknown-${idx}`;
              const shortId = typeof rawId === "string" && rawId.length > 8 ? rawId.slice(0, 8) : String(rawId);

              // Document type fallback
              const docType = s?.documentType ?? s?.docType ?? s?.type ?? "-";

              // Verified status fallback
              const status = s?.verified === true ? "Verified" : (s?.verified === false ? "Invalid" : (s?.status ?? "-"));

              // Fraud fields (may be missing)
              const fraudCategory = s?.fraud?.category ?? "-";
              const fraudScore = typeof s?.fraud?.score === "number" ? `${s.fraud.score}%` : (s?.fraud?.score ?? "-");

              // Time fallback: prefer timestamp -> createdAt -> any date-like field -> show '-' if missing
              const timeRaw = s?.timestamp ?? s?.createdAt ?? s?.time ?? null;
              const timeDisplay = timeRaw ? new Date(timeRaw).toLocaleString() : "-";

              return (
                <tr 
                  key={rawId + "-" + idx} 
                  className="border-b border-surface-stroke hover:bg-surface-muted transition-colors duration-200 animate-slide-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <td className="py-4 font-mono text-xs text-text-secondary font-semibold">{shortId}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-surface-muted rounded-lg text-text-primary font-medium text-sm border border-surface-stroke">
                      {docType}
                    </span>
                  </td>
                  <td className="py-4">{getStatusBadge(status)}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {getRiskBadge(fraudCategory)}
                      {fraudScore !== "-" && (<span className="text-text-secondary text-xs">({fraudScore})</span>)}
                    </div>
                  </td>
                  <td className="py-4 text-xs text-text-secondary font-medium">{timeDisplay}</td>
                  <td className="py-4">
                    <button
                      onClick={() => {
                        // Only call onRefresh when we have a usable id
                        if (rawId && rawId !== `unknown-${idx}`) onRefresh(rawId);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-luxury-gold to-luxury-neon text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow"
                    >
                      Refresh
                    </button>
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
