import React, { useEffect, useState } from "react";
import { getAlerts, getLogs, addLog, dismissAlert } from "../api";

export default function AdminPanel() {
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [a, l] = await Promise.all([getAlerts(), getLogs()]);
      setAlerts(Array.isArray(a) ? a : []);
      setLogs(Array.isArray(l) ? l : []);
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

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Command Center</h2>
        <button onClick={fetchData} className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg text-xs font-bold uppercase hover:bg-cyan-500/30 transition-all">Refresh Link</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Critical Alerts</h3>
          {alerts.length === 0 ? <div className="text-slate-500 text-sm text-center py-8 font-mono">SYSTEM NOMINAL</div> : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li key={a._id} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex justify-between items-start">
                  <div><div className="text-sm font-bold text-rose-300">{a.alert}</div><div className="text-xs text-slate-400 mt-1">Risk: {a.risk}</div></div>
                  <button onClick={() => acknowledgeAlert(a)} className="text-xs bg-rose-500/20 px-3 py-1 rounded text-rose-300 hover:bg-rose-500/40">Dismiss</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">Audit Stream</h3>
          <div className="overflow-y-auto max-h-96 space-y-2">
            {logs.map((l, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg border-b border-white/5 text-sm">
                 <div><div className="text-slate-200 font-medium">{l.decision || "Action Logged"}</div><div className="text-xs text-slate-500">{new Date(l.createdAt||l.timestamp).toLocaleString()}</div></div>
                 <div className="font-mono text-xs text-cyan-500/70">{l.userEmail?.split('@')[0] || "SYS"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}