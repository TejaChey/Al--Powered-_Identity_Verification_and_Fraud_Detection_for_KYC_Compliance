import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDocs, verifyDocument } from "./api";
import OCRPreview from "./components/OCRPreview";
import VerificationCard from "./components/VerificationCard";
import DashboardCharts from "./components/DashboardCharts";
import SubmissionsTable from "./components/SubmissionsTable";
import AdminPanel from "./components/AdminPanel";
import ScanningLoader from "./components/ScanningLoader";
import { Upload, FileText, Shield, LogOut, LayoutDashboard, ChevronDown, UserCircle, ScanLine, Activity, Fingerprint, CreditCard, Search } from "lucide-react"; // Added Background Icons

function Dashboard() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [docs, setDocs] = useState([]);
  const [previewOcr, setPreviewOcr] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); 
  const [documentType, setDocumentType] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // --- User Info ---
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.sub || "user@kyc.com";
        setUserEmail(email);
        const nameFromEmail = email.split('@')[0];
        setUserName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
      } catch (e) { console.error(e); }
      fetchDocuments(token);
    }
  }, [navigate]);

  const fetchDocuments = async (token) => {
    try {
      const data = await getUserDocs(token);
      const arr = Array.isArray(data) ? data : (data.documents || []);
      const normalized = arr.map((d) => ({
        ...d,
        _id: d._id || d.id,
        submissionId: d._id,
        verified: d.decision === "Pass" || (d.fraud && d.fraud.score < 30), 
        documentType: d.docType || (d.parsed?.aadhaarNumber ? "Aadhaar" : (d.parsed?.panNumber ? "PAN" : "UNKNOWN")),
      }));
      setDocs(normalized);
    } catch (err) { console.error(err); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
      setPreviewOcr(null); setVerificationResult(null); setMessage("");
      const name = file.name.toLowerCase();
      if (name.includes("pan")) setDocumentType("PAN");
      else if (name.includes("aadhaar") || name.includes("adhar")) setDocumentType("AADHAAR");
      else setDocumentType(null);
    }
  };

  const handleExtractData = async () => {
    const token = localStorage.getItem("token");
    if (!selectedFile) return;
    try {
      setLoading(true); setMessage("Initializing Neural Scan...");
      const apiResponse = await verifyDocument(token, selectedFile);
      const { verification, fraud, decision, docId } = apiResponse;
      const parsed = verification?.parsed || {};
      
      let detectedType = "Unknown";
      if (parsed.aadhaarNumber) detectedType = "Aadhaar";
      else if (parsed.panNumber) detectedType = "PAN";
      else if (documentType) detectedType = documentType;

      const ocrData = {
        name: parsed.name || "N/A",
        aadhaar: parsed.aadhaarNumber || null,
        pan: parsed.panNumber || null,
        dob: parsed.dob || "N/A",
        rawText: verification?.rawText || "",
        maskedAadhaar: parsed.aadhaarNumber ? `XXXX-${parsed.aadhaarNumber.slice(-4)}` : "N/A",
      };
      setPreviewOcr(ocrData);

      const resultObj = {
        submissionId: docId, documentType: detectedType, verified: decision === "Pass",
        tampered: fraud?.details?.manipulation_suspected || false,
        maskedAadhaar: ocrData.maskedAadhaar, timestamp: new Date().toISOString(),
        verification, fraud: { score: Math.round(fraud?.score || 0), category: fraud?.band }
      };

      setVerificationResult(resultObj);
      setSubmissionsList((prev) => [resultObj, ...prev]);
      fetchDocuments(token);
    } catch (err) { alert("Processing Error."); } finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  return (
    <div className="cyber-container selection:bg-cyan-500/30 relative">
      <div className="cyber-grid"></div>
      <div className="cyber-bg-glow"></div>

      {/* --- BACKGROUND FLOATING ELEMENTS --- */}
      <div className="absolute top-10 right-[-100px] opacity-[0.03] pointer-events-none animate-pulse">
        <Fingerprint size={500} className="text-cyan-400" />
      </div>
      <div className="absolute bottom-20 left-[-50px] opacity-[0.03] pointer-events-none animate-float">
        <CreditCard size={400} className="text-purple-400 rotate-12" />
      </div>
      <div className="absolute top-40 left-1/3 opacity-[0.02] pointer-events-none animate-ping" style={{animationDuration: '4s'}}>
        <Search size={200} className="text-emerald-400" />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20"><Shield className="text-white w-6 h-6" /></div>
              <div>
                <span className="block text-xl font-bold text-white tracking-tight">KYC<span className="text-cyan-400">.AI</span></span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Secure Vision</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {['home', 'submissions', 'admin'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeTab === tab ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-105" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                  {tab === 'home' && <ScanLine className="w-4 h-4"/>}
                  {tab === 'submissions' && <FileText className="w-4 h-4"/>}
                  {tab === 'admin' && <Activity className="w-4 h-4"/>}
                  <span className="hidden sm:inline">{tab}</span>
                </button>
              ))}
            </div>

            <div className="relative">
              <button onClick={() => setShowUserDropdown(!showUserDropdown)} className="flex items-center gap-3 focus:outline-none group pl-4 border-l border-white/10">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{userName}</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Verified User</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center group-hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                   <UserCircle className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)}></div>
                  <div className="absolute right-0 top-full mt-4 w-56 bg-[#0f172a] rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="text-sm font-bold text-white">Signed In As</p>
                      <p className="text-xs text-cyan-400 font-mono truncate">{userEmail}</p>
                    </div>
                    <div className="p-2">
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-2 font-medium">
                        <LogOut className="w-4 h-4" /> Terminate Session
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 min-h-[80vh]">
        
        {/* --- HOME TAB --- */}
        {activeTab === "home" && (
          <div className="flex flex-col lg:flex-row gap-8 items-start animate-tech-enter">
            {/* LEFT PANEL */}
            <div className="w-full lg:w-1/3 glass-panel p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
              
              <div className="mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Upload className="text-cyan-400" /> Scan Input</h2>
              </div>
              <div className="space-y-6">
                <div className="relative group">
                  <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center transition-all group-hover:border-cyan-400 group-hover:bg-cyan-400/5">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-lg" />
                    ) : (
                      <div className="py-8"><Upload className="w-12 h-12 text-slate-500 mx-auto mb-2 group-hover:text-cyan-400" /><p className="text-slate-300 font-bold">Drop File Here</p></div>
                    )}
                  </div>
                </div>
                <button onClick={handleExtractData} disabled={loading || !selectedFile} className="btn-luminous w-full flex justify-center items-center gap-2">{loading ? "SCANNING..." : "INITIATE ANALYSIS"}</button>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="w-full lg:w-2/3 space-y-6">
              {loading && <div className="glass-panel p-12 flex justify-center"><ScanningLoader /></div>}
              {!loading && !verificationResult && (
                <div className="h-[400px] border border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 animate-pulse-glow">
                  <Activity className="w-16 h-16 opacity-20 mb-4" /><p className="font-mono tracking-widest">SYSTEM READY</p>
                </div>
              )}
              {!loading && verificationResult && (
                <div className="space-y-6 animate-tech-enter">
                  <VerificationCard result={verificationResult} fraud={verificationResult.fraud} />
                  <div className="grid md:grid-cols-2 gap-6">
                    <OCRPreview ocr={previewOcr} />
                    <div className="glass-panel p-6"><h4 className="font-bold text-white mb-4 font-mono text-xs uppercase tracking-wider">Visual Metrics</h4><DashboardCharts submissions={[...submissionsList, ...docs]} /></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SUBMISSIONS TAB --- */}
        {activeTab === "submissions" && (
          <div className="space-y-8 animate-tech-enter">
             <div className="grid md:grid-cols-3 gap-6">
                {[{l:"Total Scans",v:docs.length,c:"text-white"}, {l:"Verified",v:docs.filter(d=>d.verified).length,c:"text-emerald-400"}, {l:"Flagged",v:docs.filter(d=>!d.verified).length,c:"text-rose-400"}].map((s,i)=>(
                  <div key={i} className="glass-panel p-6 text-center border-t-4 border-t-cyan-500/20"><h3 className="text-slate-400 text-xs font-mono uppercase mb-2">{s.l}</h3><p className={`text-4xl font-bold ${s.c}`}>{s.v}</p></div>
                ))}
             </div>
             <div className="glass-panel p-6"><SubmissionsTable submissions={[...submissionsList, ...docs]} onRefresh={async (id) => fetchDocuments(localStorage.getItem("token"))} /></div>
          </div>
        )}

        {/* --- ADMIN TAB --- */}
        {activeTab === "admin" && (
          <div className="glass-panel p-6 animate-tech-enter">
            <AdminPanel />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;