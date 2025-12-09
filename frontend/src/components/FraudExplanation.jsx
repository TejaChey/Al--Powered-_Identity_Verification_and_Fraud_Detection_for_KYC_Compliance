// src/components/FraudExplanation.jsx
// Explainable AI component - Shows WHY a user was flagged as high-risk
import React from "react";
import { AlertTriangle, CheckCircle, XCircle, Info, Shield, Fingerprint, FileWarning, Users, Image, MapPin } from "lucide-react";

/**
 * FraudExplanation Component
 * Displays a detailed breakdown of why a submission was flagged with specific risk factors
 */
export default function FraudExplanation({ fraud = null, verification = null }) {
    if (!fraud) return null;

    const score = fraud.score || 0;
    const reasons = fraud.reasons || [];
    const details = fraud.details || {};

    // Risk level determination
    const getRiskLevel = (score) => {
        if (score > 70) return { level: "HIGH", color: "rose", icon: XCircle, label: "High Risk - Manual Review Required" };
        if (score > 30) return { level: "MEDIUM", color: "amber", icon: AlertTriangle, label: "Medium Risk - Attention Needed" };
        return { level: "LOW", color: "emerald", icon: CheckCircle, label: "Low Risk - Likely Authentic" };
    };

    const riskInfo = getRiskLevel(score);
    const RiskIcon = riskInfo.icon;

    // Parse reasons into structured categories
    const categorizeReasons = (reasons) => {
        const categories = {
            identity: { label: "Identity Validation", icon: Fingerprint, items: [], color: "cyan" },
            duplicate: { label: "Duplicate Detection", icon: Users, items: [], color: "purple" },
            quality: { label: "Image Quality", icon: Image, items: [], color: "blue" },
            manipulation: { label: "Tampering Detection", icon: FileWarning, items: [], color: "orange" },
            address: { label: "Address/Location", icon: MapPin, items: [], color: "teal" },
            other: { label: "Other Flags", icon: Info, items: [], color: "slate" }
        };

        reasons.forEach(reason => {
            const r = reason.toLowerCase();
            if (r.includes("aadhaar") || r.includes("pan") || r.includes("dl") || r.includes("name")) {
                categories.identity.items.push(reason);
            } else if (r.includes("duplicate")) {
                categories.duplicate.items.push(reason);
            } else if (r.includes("blur") || r.includes("crop") || r.includes("quality")) {
                categories.quality.items.push(reason);
            } else if (r.includes("manipul") || r.includes("metadata") || r.includes("tamper")) {
                categories.manipulation.items.push(reason);
            } else if (r.includes("address") || r.includes("pin") || r.includes("location")) {
                categories.address.items.push(reason);
            } else {
                categories.other.items.push(reason);
            }
        });

        return Object.entries(categories).filter(([_, cat]) => cat.items.length > 0);
    };

    const categorizedReasons = categorizeReasons(reasons);

    return (
        <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            {/* Inject animation styles */}
            <style>{`
        @keyframes riskPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .risk-pulse { animation: riskPulse 2s ease-in-out infinite; }
      `}</style>

            {/* Header with Risk Score */}
            <div className={`p-5 border-b border-white/10 bg-gradient-to-r ${riskInfo.level === "HIGH" ? "from-rose-500/20 to-rose-600/10" :
                riskInfo.level === "MEDIUM" ? "from-amber-500/20 to-amber-600/10" :
                    "from-emerald-500/20 to-emerald-600/10"
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-${riskInfo.color}-500/20 border border-${riskInfo.color}-500/30 risk-pulse`}>
                            <RiskIcon className={`w-6 h-6 text-${riskInfo.color}-400`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5" /> Fraud Analysis Report
                            </h3>
                            <p className={`text-sm text-${riskInfo.color}-300 font-medium`}>{riskInfo.label}</p>
                        </div>
                    </div>

                    {/* Score Circle */}
                    <div className="relative">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent"
                                className="text-slate-700" />
                            <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="6" fill="transparent"
                                strokeDasharray={`${score * 2.2} 220`}
                                className={`text-${riskInfo.color}-500 transition-all duration-1000`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-xl font-bold text-${riskInfo.color}-400`}>{Math.round(score)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Why Flagged Section */}
            {reasons.length > 0 && (
                <div className="p-5">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Why This Submission Was Flagged
                    </h4>

                    <div className="space-y-4">
                        {categorizedReasons.map(([key, category]) => {
                            const CategoryIcon = category.icon;
                            return (
                                <div key={key} className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CategoryIcon className={`w-4 h-4 text-${category.color}-400`} />
                                        <span className={`text-sm font-bold text-${category.color}-300`}>{category.label}</span>
                                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-400">
                                            {category.items.length} issue{category.items.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {category.items.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <span className="text-rose-400 mt-0.5">▸</span>
                                                <span className="text-slate-300">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Technical Details */}
            {Object.keys(details).length > 0 && (
                <div className="p-5 border-t border-white/10 bg-slate-900/40">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4 text-cyan-400" />
                        Technical Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {details.blur_variance !== undefined && details.blur_variance !== null && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <div className="text-slate-500 uppercase tracking-wider mb-1">Blur Score</div>
                                <div className={`font-mono font-bold ${details.blur_variance < 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {typeof details.blur_variance === 'number' ? details.blur_variance.toFixed(1) : 'N/A'}
                                </div>
                            </div>
                        )}
                        {details.crop_bbox_ratio !== undefined && details.crop_bbox_ratio !== null && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <div className="text-slate-500 uppercase tracking-wider mb-1">Crop Ratio</div>
                                <div className={`font-mono font-bold ${details.crop_bbox_ratio < 0.65 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {typeof details.crop_bbox_ratio === 'number' ? details.crop_bbox_ratio.toFixed(2) : 'N/A'}
                                </div>
                            </div>
                        )}
                        {details.name_matching && (
                            <div className="col-span-2 md:col-span-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-4 rounded-lg border border-purple-500/20">
                                <div className="text-slate-400 uppercase tracking-wider mb-3 font-bold flex items-center gap-2">
                                    <span className="text-lg">🔤</span> AI Name Matching Analysis
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-slate-800/50 p-3 rounded-lg">
                                        <div className="text-slate-500 text-[10px] uppercase mb-1">Overall Match</div>
                                        <div className={`font-mono font-bold text-lg ${details.name_matching.overall_match_pct >= 80 ? 'text-emerald-400' :
                                            details.name_matching.overall_match_pct >= 60 ? 'text-amber-400' : 'text-rose-400'
                                            }`}>
                                            {details.name_matching.overall_match_pct}%
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg">
                                        <div className="text-slate-500 text-[10px] uppercase mb-1">Fuzzy Score</div>
                                        <div className={`font-mono font-bold ${details.name_matching.fuzzy_score >= 80 ? 'text-emerald-400' : 'text-amber-400'
                                            }`}>
                                            {details.name_matching.fuzzy_score}%
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg">
                                        <div className="text-slate-500 text-[10px] uppercase mb-1">Phonetic Match</div>
                                        <div className={`font-bold ${details.name_matching.phonetic_match ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {details.name_matching.phonetic_match ? '✓ YES' : '✗ NO'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg">
                                        <div className="text-slate-500 text-[10px] uppercase mb-1">Cross-Doc Check</div>
                                        <div className={`font-bold ${details.name_matching.cross_doc_consistent ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {details.name_matching.cross_doc_consistent ? '✓ Consistent' : '⚠ Inconsistent'}
                                        </div>
                                    </div>
                                </div>
                                {details.name_matching.reason && (
                                    <div className="mt-3 text-sm text-slate-300 bg-slate-800/30 p-2 rounded border-l-2 border-purple-500">
                                        <strong>Analysis:</strong> {details.name_matching.reason}
                                    </div>
                                )}
                                {details.name_matching.user_name && details.name_matching.document_name && (
                                    <div className="mt-2 text-xs text-slate-400 flex gap-4">
                                        <span>User: <span className="text-cyan-300">{details.name_matching.user_name}</span></span>
                                        <span>vs</span>
                                        <span>Document: <span className="text-purple-300">{details.name_matching.document_name}</span></span>
                                    </div>
                                )}
                            </div>
                        )}
                        {!details.name_matching && details.name_match_pct !== undefined && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <div className="text-slate-500 uppercase tracking-wider mb-1">Name Match</div>
                                <div className={`font-mono font-bold ${details.name_match_pct < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {details.name_match_pct}%
                                </div>
                            </div>
                        )}
                        {details.duplicate !== undefined && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <div className="text-slate-500 uppercase tracking-wider mb-1">Duplicate</div>
                                <div className={`font-mono font-bold ${details.duplicate ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {details.duplicate ? 'YES' : 'NO'}
                                </div>
                            </div>
                        )}
                        {details.manipulation_suspected !== undefined && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <div className="text-slate-500 uppercase tracking-wider mb-1">Tampering</div>
                                <div className={`font-mono font-bold ${details.manipulation_suspected ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {details.manipulation_suspected ? 'SUSPECTED' : 'NONE'}
                                </div>
                            </div>
                        )}
                        {details.fileHash && (
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <div className="text-slate-500 uppercase tracking-wider mb-1">File Hash</div>
                                <div className="font-mono text-cyan-400 truncate" title={details.fileHash}>
                                    {details.fileHash.substring(0, 12)}...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Device Fingerprint Analysis */}
                    {details.device_fingerprint && details.device_fingerprint.analyzed && (
                        <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-cyan-500/20">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">🖥️</span>
                                <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">Device Analysis</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <div className="text-slate-500 text-[10px] uppercase mb-1">New Device</div>
                                    <div className={`font-bold ${details.device_fingerprint.new_device ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {details.device_fingerprint.new_device ? '⚠ YES' : '✓ NO'}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <div className="text-slate-500 text-[10px] uppercase mb-1">Shared Device</div>
                                    <div className={`font-bold ${details.device_fingerprint.multi_user_device ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {details.device_fingerprint.multi_user_device
                                            ? `🚨 ${details.device_fingerprint.users_on_device} Users`
                                            : '✓ Single User'}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <div className="text-slate-500 text-[10px] uppercase mb-1">Timezone</div>
                                    <div className={`font-bold ${details.device_fingerprint.timezone_mismatch ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {details.device_fingerprint.timezone_mismatch ? '⚠ Mismatch' : '✓ OK'}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-lg">
                                    <div className="text-slate-500 text-[10px] uppercase mb-1">Device Risk</div>
                                    <div className={`font-mono font-bold ${details.device_fingerprint.risk_score > 15 ? 'text-rose-400' :
                                            details.device_fingerprint.risk_score > 5 ? 'text-amber-400' : 'text-emerald-400'
                                        }`}>
                                        +{details.device_fingerprint.risk_score || 0}
                                    </div>
                                </div>
                            </div>
                            {details.device_fingerprint.reasons && details.device_fingerprint.reasons.length > 0 && (
                                <div className="mt-3 text-xs text-slate-400">
                                    <strong>Issues:</strong> {details.device_fingerprint.reasons.join(' • ')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* No Issues */}
            {reasons.length === 0 && (
                <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-lg font-bold text-emerald-300">All Checks Passed</p>
                    <p className="text-sm text-slate-400 mt-1">No fraud indicators detected in this submission</p>
                </div>
            )}
        </div>
    );
}
