import React, { useEffect, useState } from "react";
// --- FIXED IMPORT: Points to src/api.js ---
import { getAlerts, getLogs, addLog, dismissAlert } from "../api"; 

export default function AdminPanel() {
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [alertsData, logsData] = await Promise.all([getAlerts(), getLogs()]);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      console.error("Admin fetch error", err);
      setMessage("Failed to load compliance data. Is Backend running?");
    } finally {
      setLoading(false);
    }
  }

  // Dismiss Alert Logic
  async function acknowledgeAlert(alert) {
    try {
      // 1. Call Backend to mark as seen
      await dismissAlert(alert._id);

      // 2. Add to Audit Log
      const payload = {
        userId: "admin",
        userEmail: "admin@system",
        docId: alert._id,
        decision: "Review",
        fraud_score: 0,
        details: `Alert Dismissed: ${alert.alert}`
      };
      await addLog(payload);
      
      // 3. Remove from UI immediately
      setAlerts(prev => prev.filter(a => a._id !== alert._id));
      
      // 4. Refresh logs
      const newLogs = await getLogs();
      setLogs(newLogs);
      
    } catch (err) {
      console.error("Acknowledge failed", err);
      setMessage("Failed to dismiss alert.");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold font-display text-text-primary">Admin — Compliance Console</h2>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-gradient-to-r from-luxury-gold to-luxury-neon text-white rounded-xl shadow hover:opacity-90 transition-all"
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-600">{message}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* ALERTS SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-surface-stroke card-shadow">
          <h3 className="font-semibold mb-4 text-lg text-text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            Live Fraud Alerts
          </h3>
          {alerts.length === 0 ? (
            <div className="text-sm text-text-secondary p-4 bg-surface-muted rounded-lg border border-surface-stroke text-center">
              No active fraud alerts. System secure.
            </div>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {alerts.map((a) => (
                <li key={a._id} className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl flex justify-between items-start transition-all hover:border-rose-200">
                  <div>
                    <div className="text-sm font-bold text-rose-700">{a.alert || "Suspicious Activity"}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      User: {a.user || "Unknown"}<br/>
                      Risk: <span className="font-semibold">{a.risk}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2">
                      {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(a)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-600 hover:text-white transition-colors shadow-sm"
                  >
                    Dismiss
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* AUDIT LOGS SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-surface-stroke card-shadow">
          <h3 className="font-semibold mb-4 text-lg text-text-primary">Audit Trail</h3>
          {logs.length === 0 ? (
            <div className="text-sm text-text-secondary">No logs found.</div>
          ) : (
            <div className="overflow-x-auto max-h-96 pr-2">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-muted text-text-secondary sticky top-0">
                  <tr>
                    <th className="pb-2 pl-2">Time</th>
                    <th className="pb-2">User</th>
                    <th className="pb-2">Decision</th>
                    <th className="pb-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-stroke">
                  {logs.map((l) => (
                    <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pl-2 text-xs text-gray-500">
                        {new Date(l.createdAt || l.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-medium text-text-primary">
                        {l.userEmail || "System"}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          l.decision === "Pass" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {l.decision}
                        </span>
                      </td>
                      <td className="py-3 text-xs font-mono">
                        {l.fraud_score ? `${l.fraud_score}%` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}