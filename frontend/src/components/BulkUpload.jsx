// src/components/BulkUpload.jsx
// Bulk Verification Mode - Allows admins to upload Excel sheets or multiple documents for batch processing
import React, { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";

/**
 * BulkUpload Component
 * Allows uploading Excel files or folders of documents for batch KYC verification
 */
export default function BulkUpload({ onBatchComplete }) {
    const [files, setFiles] = useState([]);
    const [excelFile, setExcelFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState([]);
    const [mode, setMode] = useState("images"); // "images" or "excel"

    // Handle image file selection
    const handleImageFiles = (e) => {
        const selected = Array.from(e.target.files || []);
        setFiles(selected);
        setResults([]);
    };

    // Handle Excel file selection
    const handleExcelFile = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setExcelFile(file);
            setResults([]);
        }
    };

    // Process image batch
    const processImageBatch = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setProgress({ current: 0, total: files.length });
        setResults([]);

        const token = localStorage.getItem("token");
        const batchResults = [];

        // Process in chunks of 5 for better performance
        const chunkSize = 5;
        for (let i = 0; i < files.length; i += chunkSize) {
            const chunk = files.slice(i, i + chunkSize);
            const form = new FormData();
            chunk.forEach((f) => form.append("files", f, f.name));

            try {
                const res = await fetch("/upload/files", {
                    method: "POST",
                    headers: { Authorization: token ? `Bearer ${token}` : "" },
                    body: form,
                });

                if (res.ok) {
                    const data = await res.json();
                    const fileResults = data.files || [];
                    fileResults.forEach((fr) => {
                        batchResults.push({
                            filename: fr.filename,
                            success: fr.success,
                            error: fr.error || null,
                            result: fr.result || null,
                            fraudScore: fr.result?.fraud?.score || 0,
                            decision: fr.result?.decision || "Unknown",
                        });
                    });
                } else {
                    chunk.forEach((f) => {
                        batchResults.push({
                            filename: f.name,
                            success: false,
                            error: "Upload failed",
                        });
                    });
                }
            } catch (err) {
                chunk.forEach((f) => {
                    batchResults.push({
                        filename: f.name,
                        success: false,
                        error: err.message,
                    });
                });
            }

            setProgress({ current: Math.min(i + chunkSize, files.length), total: files.length });
            setResults([...batchResults]);
        }

        setProcessing(false);
        onBatchComplete && onBatchComplete(batchResults);
    };

    // Process Excel file (parse and validate)
    const processExcelBatch = async () => {
        if (!excelFile) return;

        setProcessing(true);
        setProgress({ current: 0, total: 1 });

        const token = localStorage.getItem("token");
        const form = new FormData();
        form.append("file", excelFile);

        try {
            const res = await fetch("/compliance/bulk-verify", {
                method: "POST",
                headers: { Authorization: token ? `Bearer ${token}` : "" },
                body: form,
            });

            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
            } else {
                const errText = await res.text();
                setResults([{ filename: excelFile.name, success: false, error: errText }]);
            }
        } catch (err) {
            setResults([{ filename: excelFile.name, success: false, error: err.message }]);
        }

        setProgress({ current: 1, total: 1 });
        setProcessing(false);
    };

    // Download sample Excel template
    const downloadTemplate = () => {
        const csvContent = "Name,Aadhaar,PAN,DOB,Address\nJohn Doe,123456789012,ABCDE1234F,01/01/1990,123 Main St\nJane Smith,987654321098,FGHIJ5678K,15/06/1985,456 Oak Ave";
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "kyc_bulk_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Calculate stats
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const highRiskCount = results.filter((r) => r.fraudScore > 70).length;

    return (
        <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex gap-2">
                <button
                    onClick={() => setMode("images")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === "images"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                        }`}
                >
                    <Upload className="w-4 h-4 inline-block mr-2" />
                    Bulk Image Upload
                </button>
                <button
                    onClick={() => setMode("excel")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${mode === "excel"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                        }`}
                >
                    <FileSpreadsheet className="w-4 h-4 inline-block mr-2" />
                    Excel/CSV Upload
                </button>
            </div>

            {/* Image Upload Mode */}
            {mode === "images" && (
                <div className="space-y-4">
                    <div className="p-6 border-2 border-dashed border-slate-600 rounded-2xl text-center relative">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            onChange={handleImageFiles}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={processing}
                        />
                        <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-white font-bold">Select Multiple Documents</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Upload Aadhaar, PAN, DL images or PDFs in bulk. Max 50 files at once.
                        </p>
                    </div>

                    {files.length > 0 && (
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-white font-bold">{files.length} files selected</span>
                                <button
                                    onClick={() => setFiles([])}
                                    className="text-xs text-rose-400 hover:text-rose-300"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-slate-400">
                                {files.slice(0, 10).map((f, i) => (
                                    <div key={i} className="truncate">📄 {f.name}</div>
                                ))}
                                {files.length > 10 && <div className="text-slate-500">... and {files.length - 10} more</div>}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={processImageBatch}
                        disabled={files.length === 0 || processing}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing {progress.current}/{progress.total}...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Process {files.length} Documents
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Excel Upload Mode */}
            {mode === "excel" && (
                <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Download Template
                        </button>
                    </div>

                    <div className="p-6 border-2 border-dashed border-purple-500/30 rounded-2xl text-center relative bg-purple-500/5">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleExcelFile}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={processing}
                        />
                        <FileSpreadsheet className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                        <p className="text-white font-bold">Upload Excel/CSV File</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Upload a spreadsheet with Name, Aadhaar, PAN, DOB, Address columns
                        </p>
                    </div>

                    {excelFile && (
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileSpreadsheet className="w-8 h-8 text-purple-400" />
                                <div>
                                    <div className="text-sm text-white font-bold">{excelFile.name}</div>
                                    <div className="text-xs text-slate-400">{(excelFile.size / 1024).toFixed(1)} KB</div>
                                </div>
                            </div>
                            <button onClick={() => setExcelFile(null)} className="text-xs text-rose-400">Remove</button>
                        </div>
                    )}

                    <button
                        onClick={processExcelBatch}
                        disabled={!excelFile || processing}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing Excel...
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="w-5 h-5" />
                                Validate Excel Data
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Progress Bar */}
            {processing && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Processing...</span>
                        <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                            <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                            <div className="text-xl font-bold text-emerald-400">{successCount}</div>
                            <div className="text-xs text-slate-400">Success</div>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center">
                            <XCircle className="w-6 h-6 text-rose-400 mx-auto mb-1" />
                            <div className="text-xl font-bold text-rose-400">{failCount}</div>
                            <div className="text-xs text-slate-400">Failed</div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                            <div className="text-xl font-bold text-amber-400">{highRiskCount}</div>
                            <div className="text-xs text-slate-400">High Risk</div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
                        <div className="p-3 border-b border-white/10 bg-slate-800/50">
                            <h4 className="text-sm font-bold text-white">Batch Results</h4>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-800/30 sticky top-0">
                                    <tr className="text-slate-400 text-left">
                                        <th className="p-3">File</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Fraud Score</th>
                                        <th className="p-3">Decision</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((r, i) => (
                                        <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                                            <td className="p-3 text-white truncate max-w-[150px]">{r.filename}</td>
                                            <td className="p-3">
                                                {r.success ? (
                                                    <span className="text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Success
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-400 flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" /> Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className={`font-bold ${r.fraudScore > 70 ? "text-rose-400" : r.fraudScore > 30 ? "text-amber-400" : "text-emerald-400"
                                                    }`}>
                                                    {r.success ? `${r.fraudScore}%` : "-"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-300">{r.decision || r.error || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
