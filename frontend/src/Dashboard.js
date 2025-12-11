// src/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./contexts/ToastContext";
import OCRPreview from "./components/OCRPreview";
import VerificationCard from "./components/VerificationCard";
import DashboardCharts from "./components/DashboardCharts";
import ScanningLoader from "./components/ScanningLoader";
import SubmissionsTable from "./components/SubmissionsTable";
import AdminPanel from "./components/AdminPanel";
import DeviceFingerprint, { collectDeviceFingerprint } from "./components/DeviceFingerprint";
import ModelMonitoringDashboard from "./components/ModelMonitoringDashboard";
import BulkUpload from "./components/BulkUpload";
import { runClientOCR } from "./services/clientOCR";


import { Upload, Activity, Fingerprint, CreditCard, Search, BarChart3, FileSpreadsheet, Eye, AlertCircle, Shield, User, LogOut, ShieldOff } from "lucide-react";

/**
 * Dashboard (full file)
 * - Adds "auto-block upload on poor-quality files" behavior
 * - Shows modal listing poor-quality files and reasons
 * - Keeps all UI & style intact
 */

function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [multiFiles, setMultiFiles] = useState([]); // { file, url, status, result, quality }
  const [multiUploading, setMultiUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [docs, setDocs] = useState([]);

  const [message, setMessage] = useState("");
  const [imageQuality, setImageQuality] = useState(null);

  // NEW: Real-time OCR preview state
  const [ocrPreviewData, setOcrPreviewData] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrRunning, setOcrRunning] = useState(false);

  const [activeTab, setActiveTab] = useState("home");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("user");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailSubmission, setDetailSubmission] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState(null);

  // NEW: Confirmation modal state for poor quality
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [qualityModalFiles, setQualityModalFiles] = useState([]);
  const [forceUpload, setForceUpload] = useState(false); // if true, bypass quality block

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    // Fetch user profile from backend
    const fetchProfile = async () => {
      try {
        const res = await fetch("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const profile = await res.json();
          setUserName(profile.name || "User");
          setUserEmail(profile.email || "");
          setUserRole(profile.role || "user");
        } else {
          // Fallback to JWT parsing
          const payload = JSON.parse(atob(token.split(".")[1]));
          const email = payload.sub || "user@kyc.com";
          setUserEmail(email);
          const nm = email.split("@")[0] || "User";
          setUserName(nm.charAt(0).toUpperCase() + nm.slice(1));
        }
      } catch {
        // Fallback to JWT parsing
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const email = payload.sub || "user@kyc.com";
          setUserEmail(email);
          const nm = email.split("@")[0] || "User";
          setUserName(nm.charAt(0).toUpperCase() + nm.slice(1));
        } catch { }
      }
    };

    fetchProfile();
    fetchDocuments(token);

    return () => {
      multiFiles.forEach((it) => it.url && URL.revokeObjectURL(it.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async (token) => {
    try {
      setLoading(true);
      const res = await fetch("/compliance/docs", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const body = await res.json();
      const arr = Array.isArray(body) ? body : body.documents || [];
      const normalized = arr.map((d) => ({
        ...d,
        _id: d._id || d.id,
        submissionId: d._id,
        verified: d.decision === "Pass" || (d.fraud && d.fraud.score < 30),
        documentType:
          d.docType ||
          (d.parsed?.aadhaarNumber ? "Aadhaar" : d.parsed?.panNumber ? "PAN" : "Unknown"),
      }));
      setDocs(normalized);
    } catch (err) {
      console.error("Fetch docs failed", err);
    } finally {
      setLoading(false);
    }
  };

  // simple client-side image quality check (fast)
  const analyzeImageQuality = async (file) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth,
            h = img.naturalHeight;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);

          const id = ctx.getImageData(0, 0, w, h);
          const data = id.data;
          const gray = new Float32Array(w * h);

          for (let i = 0, j = 0; i < data.length; i += 4, j++)
            gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

          let sum = 0,
            sumsq = 0,
            cnt = 0;
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const i = y * w + x;
              const v =
                gray[i - w] +
                gray[i - 1] +
                gray[i + 1] +
                gray[i + w] -
                4 * gray[i];
              sum += v;
              sumsq += v * v;
              cnt++;
            }
          }

          let variance = null;
          if (cnt > 0) {
            const mean = sum / cnt;
            const calc = sumsq / cnt - mean * mean;
            if (isFinite(calc)) variance = calc;
          }

          // crop detection (simple)
          let minX = w,
            minY = h,
            maxX = 0,
            maxY = 0,
            seen = 0;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const g = gray[y * w + x];
              if (g < 250) {
                seen++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          let cropRatio = null;
          if (seen > 0) cropRatio = ((maxX - minX + 1) * (maxY - minY + 1)) / (w * h);

          const BLUR_THRESHOLD = 100;
          const CROP_THRESHOLD = 0.65;

          const reasons = [];
          let ok = true;
          if (variance !== null && variance < BLUR_THRESHOLD) {
            ok = false;
            reasons.push(`Blurry image (variance = ${variance.toFixed(1)})`);
          }
          if (cropRatio !== null && cropRatio < CROP_THRESHOLD) {
            ok = false;
            reasons.push(`Cropped / blank margins (ratio = ${cropRatio.toFixed(2)})`);
          }

          resolve({
            ok,
            blurVariance: variance,
            cropRatio,
            qualityLabel: ok ? "good" : "poor",
            reasons,
          });
        } catch (e) {
          resolve({ ok: true, reasons: [] });
        }
      };
      img.onerror = () => resolve({ ok: true, reasons: [] });
      img.src = URL.createObjectURL(file);
    });

  // user selected multiple files
  const handleMultiSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      status: "pending", // pending | uploading | success | error
      progress: 0,
      result: null,
      error: null,
      quality: null,
    }));

    // append uniquely
    const merged = [...multiFiles];
    newItems.forEach((it) => {
      const exists = merged.find((m) => m.file.name === it.file.name && m.file.size === it.file.size);
      if (!exists) merged.push(it);
      else URL.revokeObjectURL(it.url);
    });

    // attach quickly computed quality
    newItems.forEach((it) => {
      if (it.file.type.startsWith("image/")) {
        analyzeImageQuality(it.file).then((q) => {
          setMultiFiles((prev) => prev.map((p) => (p.file.name === it.file.name && p.file.size === it.file.size ? { ...p, quality: q } : p)));
        });
      } else {
        // Skip quality check for PDF
        setMultiFiles((prev) => prev.map((p) => (p.file.name === it.file.name && p.file.size === it.file.size ? { ...p, quality: { ok: true, reasons: [] } } : p)));
      }
    });

    setMultiFiles(merged);

    // ===========================================
    // Real-time OCR using EasyOCR backend API (more accurate for Indian docs)
    // ===========================================
    const firstFile = newItems[0]?.file;
    if (firstFile && firstFile.type.startsWith("image/")) {
      try {
        setOcrRunning(true);
        setOcrProgress(10);
        setOcrPreviewData(null);

        const startTime = Date.now();

        // Create FormData and send to backend EasyOCR endpoint
        const formData = new FormData();
        formData.append("file", firstFile);

        setOcrProgress(30);

        const response = await fetch("/ocr/preview", {
          method: "POST",
          body: formData,
        });

        setOcrProgress(80);

        if (!response.ok) {
          throw new Error("OCR preview failed");
        }

        const ocrResult = await response.json();
        const processingTime = Date.now() - startTime;

        setOcrProgress(100);

        // Set preview data for OCRPreview component
        setOcrPreviewData({
          name: ocrResult.name,
          aadhaar: ocrResult.maskedAadhaar,
          maskedAadhaar: ocrResult.maskedAadhaar,
          pan: ocrResult.maskedPan,
          maskedPan: ocrResult.maskedPan,
          maskedDl: ocrResult.maskedDl,
          dob: ocrResult.dob,
          gender: ocrResult.gender,
          rawText: ocrResult.rawText,
          documentType: ocrResult.documentType,
          processingTimeMs: processingTime,
          source: "easyocr-server",
        });

        setOcrRunning(false);
        setMessage(`✨ OCR Preview ready in ${processingTime}ms (EasyOCR)`);
      } catch (err) {
        console.error("Server OCR preview error:", err);
        setOcrRunning(false);
        setMessage("⚠️ OCR preview failed - will try again on upload");
      }
    }
  };

  const removeMultiItem = (index) => {
    const copy = [...multiFiles];
    const item = copy.splice(index, 1)[0];
    if (item?.url) URL.revokeObjectURL(item.url);
    setMultiFiles(copy);
  };

  // Build list of poor-quality files and reasons
  const getPoorFiles = () => {
    return multiFiles
      .filter((it) => it.quality && it.quality.ok === false)
      .map((it) => ({ name: it.file.name, reasons: it.quality.reasons || [] }));
  };

  // Upload selected files to backend /upload/files and show server OCR results
  const uploadAllMultiFiles = async (opts = { force: false }) => {
    if (!multiFiles.length) return;
    const token = localStorage.getItem("token");

    // If there are poor files and not forcing, show modal
    const poor = getPoorFiles();
    if (poor.length > 0 && !opts.force) {
      setQualityModalFiles(poor);
      setQualityModalOpen(true);
      return;
    }

    setForceUpload(false);
    setMultiUploading(true);

    // mark uploading UI
    setMultiFiles((prev) => prev.map((it) => ({ ...it, status: "uploading", progress: 0 })));

    try {
      const form = new FormData();
      multiFiles.forEach((it) => form.append("files", it.file, it.file.name));

      // Collect and attach device fingerprint for fraud analytics
      const deviceFp = collectDeviceFingerprint();
      form.append("device_fingerprint", JSON.stringify(deviceFp));

      const res = await fetch("/upload/files", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Batch upload failed");
      }

      const body = await res.json();
      const filesResult = body.files || [];

      // map results back to previews
      setMultiFiles((prev) =>
        prev.map((it) => {
          const found = filesResult.find((f) => f.filename === it.file.name);
          if (!found) return { ...it, status: "error", error: "No server result" };
          if (found.success) {
            const parsed = found.result || found;
            return { ...it, status: "success", result: parsed };
          } else {
            return { ...it, status: "error", error: found.error || "Server error" };
          }
        })
      );

      // pick first successful server result to show in preview area
      const firstSuccess = (body.files || []).find((f) => f.success && f.result);
      if (firstSuccess) {
        const parsed = firstSuccess.result;
        const verification = parsed.verification || {};
        const parsedData = verification.parsed || parsed.parsed || {};

        // Build full verification result with all data
        const fullResult = {
          submissionId: parsed.docId || parsed.submissionId || null,
          documentType: parsedData.documentType ||
            (parsedData.aadhaarNumber ? "Aadhaar" : parsedData.panNumber ? "PAN" : parsedData.dlNumber ? "DrivingLicence" : "Unknown"),
          verified: parsed.decision === "Pass" || false,
          tampered: parsed.fraud?.details?.manipulation_suspected || false,
          maskedAadhaar: verification.maskedAadhaar || parsed.maskedAadhaar || null,
          maskedPan: verification.maskedPan || parsed.maskedPan || null,
          maskedDl: verification.maskedDl || parsed.maskedDl || null,
          timestamp: new Date().toISOString(),
          fraud: {
            score: Math.round((parsed.fraud && parsed.fraud.score) || 0),
            reasons: parsed.fraud?.reasons || [],
            details: parsed.fraud?.details || {}
          },
          // Include full parsed data for VerificationCard
          parsed: parsedData,
          verification: verification,
          rawText: verification.rawText || parsed.rawText || "",
        };

        console.log("📊 Setting verificationResult:", fullResult);
        setVerificationResult(fullResult);
        setSubmissionsList((p) => [fullResult, ...p].filter(Boolean));
      }

      fetchDocuments(token);
    } catch (err) {
      console.error("Batch upload error", err);
      setMultiFiles((prev) => prev.map((it) => ({ ...it, status: "error", error: err.message })));
      showToast("Batch upload failed: " + (err.message || ""), "error");
    } finally {
      setMultiUploading(false);
    }
  };



  // Submission detail modal handlers (unchanged)
  const openSubmissionDetail = async (submission) => {
    setDetailSubmission(submission);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setDetailSubmission(null);
    setDecisionMessage(null);
    setDecisionLoading(false);
  };

  const approveSubmission = async (submission) => {
    if (!submission) return;
    const id = submission.submissionId || submission._id || submission.id;
    if (!id) return setDecisionMessage("Cannot determine submission id.");
    setDecisionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/compliance/documents/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ decision: "approve" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDecisionMessage("Approved successfully.");
      fetchDocuments(localStorage.getItem("token"));
    } catch (err) {
      setDecisionMessage("Approve failed: " + (err.message || ""));
    } finally {
      setDecisionLoading(false);
    }
  };

  const rejectSubmission = async (submission) => {
    if (!submission) return;
    const id = submission.submissionId || submission._id || submission.id;
    if (!id) return setDecisionMessage("Cannot determine submission id.");
    if (!window.confirm("Reject this submission?")) return;
    setDecisionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/compliance/documents/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ decision: "reject", reason: "Rejected by admin" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDecisionMessage("Rejected successfully.");
      fetchDocuments(localStorage.getItem("token"));
    } catch (err) {
      setDecisionMessage("Reject failed: " + (err.message || ""));
    } finally {
      setDecisionLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleQualityModalCancel = () => {
    setQualityModalOpen(false);
  };

  return (
    <div className="cyber-container relative">
      <div className="cyber-grid" />
      <div className="cyber-bg-glow" />
      <div className="absolute top-10 right-[-100px] opacity-[0.03] animate-pulse">
        <Fingerprint size={500} className="text-cyan-400" />
      </div>
      <div className="absolute bottom-20 left-[-50px] opacity-[0.03] animate-float">
        <CreditCard size={400} className="text-purple-400 rotate-12" />
      </div>

      {/* Background Marquee (Minimal) */}
      <div className="absolute top-32 left-0 w-full overflow-hidden opacity-[0.02] pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[100px] font-black uppercase text-cyan-500 mr-20">
            SYSTEM ONLINE • SECURE CONNECTION • LIVE MONITORING •
          </span>
          <span className="text-[100px] font-black uppercase text-cyan-500 mr-20">
            SYSTEM ONLINE • SECURE CONNECTION • LIVE MONITORING •
          </span>
        </div>
      </div>
      <div className="absolute top-40 left-1/3 opacity-[0.02] animate-ping">
        <Search size={200} className="text-emerald-400" />
      </div>

      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Upload className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                KYC<span className="text-cyan-400">.AI</span>
              </p>
              <p className="text-[10px] text-cyan-400 font-mono uppercase">Secure Vision</p>
            </div>
          </div>

          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab("home")} className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all ${activeTab === "home" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 scale-105" : "text-slate-400 hover:text-white hover:bg-white/10"}`}><Activity className="w-4 h-4 inline-block mr-1" />Home</button>
            <button onClick={() => setActiveTab("bulk")} className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all ${activeTab === "bulk" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 scale-105" : "text-slate-400 hover:text-white hover:bg-white/10"}`}><FileSpreadsheet className="w-4 h-4 inline-block mr-1" />Bulk</button>
            <button onClick={() => setActiveTab("submissions")} className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all ${activeTab === "submissions" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 scale-105" : "text-slate-400 hover:text-white hover:bg-white/10"}`}>Submissions</button>

            {/* Admin-only tabs */}
            {userRole === "admin" && (
              <>
                <button onClick={() => setActiveTab("monitoring")} className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all ${activeTab === "monitoring" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 scale-105" : "text-slate-400 hover:text-white hover:bg-white/10"}`}><BarChart3 className="w-4 h-4 inline-block mr-1" />Monitor</button>
                <button onClick={() => setActiveTab("admin")} className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1 ${activeTab === "admin" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 scale-105" : "text-slate-400 hover:text-white hover:bg-white/10"}`}><Shield className="w-4 h-4" /> Admin</button>
              </>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setShowUserDropdown((v) => !v)} className="flex items-center gap-2 border-l border-white/10 pl-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-white font-bold">{userName || "User"}</p>
                <p className={`text-[10px] font-mono font-bold flex items-center gap-1 ${userRole === "admin" ? "text-purple-400" : "text-cyan-400"}`}>
                  {userRole === "admin" ? <><Shield className="w-3 h-3" /> Admin</> : <><User className="w-3 h-3" /> User</>}
                </p>
              </div>
              {/* Avatar with initials */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${userRole === "admin"
                ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/50 text-purple-300"
                : "bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-cyan-400/50 text-cyan-300"
                } font-bold text-sm`}>
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
            </button>

            {showUserDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                <div className="absolute right-0 mt-3 z-50 w-64 bg-slate-900 rounded-xl shadow-xl border border-white/10 overflow-hidden">
                  <div className={`p-4 border-b border-white/10 ${userRole === "admin" ? "bg-purple-500/10" : "bg-cyan-500/10"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-full ${userRole === "admin"
                        ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/50 text-purple-300"
                        : "bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-cyan-300"
                        } font-bold text-lg`}>
                        {userName ? userName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="text-sm text-white font-bold">{userName || "User"}</p>
                        <p className="text-xs text-slate-400 font-mono">{userEmail}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${userRole === "admin"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}>
                          {userRole === "admin" ? <><Shield className="w-3 h-3 inline" /> Administrator</> : <><User className="w-3 h-3 inline" /> User</>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button onClick={logout} className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === "home" && (
          <div className="animate-tech-enter flex flex-col lg:flex-row gap-8">
            {/* LEFT: Upload Panel (multi enhanced) */}
            <div className="w-full lg:w-1/3 glass-panel p-8">
              <h2 className="text-2xl font-bold text-white flex gap-2 items-center mb-6 border-b border-white/10 pb-4">
                <Upload className="text-cyan-400" />
                Scan Input
              </h2>

              <div className="space-y-6">
                {/* MULTI FILE (enhanced) */}
                <div className="relative group p-4 border rounded-xl bg-slate-900/40">
                  <label className="text-xs text-slate-400 mb-2 block">Upload documents (Aadhaar, PAN, DL, Selfie)</label>
                  <div className="relative group p-4 border-2 border-dashed border-slate-600 hover:border-cyan-400 hover:bg-slate-800/60 transition-all duration-300 rounded-2xl text-center">
                    <input type="file" accept="image/*,.pdf" multiple onChange={handleMultiSelect} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                    <div>
                      <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-300 font-bold">Select multiple files or drop them here</p>
                      <p className="text-[11px] text-slate-400 mt-2">You can upload Aadhaar, PAN, Driving License images or PDFs</p>
                    </div>
                  </div>

                  {/* Selected thumbnails */}
                  <div className="mt-3 space-y-2">
                    {multiFiles.length === 0 && <p className="text-xs text-slate-500">No files selected</p>}
                    {multiFiles.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-md">
                        {it.file.type.startsWith("image/") ? (
                          <img src={it.url} alt={it.file.name} className="w-14 h-10 object-cover rounded-md" />
                        ) : (
                          <div className="w-14 h-10 bg-slate-700/50 rounded-md flex items-center justify-center text-xs font-bold text-slate-300">
                            PDF
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-white font-medium">{it.file.name}</div>
                            <div className="text-xs text-slate-400">{(it.file.size / 1024).toFixed(0)} KB</div>
                          </div>
                          <div className="mt-1 text-xs text-slate-300">
                            {it.status === "pending" && (it.quality ? (it.quality.ok ? "Ready" : `Poor quality: ${it.quality.reasons.join(", ")}`) : "Pending")}
                            {it.status === "uploading" && "Uploading..."}
                            {it.status === "success" && "Processed"}
                            {it.status === "error" && `Error: ${it.error}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => removeMultiItem(idx)} className="px-2 py-1 rounded-md bg-white/5 text-xs">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => uploadAllMultiFiles({ force: forceUpload })}
                      disabled={multiUploading || multiFiles.length === 0 || (getPoorFiles().length > 0 && !forceUpload)}
                      className="btn-luminous flex-1"
                    >
                      {multiUploading ? "UPLOADING..." : "UPLOAD & PARSE"}
                    </button>
                    <button onClick={() => { multiFiles.forEach((m) => URL.revokeObjectURL(m.url)); setMultiFiles([]); setForceUpload(false); }} className="px-3 py-2 rounded-md bg-white/5">Clear All</button>
                  </div>
                </div>

                {message && <p className="text-xs text-rose-300 font-mono">{message}</p>}
              </div>
            </div>

            {/* RIGHT: preview, OCR, charts */}
            <div className="w-full lg:w-2/3 space-y-6">
              {loading && (
                <div className="glass-panel p-12 flex justify-center">
                  <ScanningLoader />
                </div>
              )}

              {!loading && !verificationResult && !ocrPreviewData && !ocrRunning && (
                <div className="h-[400px] border border-white/10 bg-slate-900/30 rounded-3xl flex items-center justify-center text-slate-500 animate-pulse">
                  <Activity className="w-16 h-16 opacity-20" />
                </div>
              )}

              {/* Real-time OCR Preview (shows immediately when files are selected) */}
              {(ocrRunning || ocrPreviewData) && !verificationResult && (
                <div className="space-y-6">
                  <div className="glass-panel p-6 border-2 border-purple-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-400/30">
                        <Eye className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Real-Time OCR Preview</h3>
                        <p className="text-xs text-purple-300">Powered by EasyOCR (Hindi + English)</p>
                      </div>
                      {ocrPreviewData?.processingTimeMs && (
                        <div className="ml-auto bg-purple-500/20 px-3 py-1 rounded-full text-xs text-purple-300">
                          ⚡ {ocrPreviewData.processingTimeMs}ms
                        </div>
                      )}
                    </div>

                    {ocrRunning && (
                      <div className="mb-4">
                        <div className="text-xs text-slate-400 mb-1">Scanning document... {ocrProgress}%</div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{ width: `${Math.min(ocrProgress, 100)}%` }} />
                        </div>
                      </div>
                    )}

                    {ocrPreviewData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</div>
                          <div className="text-white font-medium">{ocrPreviewData.name || "Not detected"}</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Document Type</div>
                          <div className="text-cyan-300 font-mono">{ocrPreviewData.documentType || "Unknown"}</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Aadhaar Number</div>
                          <div className="text-cyan-300 font-mono tracking-widest">{ocrPreviewData.maskedAadhaar || "N/A"}</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PAN Number</div>
                          <div className="text-cyan-300 font-mono tracking-widest">{ocrPreviewData.maskedPan || "N/A"}</div>
                        </div>
                        {ocrPreviewData.dob && (
                          <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</div>
                            <div className="text-white font-mono">{ocrPreviewData.dob}</div>
                          </div>
                        )}
                        {ocrPreviewData.gender && (
                          <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</div>
                            <div className="text-white font-mono">{ocrPreviewData.gender}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {ocrPreviewData?.rawText && (
                      <div className="mt-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Raw OCR Text</div>
                        <div className="bg-[#020617] text-green-400 p-4 rounded-xl border border-white/10 font-mono text-xs overflow-x-auto shadow-inner max-h-32 overflow-y-auto">
                          <p className="opacity-80 whitespace-pre-wrap">{ocrPreviewData.rawText.slice(0, 1000)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 text-center">
                    ℹ️ This is a client-side preview. Click "UPLOAD & PARSE" for full server-side verification with fraud detection.
                  </p>
                </div>
              )}

              {verificationResult && (
                <div className="space-y-6">
                  <VerificationCard result={verificationResult} />
                  <div className="grid md:grid-cols-2 gap-6">
                    <OCRPreview
                      ocr={{
                        name: verificationResult.parsed?.name || null,
                        aadhaar: verificationResult.maskedAadhaar || null,
                        maskedAadhaar: verificationResult.maskedAadhaar || null,
                        pan: verificationResult.maskedPan || null,
                        maskedPan: verificationResult.maskedPan || null,
                        dlNumber: verificationResult.maskedDl || verificationResult.parsed?.dlNumber || null,
                        maskedDl: verificationResult.maskedDl || verificationResult.parsed?.dlNumber || null,
                        rawText: verificationResult.rawText || "",
                      }}
                      progress={0}
                      running={false}
                      quality={imageQuality}
                    />
                    <div className="glass-panel p-6">
                      <h4 className="text-xs text-white uppercase font-mono mb-4">Visual Metrics</h4>
                      <DashboardCharts submissions={[...submissionsList, ...docs]} />
                    </div>
                  </div>
                  {/* Device Fingerprint Display */}
                  <DeviceFingerprint compact={false} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "submissions" && (
          <div className="animate-tech-enter space-y-6">
            <h2 className="text-xl font-bold text-white">Your Submissions</h2>
            <div className="glass-panel p-6">
              <SubmissionsTable submissions={[...submissionsList, ...docs]} onOpen={openSubmissionDetail} loading={loading} />
            </div>
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="animate-tech-enter space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="text-purple-400" /> Bulk Verification Mode
            </h2>
            <div className="glass-panel p-6">
              <BulkUpload onBatchComplete={(results) => {
                fetchDocuments(localStorage.getItem("token"));
              }} />
            </div>
          </div>
        )}

        {activeTab === "monitoring" && (
          <div className="animate-tech-enter space-y-6">
            {userRole === "admin" ? (
              <div className="glass-panel p-6">
                <ModelMonitoringDashboard submissions={[...submissionsList, ...docs]} />
              </div>
            ) : (
              <div className="glass-panel p-8 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-rose-400 mb-2">Access Denied</h3>
                <p className="text-slate-400">Model Monitoring is only available to administrators.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "admin" && (
          <div className="animate-tech-enter space-y-6">
            {userRole === "admin" ? (
              <div className="glass-panel p-6"><AdminPanel /></div>
            ) : (
              <div className="glass-panel p-8 text-center">
                <ShieldOff className="w-16 h-16 mx-auto mb-4 text-rose-400" />
                <h3 className="text-xl font-bold text-rose-400 mb-2">Access Denied</h3>
                <p className="text-slate-400">The Admin Panel is restricted to administrators only.</p>
                <p className="text-xs text-slate-500 mt-2">Your current role: <span className="text-cyan-400">{userRole || "user"}</span></p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* QUALITY CONFIRMATION MODAL */}
      {
        qualityModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleQualityModalCancel} />
            <div className="relative z-70 w-[min(720px,95%)] max-h-[80vh] overflow-auto p-6 rounded-2xl glass-panel border border-white/10">
              <h3 className="text-xl font-bold text-rose-400 mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Upload Blocker</h3>
              <p className="text-sm text-slate-300 mb-4">
                The content of the following files is <b>too blurry or low quality</b>.
                Our AI system prevents uploading unreadable documents to save you a rejection.
              </p>
              <p className="text-sm text-amber-400 font-bold mb-4">Please remove these files and upload clearer versions.</p>

              <div className="space-y-2 max-h-60 overflow-auto mb-4">
                {qualityModalFiles.map((f, i) => (
                  <div key={i} className="p-3 bg-rose-500/10 rounded-md border border-rose-500/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-rose-200 font-medium">{f.name}</div>
                        <div className="text-xs text-rose-300/70 mt-1">
                          {f.reasons.length > 0 ? f.reasons.join(" • ") : "Unspecified quality issue"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleQualityModalCancel}
                  className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                >
                  Okay, I will fix it
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* DETAIL MODAL */}
      {
        detailModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeDetailModal} />
            <div className="relative z-70 w-[min(920px,95%)] max-h-[90vh] overflow-auto p-6 rounded-2xl glass-panel border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Submission Details</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => approveSubmission(detailSubmission)} disabled={decisionLoading} className="px-3 py-1 rounded-md bg-emerald-500 text-white hover:opacity-90">
                    {decisionLoading ? "Working..." : "Approve"}
                  </button>
                  <button onClick={() => rejectSubmission(detailSubmission)} disabled={decisionLoading} className="px-3 py-1 rounded-md bg-rose-500 text-white hover:opacity-90">
                    {decisionLoading ? "Working..." : "Reject"}
                  </button>
                  <button onClick={closeDetailModal} className="text-sm text-slate-300 px-3 py-1 rounded-md hover:bg-white/5">Close</button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#020617] rounded-xl p-4 flex flex-col items-center justify-start">
                  {detailSubmission?.fileUrl || detailSubmission?.file_url || detailSubmission?.imageUrl || detailSubmission?.image_url || detailSubmission?.attachmentUrl ? (
                    <img src={detailSubmission.fileUrl || detailSubmission.file_url || detailSubmission.imageUrl || detailSubmission.image_url || detailSubmission.attachmentUrl} alt="document" className="max-w-full max-h-[60vh] object-contain rounded-md shadow-lg" />
                  ) : (
                    <div className="text-sm text-slate-300 p-6">Image not available for this submission — showing OCR instead.</div>
                  )}

                  <div className="mt-4 w-full text-xs text-slate-300">
                    <div><strong>Submission ID:</strong> <span className="font-mono">{detailSubmission?.submissionId || detailSubmission?._id || "—"}</span></div>
                    <div><strong>Type:</strong> {detailSubmission?.documentType || "—"}</div>
                    <div><strong>Verified:</strong> {detailSubmission?.verified ? "Yes" : "No"}</div>
                    <div><strong>Fraud score:</strong> {detailSubmission?.fraud?.score ?? "—"}</div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3">
                    <h4 className="text-sm text-slate-300 font-mono uppercase">Raw OCR Output</h4>
                    <div className="mt-2 bg-[#020617] p-3 rounded-xl border border-white/5 text-xs font-mono text-green-400 overflow-auto max-h-[56vh]">
                      <pre className="whitespace-pre-wrap break-words">{detailSubmission?.verification?.rawText || detailSubmission?.rawText || "// No OCR text available"}</pre>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm text-slate-300 font-mono uppercase mb-2">Extracted Fields</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2 bg-slate-900/50 rounded-md border border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase">Full Name</div>
                        <div className="text-white font-medium">{detailSubmission?.verification?.parsed?.name || detailSubmission?.name || "N/A"}</div>
                      </div>

                      <div className="p-2 bg-slate-900/50 rounded-md border border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase">Aadhaar</div>
                        <div className="font-mono text-cyan-300">{detailSubmission?.verification?.parsed?.aadhaarNumber || detailSubmission?.maskedAadhaar || "N/A"}</div>
                      </div>

                      <div className="p-2 bg-slate-900/50 rounded-md border border-white/5">
                        <div className="text-[10px] text-slate-400 uppercase">PAN</div>
                        <div className="font-mono text-cyan-300">{detailSubmission?.verification?.parsed?.panNumber || detailSubmission?.maskedPan || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  {decisionMessage && (
                    <div className="mt-4 p-3 rounded-md bg-white/5 text-sm text-slate-100">
                      {decisionMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default Dashboard;
