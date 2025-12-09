import React, { useEffect, useState } from "react";
import { getAlerts, getLogs, addLog, dismissAlert, getSubmissions, setDocumentDecision } from "../api";
import { Eye, BarChart3, Users, FileText, CheckCircle, XCircle, Clock, X, ChevronRight, AlertTriangle, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import FraudExplanation from "./FraudExplanation";
import { useToast } from "../contexts/ToastContext";

// CSS animation styles for fraud alerts
const alertStyles = `
  @keyframes highRiskPulse {
    0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3); }
    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.5); }
  }
  @keyframes highRiskFlash {
    0%, 100% { background-color: rgba(239, 68, 68, 0.15); }
    50% { background-color: rgba(239, 68, 68, 0.35); }
  }
  @keyframes mediumRiskGlow {
    0%, 100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.3); }
    50% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.5); }
  }
  .high-risk-alert {
    animation: highRiskPulse 1.5s ease-in-out infinite, highRiskFlash 1.5s ease-in-out infinite;
  }
  .medium-risk-alert {
    animation: mediumRiskGlow 2s ease-in-out infinite;
  }
  .risk-badge-high { animation: highRiskPulse 1s ease-in-out infinite; }
`;

export default function AdminPanel() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [a, l, s] = await Promise.all([getAlerts(), getLogs(), getSubmissions(token)]);
      setAlerts(Array.isArray(a) ? a : []);
      setLogs(Array.isArray(l) ? l : []);
      setSubmissions(Array.isArray(s) ? s : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function acknowledgeAlert(alert) {
    try {
      await dismissAlert(alert._id);
      await addLog({ userId: "admin", details: `Dismissed: ${alert.alert} ` });
      setAlerts(prev => prev.filter(a => a._id !== alert._id));
      const newLogs = await getLogs(); setLogs(newLogs);
    } catch (err) { console.error(err); }
  }

  async function approveSubmission(s) {
    try {
      const token = localStorage.getItem('token');
      await setDocumentDecision(token, s.docId, 'Approve', 'Approved by admin');
      await addLog({ userId: 'admin', details: `Approved doc ${s.docId} ` });
      const newSubs = await getSubmissions(token);
      setSubmissions(newSubs);
      const newLogs = await getLogs(); setLogs(newLogs);
      setSelectedSubmission(null);
    } catch (err) { console.error(err); showToast('Failed to approve', 'error'); }
  }

  async function rejectSubmission(s) {
    try {
      const token = localStorage.getItem('token');
      await setDocumentDecision(token, s.docId, 'Reject', 'Rejected by admin');
      await addLog({ userId: 'admin', details: `Rejected doc ${s.docId} ` });
      const newSubs = await getSubmissions(token);
      setSubmissions(newSubs);
      const newLogs = await getLogs(); setLogs(newLogs);
      setSelectedSubmission(null);
    } catch (err) { console.error(err); showToast('Failed to reject', 'error'); }
  }

  // Compute fraud risk badge color/text
  const fraudBadge = (score) => {
    if (score > 70) return { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-300', label: 'HIGH RISK' };
    if (score > 30) return { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-300', label: 'MEDIUM RISK' };
    return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-300', label: 'LOW RISK' };
  };

  return (
    <div className="animate-fade-in">
      {/* Inject animation styles */}
      <style>{alertStyles}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🛡️ Admin Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage KYC submissions, alerts, and audit trail</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-bold uppercase hover:bg-cyan-500/30 transition-all flex items-center gap-2">
          <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-xl p-4">
          <div className="text-rose-400 text-xs uppercase font-bold mb-1">🚨 Alerts</div>
          <div className="text-2xl font-bold text-white">{alerts.length}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-4">
          <div className="text-amber-400 text-xs uppercase font-bold mb-1">⏳ Pending</div>
          <div className="text-2xl font-bold text-white">{submissions.filter(s => !s.decision || s.decision === 'Flagged').length}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="text-emerald-400 text-xs uppercase font-bold mb-1">✓ Approved</div>
          <div className="text-2xl font-bold text-white">{submissions.filter(s => s.decision === 'Approve').length}</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-4">
          <div className="text-cyan-400 text-xs uppercase font-bold mb-1">📋 Total</div>
          <div className="text-2xl font-bold text-white">{submissions.length}</div>
        </div>
      </div>

      {/* Critical Alerts - TOP PRIORITY */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 to-rose-600/5 border border-rose-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2 text-lg">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
            Critical Alerts ({alerts.length})
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {alerts.map((a) => (
              <div key={a._id} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-rose-300">{a.alert}</div>
                  <div className="text-xs text-slate-400 mt-1">Risk Level: {a.risk}</div>
                </div>
                <button onClick={() => acknowledgeAlert(a)} className="text-xs bg-rose-500/20 px-3 py-1 rounded text-rose-300 hover:bg-rose-500/40 transition-all">
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Pending Submissions - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
            📋 Pending Submissions
            {submissions.filter(s => !s.decision || s.decision === 'Flagged').length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                {submissions.filter(s => !s.decision || s.decision === 'Flagged').length} awaiting
              </span>
            )}
          </h3>
          {submissions.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-12 font-mono">
              <div className="text-4xl mb-2">📭</div>
              No submissions yet
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {submissions.map((s) => {
                const fraud = s.fraud || {};
                const score = fraud.score || 0;
                const badge = fraudBadge(score);
                const riskClass = score > 70 ? 'high-risk-alert' : score > 30 ? 'medium-risk-alert' : '';
                return (
                  <div key={s.docId} className={`p - 4 bg - slate - 900 / 30 border border - white / 5 rounded - xl flex justify - between items - center hover: border - cyan - 500 / 30 transition - all ${riskClass} `}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{s.filename || s.docId}</div>
                      <div className="text-xs text-slate-400 mt-1 truncate">
                        {s.userEmail || 'unknown'} • {s.docType || 'UNK'} • {new Date(s.createdAt || Date.now()).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text - xs font - bold px - 2 py - 1 rounded border ${badge.bg} ${badge.border} ${badge.text} `}>
                          {badge.label}: {Math.round(score)}%
                        </span>
                        <span className={`text - xs px - 2 py - 1 rounded ${s.decision === 'Approve' ? 'bg-emerald-500/20 text-emerald-300' : s.decision === 'Reject' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/20 text-slate-300'} `}>
                          {s.decision || 'Pending'}
                        </span>
                        {s.deviceInfo?.hash && (
                          <span className="text-xs px-2 py-1 rounded bg-cyan-500/10 text-cyan-400" title="Device tracked">
                            🖥️
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => setSelectedSubmission(s)}
                        className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs flex items-center gap-1 hover:bg-cyan-500/40 transition-all"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      {(!s.decision || s.decision === 'Flagged') && (
                        <>
                          <button onClick={() => approveSubmission(s)} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs hover:bg-emerald-500/40 transition-all">✓</button>
                          <button onClick={() => rejectSubmission(s)} className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded text-xs hover:bg-rose-500/40 transition-all">✗</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - Audit Stream */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
            📜 Audit Trail
          </h3>
          <div className="overflow-y-auto max-h-[500px] space-y-2">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8 font-mono">No logs yet</div>
            ) : (
              logs.slice(0, 50).map((l, i) => (
                <div key={i} className="p-3 hover:bg-white/5 rounded-lg border-b border-white/5 text-sm">
                  <div className="flex justify-between items-start">
                    <div className="text-slate-200 font-medium text-xs">{l.decision || l.details || "Action"}</div>
                    <div className="font-mono text-[10px] text-cyan-500/70">{l.userEmail?.split('@')[0] || "SYS"}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{new Date(l.createdAt || l.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal - Backdrop */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setSelectedSubmission(null)} />
      )}

      {/* Detail Modal - Content */}
      {selectedSubmission && (
        <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur border-b border-white/10 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedSubmission.filename || selectedSubmission.docId || 'Document'}</h3>
                <p className="text-xs text-cyan-400 mt-1">📧 {selectedSubmission.userEmail || 'unknown'}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Document Info */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold text-cyan-300 mb-3">📋 Document Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-400">Type:</span> <span className="text-white font-mono font-bold">{selectedSubmission.docType || 'N/A'}</span></div>
                  <div><span className="text-slate-400">Uploaded:</span> <span className="text-white font-mono">{selectedSubmission.createdAt ? new Date(selectedSubmission.createdAt).toLocaleString() : 'N/A'}</span></div>
                  <div><span className="text-slate-400">Doc ID:</span> <span className="text-white font-mono text-xs">{selectedSubmission.docId?.substring(0, 16) || 'N/A'}...</span></div>
                  <div><span className="text-slate-400">Status:</span> <span className={`font - bold ${selectedSubmission.decision === 'Approve' ? 'text-emerald-400' : selectedSubmission.decision === 'Reject' ? 'text-rose-400' : 'text-amber-400'} `}>{selectedSubmission.decision || 'Pending'}</span></div>
                </div>
              </div>

              {/* OCR Results */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold text-purple-300 mb-3">🔍 Extracted Data (OCR)</h4>
                {selectedSubmission.verification ? (
                  <div className="space-y-2 text-sm">
                    {selectedSubmission.verification.name ? <div><span className="text-slate-400">Name:</span> <span className="text-white font-mono">{selectedSubmission.verification.name}</span></div> : <div className="text-slate-500 text-xs">No name extracted</div>}
                    {selectedSubmission.verification.aadhaarNumber ? <div><span className="text-slate-400">Aadhaar:</span> <span className="text-white font-mono">XXXX-XXXX-{selectedSubmission.verification.aadhaarNumber?.slice(-4)}</span></div> : null}
                    {selectedSubmission.verification.panNumber ? <div><span className="text-slate-400">PAN:</span> <span className="text-white font-mono">XXXXX{selectedSubmission.verification.panNumber?.slice(-4)}</span></div> : null}
                    {selectedSubmission.verification.dlNumber ? <div><span className="text-slate-400">DL:</span> <span className="text-white font-mono">{selectedSubmission.verification.dlNumber}</span></div> : null}
                    {selectedSubmission.verification.dob ? <div><span className="text-slate-400">DOB:</span> <span className="text-white font-mono">{selectedSubmission.verification.dob}</span></div> : null}
                    {selectedSubmission.verification.gender ? <div><span className="text-slate-400">Gender:</span> <span className="text-white font-mono">{selectedSubmission.verification.gender}</span></div> : null}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm">No OCR data available</div>
                )}
              </div>

              {/* Device Information */}
              {selectedSubmission.deviceInfo && (
                <div className="bg-slate-900/50 p-4 rounded-xl border border-cyan-500/20">
                  <h4 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
                    <span>🖥️</span> Device Fingerprint
                    {selectedSubmission.fraud?.details?.device_fingerprint?.multi_user_device && (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded animate-pulse">
                        ⚠️ SHARED DEVICE
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-slate-500 text-xs block">Browser</span>
                      <span className="text-white font-mono text-xs">{selectedSubmission.deviceInfo.browser || 'Unknown'}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-slate-500 text-xs block">OS</span>
                      <span className="text-white font-mono text-xs">{selectedSubmission.deviceInfo.os || 'Unknown'}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-slate-500 text-xs block">Platform</span>
                      <span className="text-white font-mono text-xs">{selectedSubmission.deviceInfo.platform || 'Unknown'}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-slate-500 text-xs block">Timezone</span>
                      <span className="text-white font-mono text-xs">{selectedSubmission.deviceInfo.timezone || 'Unknown'}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-slate-500 text-xs block">Screen</span>
                      <span className="text-white font-mono text-xs">{selectedSubmission.deviceInfo.screen || 'Unknown'}</span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded">
                      <span className="text-slate-500 text-xs block">Language</span>
                      <span className="text-white font-mono text-xs">{selectedSubmission.deviceInfo.language || 'Unknown'}</span>
                    </div>
                    {selectedSubmission.deviceInfo.hash && (
                      <div className="col-span-2 bg-slate-800/50 p-2 rounded">
                        <span className="text-slate-500 text-xs block">Device Hash</span>
                        <span className="text-cyan-400 font-mono text-xs" title={selectedSubmission.deviceInfo.hash}>
                          {selectedSubmission.deviceInfo.hash.substring(0, 32)}...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Device Risk Summary */}
                  {selectedSubmission.fraud?.details?.device_fingerprint && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`px - 2 py - 1 rounded ${selectedSubmission.fraud.details.device_fingerprint.new_device ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'} `}>
                          {selectedSubmission.fraud.details.device_fingerprint.new_device ? '⚠ New Device' : '✓ Known Device'}
                        </span>
                        <span className={`px - 2 py - 1 rounded ${selectedSubmission.fraud.details.device_fingerprint.multi_user_device ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'} `}>
                          {selectedSubmission.fraud.details.device_fingerprint.multi_user_device
                            ? `🚨 ${selectedSubmission.fraud.details.device_fingerprint.users_on_device} Users`
                            : '✓ Single User'}
                        </span>
                        <span className={`px - 2 py - 1 rounded font - bold ${selectedSubmission.fraud.details.device_fingerprint.risk_score > 15 ? 'bg-rose-500/20 text-rose-300' :
                          selectedSubmission.fraud.details.device_fingerprint.risk_score > 5 ? 'bg-amber-500/20 text-amber-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          } `}>
                          Device Risk: +{selectedSubmission.fraud.details.device_fingerprint.risk_score || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fraud Analysis - Explainable AI Component */}
              <FraudExplanation fraud={selectedSubmission.fraud} verification={selectedSubmission.verification} />

              {/* Action Buttons */}
              {(!selectedSubmission.decision || selectedSubmission.decision === 'Flagged') && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => approveSubmission(selectedSubmission)}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/50"
                  >
                    ✓ Approve KYC
                  </button>
                  <button
                    onClick={() => rejectSubmission(selectedSubmission)}
                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-500/50"
                  >
                    ✗ Reject KYC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
