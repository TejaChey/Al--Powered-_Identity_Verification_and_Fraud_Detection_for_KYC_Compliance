import React, { useEffect, useState } from "react";
import { getAlerts, getLogs, addLog, dismissAlert, getSubmissions, setDocumentDecision } from "../api";
import { Eye, BarChart3, Users, FileText, CheckCircle, XCircle, Clock, X, ChevronRight, AlertTriangle, Shield, ShieldCheck, RefreshCw, Inbox, Search, Clipboard, ScrollText, Mail, Check } from "lucide-react";
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
  @keyframes alertHighlightGlow {
    0%, 100% { 
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.8), 0 0 30px rgba(56, 189, 248, 0.5), 0 0 50px rgba(139, 92, 246, 0.3);
      border-color: rgba(56, 189, 248, 0.8);
    }
    50% { 
      box-shadow: 0 0 20px rgba(56, 189, 248, 1), 0 0 50px rgba(56, 189, 248, 0.7), 0 0 80px rgba(139, 92, 246, 0.5);
      border-color: rgba(139, 92, 246, 0.8);
    }
  }
  .high-risk-alert {
    animation: highRiskPulse 1.5s ease-in-out infinite, highRiskFlash 1.5s ease-in-out infinite;
  }
  .medium-risk-alert {
    animation: mediumRiskGlow 2s ease-in-out infinite;
  }
  .risk-badge-high { animation: highRiskPulse 1s ease-in-out infinite; }
  .alert-highlight {
    animation: alertHighlightGlow 0.8s ease-in-out infinite !important;
    border-width: 2px !important;
    border-color: rgba(56, 189, 248, 0.8) !important;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.8), 0 0 40px rgba(139, 92, 246, 0.5) !important;
  }
