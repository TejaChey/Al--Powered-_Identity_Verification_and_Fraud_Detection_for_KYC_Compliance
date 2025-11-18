import React from 'react';

const ScanningLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Card Container with Neon Glow */}
      <div className="relative w-80 h-48 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] overflow-hidden transform transition-all hover:scale-105">
        
        {/* Grid Overlay inside card */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(6,182,212,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.3)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

        {/* Mock ID Content */}
        <div className="p-6 space-y-4 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-slate-800 rounded-full border border-white/10 animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-2/3 bg-slate-800 rounded animate-pulse"></div>
              <div className="h-3 w-1/2 bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2 mt-2">
             <div className="h-2 w-full bg-slate-800 rounded animate-pulse"></div>
             <div className="h-2 w-4/5 bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* The Cyber Laser Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee] animate-[scan_1.5s_ease-in-out_infinite] z-20"></div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-widest uppercase">
              System Analyzing
            </h3>
        </div>
        <p className="text-xs text-cyan-200/50 font-mono tracking-[0.2em]">
          EXTRACTING DATA PATTERNS...
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ScanningLoader;