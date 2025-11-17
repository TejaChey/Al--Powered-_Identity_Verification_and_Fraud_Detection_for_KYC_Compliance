// src/components/VerificationCard.jsx
import React from "react";

function RiskBadge({ category }) {
  if (category === "Low") return (
    <span className="px-4 py-2 rounded-full bg-indigo-50 text-luxury-gold font-bold text-sm border border-luxury-gold/30">
      Low Risk
    </span>
  );
  if (category === "Medium") return (
    <span className="px-4 py-2 rounded-full bg-amber-50 text-amber-500 font-bold text-sm border border-amber-200">
      Medium Risk
    </span>
  );
  return (
    <span className="px-4 py-2 rounded-full bg-rose-50 text-rose-600 font-bold text-sm border border-rose-200">
      High Risk
    </span>
  );
}

export default function VerificationCard({ result, fraud }) {
  if (!result) return null;
  const score = fraud?.score ?? 0;
  const getScoreColor = () => {
    if (score > 70) return "bg-rose-500";
    if (score > 30) return "bg-amber-400";
    return "bg-luxury-gold";
  };
  
  return (
    <div className="bg-white rounded-2xl card-shadow p-6 mb-6 animate-slide-up hover-lift border border-surface-stroke">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-br from-luxury-gold to-luxury-neon rounded-lg mr-3 shadow">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-extrabold font-display tracking-tight text-text-primary">Verification Result</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-1">Document Type</div>
            <div className="text-lg font-bold text-text-primary">{result.documentType || "N/A"}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-1">Status</div>
            <div>
              {result.verified ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-luxury-gold font-bold text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Invalid
                </span>
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-1">Tampering</div>
            <div>
              {result.tampered ? (
                <span className="text-rose-600 font-bold">Possible</span>
              ) : (
                <span className="text-text-primary font-bold">No Tampering</span>
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-1">Masked ID</div>
            <div className="text-lg font-bold text-text-primary font-mono">{result.maskedAadhaar || "N/A"}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-surface-stroke">
            <div className="text-xs font-semibold text-text-secondary mb-3">Fraud Risk</div>
            <div className="mb-4">
              <RiskBadge category={fraud?.category} />
            </div>
            <div className="w-full bg-surface-muted rounded-full h-6 mb-2 overflow-hidden border border-surface-stroke">
              <div 
                className={`h-6 rounded-full transition-all duration-500 ${getScoreColor()} flex items-center justify-end pr-2`}
                style={{ width: `${Math.min(score, 100)}%` }}
              >
                {score > 10 && (<span className="text-white text-xs font-bold">{score}%</span>)}
              </div>
            </div>
            <p className="text-sm text-text-secondary font-semibold text-center">
              Risk Score: <span className="text-lg text-text-primary">{score}%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