`;

export default function AdminPanel() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [activeTab, setActiveTab] = useState('submissions');
  const [highlightedUser, setHighlightedUser] = useState(null); // Track user to highlight from alert

  // Group submissions by userEmail
  const groupedSubmissions = submissions.reduce((acc, sub) => {
    const email = sub.userEmail || 'unknown@user.com';
    if (!acc[email]) {
      acc[email] = [];
    }
    acc[email].push(sub);
    return acc;
  }, {});

  // Toggle user expansion
  const toggleUserExpand = (email) => {
    setExpandedUsers(prev => ({ ...prev, [email]: !prev[email] }));
  };

  // Navigate to a specific submission from an alert
  const navigateToSubmission = (alert) => {
    // Try multiple possible fields for user email
    const userEmail = alert.user || alert.userEmail || alert.email || alert.userId || null;

    console.log('Alert data:', alert); // Debug log
    console.log('User email found:', userEmail); // Debug log

    // Switch to submissions tab
    setActiveTab('submissions');

    // Expand the user's section and highlight it
    if (userEmail) {
      setExpandedUsers(prev => ({ ...prev, [userEmail]: true }));
      setHighlightedUser(userEmail);

      // Auto-clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightedUser(prev => prev === userEmail ? null : prev);
      }, 5000);
    }

    // Find the matching submission based on alert data (aadhaar, pan, or dl)
    const matchingSubmission = submissions.find(s => {
      const sEmail = s.userEmail || '';
      const verification = s.verification || {};

      // Match by user email first
      if (userEmail && sEmail.toLowerCase() === userEmail.toLowerCase()) {
        // Further match by document identifiers if available
        if (alert.aadhaar && verification.aadhaarNumber?.includes(alert.aadhaar.slice(-4))) return true;
        if (alert.pan && verification.panNumber?.includes(alert.pan.slice(-4))) return true;
        if (alert.dl && verification.dlNumber) return true;
        // If no specific document match but same user, return the most recent pending one
        if (!s.decision || s.decision === 'Flagged') return true;
      }
      return false;
    });

    // Open the submission detail modal if found (don't auto-open, let user click)
    // The highlight effect will guide them

    // Show toast notification
    if (userEmail) {
      showToast(`Navigating to ${userEmail}'s submissions`, 'info');
    } else {
      showToast('Alert has no associated user - showing all submissions', 'warning');
    }
  };

  // Clear highlight when user clicks on the highlighted card
  const handleUserCardClick = (email) => {
    if (highlightedUser === email) {
      setHighlightedUser(null);
    }
    toggleUserExpand(email);
  };

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
      await addLog({ userId: "admin", details: `Dismissed: ${alert.alert}` });
      setAlerts(prev => prev.filter(a => a._id !== alert._id));
      const newLogs = await getLogs(); setLogs(newLogs);
    } catch (err) { console.error(err); }
  }

  async function approveSubmission(s) {
    try {
      const token = localStorage.getItem('token');
      await setDocumentDecision(token, s.docId, 'Approve', 'Approved by admin');
      await addLog({ userId: 'admin', details: `Approved doc ${s.docId}` });
      const newSubs = await getSubmissions(token);
      setSubmissions(newSubs);
      const newLogs = await getLogs(); setLogs(newLogs);
      setSelectedSubmission(null);
      showToast('Document approved successfully', 'success');
    } catch (err) { console.error(err); showToast('Failed to approve', 'error'); }
  }

  async function rejectSubmission(s) {
    try {
      const token = localStorage.getItem('token');
      await setDocumentDecision(token, s.docId, 'Reject', 'Rejected by admin');
      await addLog({ userId: 'admin', details: `Rejected doc ${s.docId}` });
      const newSubs = await getSubmissions(token);
      setSubmissions(newSubs);
      const newLogs = await getLogs(); setLogs(newLogs);
      setSelectedSubmission(null);
      showToast('Document rejected', 'info');
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
      <style>{alertStyles}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" /> Admin Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage KYC submissions, alerts, and audit trail</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-bold uppercase hover:bg-cyan-500/30 transition-all flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Frosted Glass Navigation Bar */}
      <div className="sticky top-0 z-30 mb-6">
        <div className="backdrop-blur-xl bg-slate-900/70 border border-white/10 rounded-2xl p-2 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Navigation Tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeTab === 'submissions'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 shadow-lg shadow-cyan-500/20 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Users className="w-4 h-4" />
                Users
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeTab === 'submissions' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700 text-slate-400'}`}>
                  {Object.keys(groupedSubmissions).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeTab === 'alerts'
                  ? 'bg-gradient-to-r from-rose-500/30 to-orange-500/30 text-rose-300 shadow-lg shadow-rose-500/20 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Alerts
                {alerts.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full animate-pulse ${activeTab === 'alerts' ? 'bg-rose-500/30 text-rose-200' : 'bg-rose-500/50 text-rose-200'}`}>
                    {alerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${activeTab === 'audit'
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 shadow-lg shadow-purple-500/20 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <FileText className="w-4 h-4" />
                Audit
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${activeTab === 'audit' ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-700 text-slate-400'}`}>
                  {logs.length}
                </span>
              </button>
            </div>

            {/* Stats Pills */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">{submissions.filter(s => !s.decision || s.decision === 'Flagged').length}</span>
                <span className="text-[10px] text-amber-400/70">Pending</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">{submissions.filter(s => s.decision === 'Approve').length}</span>
                <span className="text-[10px] text-emerald-400/70">Approved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== TAB CONTENT ========== */}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="animate-tech-enter">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> User Submissions
              {submissions.filter(s => !s.decision || s.decision === 'Flagged').length > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                  {submissions.filter(s => !s.decision || s.decision === 'Flagged').length} pending
                </span>
              )}
            </h3>

            {Object.keys(groupedSubmissions).length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-12 font-mono">
                <Inbox className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                No submissions yet
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {Object.entries(groupedSubmissions).map(([email, userDocs]) => {
                  const isExpanded = expandedUsers[email] ?? true;
                  const pendingCount = userDocs.filter(d => !d.decision || d.decision === 'Flagged').length;
                  const approvedCount = userDocs.filter(d => d.decision === 'Approve').length;
                  const rejectedCount = userDocs.filter(d => d.decision === 'Reject').length;
                  const maxRisk = Math.max(...userDocs.map(d => d.fraud?.score || 0));
                  const riskBadge = fraudBadge(maxRisk);

                  return (
                    <div
                      key={email}
                      className={`bg-slate-900/50 border rounded-xl overflow-hidden flex flex-col transition-all ${highlightedUser === email ? 'border-cyan-400' : 'border-white/10'}`}
                      style={highlightedUser === email ? {
                        boxShadow: '0 0 20px rgba(56, 189, 248, 0.8), 0 0 40px rgba(139, 92, 246, 0.5), 0 0 60px rgba(56, 189, 248, 0.3)',
                        borderColor: 'rgba(56, 189, 248, 0.8)',
                        animation: 'alertHighlightGlow 0.8s ease-in-out infinite'
                      } : {}}
                    >
                      {/* Highlight indicator banner */}
                      {highlightedUser === email && (
                        <div className="bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-cyan-300 text-xs font-bold py-1 px-3 flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" /> Alert Source - Click to review
                        </div>
                      )}
                      <button
                        onClick={() => handleUserCardClick(email)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar - Purple gradient for admins, Cyan for regular users */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white border ${userDocs[0]?.userRole === 'admin'
                            ? 'bg-gradient-to-br from-purple-500/40 to-pink-500/40 border-purple-400/30'
                            : 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-white/10'
                            }`}>
                            {email.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm truncate max-w-[100px]">{email}</span>
                              {/* Admin Badge */}
                              {userDocs[0]?.userRole === 'admin' && (
                                <span className="px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] font-bold rounded flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{userDocs.length} docs</span>
                              {pendingCount > 0 && <span className="text-amber-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{pendingCount}</span>}
                              {approvedCount > 0 && <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" />{approvedCount}</span>}
                              {rejectedCount > 0 && <span className="text-rose-400 flex items-center gap-0.5"><X className="w-3 h-3" />{rejectedCount}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskBadge.bg} ${riskBadge.border} ${riskBadge.text}`}>
                            {riskBadge.label}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-white/5 bg-slate-950/30 p-3 space-y-2 max-h-[200px] overflow-y-auto">
                          {userDocs.map((s) => {
                            const score = s.fraud?.score || 0;
                            const badge = fraudBadge(score);
                            return (
                              <div key={s.docId} className="p-2 bg-slate-900/50 border border-white/5 rounded-lg flex justify-between items-center hover:border-cyan-500/30 transition-all">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-white truncate">{s.docType || 'Unknown'}</div>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>{Math.round(score)}%</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${s.decision === 'Approve' ? 'bg-emerald-500/20 text-emerald-300' : s.decision === 'Reject' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/20 text-slate-300'}`}>
                                      {s.decision || 'Pending'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-1">
                                  <button onClick={() => setSelectedSubmission(s)} className="p-1 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/40" title="View"><Eye className="w-3 h-3" /></button>
                                  {(!s.decision || s.decision === 'Flagged') && (
                                    <>
                                      <button onClick={() => approveSubmission(s)} className="p-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/40" title="Approve"><CheckCircle className="w-3 h-3" /></button>
                                      <button onClick={() => rejectSubmission(s)} className="p-1 bg-rose-500/20 text-rose-300 rounded hover:bg-rose-500/40" title="Reject"><XCircle className="w-3 h-3" /></button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="animate-tech-enter">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Critical Alerts
            </h3>
            {alerts.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-12 font-mono">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
                No active alerts
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {alerts.map((a) => (
                  <div
                    key={a._id}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl high-risk-alert cursor-pointer hover:border-rose-500/50 transition-all group"
                    onClick={() => navigateToSubmission(a)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-rose-300">{a.alert}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-rose-500/20 rounded text-rose-300 font-bold">
                            Risk: {a.risk}
                          </span>
                        </div>
                        {/* User Info */}
                        {a.user && (
                          <div className="text-xs text-cyan-400 mt-2 flex items-center gap-1 font-medium">
                            <Mail className="w-3 h-3" /> {a.user}
                          </div>
                        )}
                        {/* Timestamp */}
                        {a.timestamp && (
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(a.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })} at {new Date(a.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigateToSubmission(a); }}
                          className="text-xs bg-cyan-500/20 px-3 py-1 rounded text-cyan-300 hover:bg-cyan-500/40 transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); acknowledgeAlert(a); }}
                          className="text-xs bg-rose-500/20 px-3 py-1 rounded text-rose-300 hover:bg-rose-500/40 transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view submission →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="animate-tech-enter">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
              <ScrollText className="w-5 h-5" /> Audit Trail
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">{logs.length} entries</span>
            </h3>
            {logs.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-12 font-mono">
                <FileText className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                No logs yet
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {logs.slice(0, 50).map((l, i) => {
                  // Determine action type and styling
                  const isApprove = l.decision === 'Approve';
                  const isReject = l.decision === 'Reject';
                  const actionColor = isApprove ? 'text-emerald-400' : isReject ? 'text-rose-400' : 'text-amber-400';
                  const actionBg = isApprove ? 'bg-emerald-500/10 border-emerald-500/20' : isReject ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20';

                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${actionBg} group`}
                      onClick={() => {
                        // Navigate to the submission
                        if (l.userEmail || l.userId) {
                          const userEmail = l.userEmail || '';
                          setActiveTab('submissions');
                          setExpandedUsers(prev => ({ ...prev, [userEmail]: true }));
                          setHighlightedUser(userEmail);
                          setTimeout(() => setHighlightedUser(prev => prev === userEmail ? null : prev), 5000);
                          showToast(`Navigating to ${userEmail || 'user'}'s submissions`, 'info');
                        }
                      }}
                    >
                      {/* Header Row - Decision & Time */}
                      <div className="flex justify-between items-start mb-2">
                        <div className={`flex items-center gap-1.5 ${actionColor} font-bold text-sm`}>
                          {isApprove && <CheckCircle className="w-4 h-4" />}
                          {isReject && <XCircle className="w-4 h-4" />}
                          {!isApprove && !isReject && <Clock className="w-4 h-4" />}
                          {l.decision || l.action || "Document Processed"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {l.docId ? `#${l.docId.slice(-6)}` : ''}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-1.5 text-xs text-cyan-400 mb-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{l.userEmail || 'Unknown User'}</span>
                      </div>

                      {/* Document Details */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-2">
                        {l.aadhaar && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Aadhaar:</span>
                            <span className="font-mono text-slate-300">XXXX-{l.aadhaar.slice(-4)}</span>
                          </div>
                        )}
                        {l.pan && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">PAN:</span>
                            <span className="font-mono text-slate-300">*****{l.pan.slice(-4)}</span>
                          </div>
                        )}
                        {l.dl && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">DL:</span>
                            <span className="font-mono text-slate-300">***{l.dl.slice(-4)}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes if available */}
                      {l.notes && (
                        <div className="text-[10px] text-slate-500 italic mb-2 truncate">
                          "{l.notes}"
                        </div>
                      )}

                      {/* Footer - Timestamp & View Link */}
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {l.createdAt || l.timestamp ? new Date(l.createdAt || l.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'No date'}
                        </div>
                        <div className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View Submission
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setSelectedSubmission(null)} />
          <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full shadow-2xl animate-tech-enter">
              <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur border-b border-white/10 p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedSubmission.filename || selectedSubmission.docId || 'Document'}</h3>
                  <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedSubmission.userEmail || 'unknown'}</p>
                </div>
                <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <h4 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2"><Clipboard className="w-4 h-4" /> Document Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-400">Type:</span> <span className="text-white font-mono font-bold">{selectedSubmission.docType || 'N/A'}</span></div>
                    <div><span className="text-slate-400">Uploaded:</span> <span className="text-white font-mono">{selectedSubmission.createdAt ? new Date(selectedSubmission.createdAt).toLocaleString() : 'N/A'}</span></div>
                    <div><span className="text-slate-400">Doc ID:</span> <span className="text-white font-mono text-xs">{selectedSubmission.docId?.substring(0, 16) || 'N/A'}...</span></div>
                    <div><span className="text-slate-400">Status:</span> <span className={`font-bold ${selectedSubmission.decision === 'Approve' ? 'text-emerald-400' : selectedSubmission.decision === 'Reject' ? 'text-rose-400' : 'text-amber-400'}`}>{selectedSubmission.decision || 'Pending'}</span></div>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2"><Search className="w-4 h-4" /> Extracted Data (OCR)</h4>
                  {selectedSubmission.verification ? (
                    <div className="space-y-2 text-sm">
                      {selectedSubmission.verification.name && <div><span className="text-slate-400">Name:</span> <span className="text-white font-mono">{selectedSubmission.verification.name}</span></div>}
                      {selectedSubmission.verification.aadhaarNumber && <div><span className="text-slate-400">Aadhaar:</span> <span className="text-white font-mono">XXXX-XXXX-{selectedSubmission.verification.aadhaarNumber?.slice(-4)}</span></div>}
                      {selectedSubmission.verification.panNumber && <div><span className="text-slate-400">PAN:</span> <span className="text-white font-mono">XXXXX{selectedSubmission.verification.panNumber?.slice(-4)}</span></div>}
                      {selectedSubmission.verification.dob && <div><span className="text-slate-400">DOB:</span> <span className="text-white font-mono">{selectedSubmission.verification.dob}</span></div>}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm">No OCR data available</div>
                  )}
                </div>

                <FraudExplanation fraud={selectedSubmission.fraud} verification={selectedSubmission.verification} />

                {(!selectedSubmission.decision || selectedSubmission.decision === 'Flagged') && (
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button onClick={() => approveSubmission(selectedSubmission)} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Approve KYC
                    </button>
                    <button onClick={() => rejectSubmission(selectedSubmission)} className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition-all shadow-lg flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" /> Reject KYC
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
