import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Add a new toast
    const showToast = useCallback((message, type = "info") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, []);

    // Remove toast by ID
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border animate-fade-in-right
              ${toast.type === "success" ? "bg-emerald-900/80 border-emerald-500/50 text-emerald-100" : ""}
              ${toast.type === "error" ? "bg-rose-900/80 border-rose-500/50 text-rose-100" : ""}
              ${toast.type === "info" ? "bg-slate-800/80 border-slate-600/50 text-slate-100" : ""}
            `}
                        style={{ animation: "slideIn 0.3s ease-out" }}
                    >
                        {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
                        {toast.type === "info" && <Info className="w-5 h-5 text-cyan-400" />}

                        <p className="text-sm font-medium">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 opacity-70" />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
        </ToastContext.Provider>
    );
};
