import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// API
import { getUserDocs, verifyDocument } from "./api";

// Components
import OCRPreview from "./components/OCRPreview";
import VerificationCard from "./components/VerificationCard";
import DashboardCharts from "./components/DashboardCharts";
import SubmissionsTable from "./components/SubmissionsTable";
import AdminPanel from "./components/AdminPanel";
import ScanningLoader from "./components/ScanningLoader";

// Icons
import { 
  Upload, 
  FileText, 
  Shield, 
  LogOut, 
  LayoutDashboard, 
  User, 
  ChevronDown, 
  UserCircle 
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();

  // --- State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [docs, setDocs] = useState([]);
  
  // Results
  const [previewOcr, setPreviewOcr] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); 
  const [documentType, setDocumentType] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // --- Auth Check ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/"); 
    else fetchDocuments(token);
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
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch documents.");
    }
  };

  // --- File Handling ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      
      // Reset UI
      setPreviewOcr(null);
      setVerificationResult(null);
      setMessage("");

      // Smart type hint
      const fileName = file.name.toLowerCase();
      if (fileName.includes("pan")) setDocumentType("PAN");
      else if (fileName.includes("aadhaar") || fileName.includes("adhar")) setDocumentType("AADHAAR");
      else setDocumentType(null);
    }
  };

  function maskAadhaar(a) {
    if (!a) return a;
    const s = String(a);
    return s.length < 4 ? s : `XXXX-XXXX-${s.slice(-4)}`;
  }

  // --- Main Process ---
  const handleExtractData = async () => {
    const token = localStorage.getItem("token");
    if (!selectedFile) return;

    try {
      setLoading(true);
      setMessage("Analyzing document with AI...");

      const apiResponse = await verifyDocument(token, selectedFile);
      
      const { verification, fraud, decision, docId } = apiResponse;
      const parsed = verification?.parsed || {};
      
      let detectedType = "Unknown Document";
      if (parsed.aadhaarNumber) detectedType = "Aadhaar";
      else if (parsed.panNumber) detectedType = "PAN";
      else if (documentType) detectedType = documentType;

      const ocrData = {
        name: parsed.name || "N/A",
        aadhaar: parsed.aadhaarNumber || null,
        pan: parsed.panNumber || null,
        dob: parsed.dob || "N/A",
        rawText: verification?.rawText || "",
        maskedAadhaar: parsed.aadhaarNumber ? maskAadhaar(parsed.aadhaarNumber) : "N/A",
      };
      setPreviewOcr(ocrData);

      const resultObj = {
        submissionId: docId,
        documentType: detectedType,
        verified: decision === "Pass",
        tampered: fraud?.details?.manipulation_suspected || false,
        maskedAadhaar: ocrData.maskedAadhaar,
        timestamp: new Date().toISOString(),
        verification, 
        fraud: {
            score: Math.round(fraud?.score || 0),
            category: fraud?.band 
        }
      };

      setVerificationResult(resultObj);
      setSubmissionsList((prev) => [resultObj, ...prev]);
      fetchDocuments(token);
      setMessage("Verification complete.");

    } catch (err) {
      console.error("Verification Error:", err);
      setMessage("Verification failed. Please check the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Left: Brand */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
                 <Shield className="text-white w-6 h-6" />
              </div>
              <div>
                <span className="block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-none">
                  KYC Portal
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure Verification</span>
              </div>
            </div>

            {/* Center: Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 backdrop-blur-md">
              {['home', 'submissions', 'admin'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
                >
                  {tab === 'home' && <Upload className="w-4 h-4"/>}
                  {tab === 'submissions' && <FileText className="w-4 h-4"/>}
                  {tab === 'admin' && <LayoutDashboard className="w-4 h-4"/>}
                  <span className="hidden sm:inline">{tab}</span>
                </button>
              ))}
            </div>

            {/* Right: Premium Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-3 focus:outline-none group pl-4 border-l border-slate-200"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">User Account</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Verified Member</p>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-md hover:shadow-indigo-500/40 transition-all cursor-pointer">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)}></div>
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800">Signed In</p>
                      <p className="text-xs text-slate-500 truncate">user@secure-kyc.com</p>
                    </div>
                    
                    <div className="p-2">
                      <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2">
                        <UserCircle className="w-4 h-4" /> My Profile
                      </button>
                    </div>
                    
                    <div className="p-2 border-t border-slate-50">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* LEFT: Upload Section */}
            <div className="w-full lg:w-1/3 glass-card p-8 animate-slide-up">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Verify Identity</h2>
                <p className="text-slate-500 mt-1 text-sm">Upload an official government ID (Aadhaar/PAN) for AI analysis.</p>
              </div>

              <div className="space-y-6">
                <div className="group relative">
                  <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center transition-all duration-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/30">
                    {previewUrl ? (
                      <div className="relative h-48 w-full overflow-hidden rounded-xl shadow-sm">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="font-semibold text-slate-700">Click to Upload</p>
                        <p className="text-xs text-slate-400 mt-1">JPG or PNG (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleExtractData}
                  disabled={loading || !selectedFile}
                  className="btn-primary w-full flex justify-center items-center gap-2"
                >
                   {loading ? "Processing..." : "Verify Document"}
                </button>
                
                {message && (
                  <p className="text-center text-xs font-medium text-indigo-600 animate-pulse">{message}</p>
                )}
              </div>
            </div>

            {/* RIGHT: Results Section */}
            <div className="w-full lg:w-2/3 space-y-6">
              
              {/* State 1: Loading */}
              {loading && (
                 <div className="glass-card p-12 flex justify-center animate-fade-in">
                    <ScanningLoader />
                 </div>
              )}

              {/* State 2: Empty State */}
              {!loading && !verificationResult && (
                <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/30">
                  <Shield className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-medium">Results will appear here</p>
                  <p className="text-sm opacity-60">Upload a document to start analysis</p>
                </div>
              )}

              {/* State 3: Results */}
              {!loading && verificationResult && (
                <div className="animate-slide-up space-y-6">
                  {/* 1. Fraud Card */}
                  <VerificationCard result={verificationResult} fraud={verificationResult.fraud} />
                  
                  {/* 2. OCR Details & Charts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <OCRPreview ocr={previewOcr} />
                    <div className="glass-card p-6">
                       <h4 className="font-bold text-slate-700 mb-4">Risk Analysis</h4>
                       <DashboardCharts submissions={[...submissionsList, ...docs]} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBMISSIONS TAB */}
        {activeTab === "submissions" && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-6">
               <div className="glass-card p-6">
                  <h3 className="text-slate-500 text-sm font-medium">Total Documents</h3>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{docs.length}</p>
               </div>
               <div className="glass-card p-6">
                  <h3 className="text-slate-500 text-sm font-medium">Verified Safe</h3>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">
                    {docs.filter(d => d.verified).length}
                  </p>
               </div>
               <div className="glass-card p-6">
                  <h3 className="text-slate-500 text-sm font-medium">Flagged Risk</h3>
                  <p className="text-3xl font-bold text-rose-600 mt-2">
                    {docs.filter(d => !d.verified).length}
                  </p>
               </div>
            </div>
            <SubmissionsTable
              submissions={[...submissionsList, ...docs]}
              onRefresh={async (id) => fetchDocuments(localStorage.getItem("token"))}
            />
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === "admin" && (
          <div className="animate-fade-in">
            <AdminPanel />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;