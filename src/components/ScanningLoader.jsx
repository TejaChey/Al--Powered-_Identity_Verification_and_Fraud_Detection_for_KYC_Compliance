import React from 'react';

const ScanningLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Card Container */}
      <div className="relative w-72 h-44 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden transform transition-all hover:scale-105">
        
        {/* Mock ID Card Content (Skeleton) */}
        <div className="p-5 space-y-4 opacity-40">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-slate-300 rounded-full animate-pulse"></div>
            <div className="space-y-2 flex-1 py-2">
              <div className="h-3 w-3/4 bg-slate-300 rounded animate-pulse"></div>
              <div className="h-3 w-1/2 bg-slate-300 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-3 mt-2">
             <div className="h-2 w-full bg-slate-300 rounded animate-pulse"></div>
             <div className="h-2 w-full bg-slate-300 rounded animate-pulse"></div>
             <div className="h-2 w-5/6 bg-slate-300 rounded animate-pulse"></div>
          </div>
        </div>

        {/* The Scanning Laser Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
        
        {/* Glass Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none"></div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
          AI Verification in Progress
        </h3>
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          ANALYZING OPTICAL DATA • CHECKING FRAUD DB
        </p>
      </div>
      
      {/* CSS Animation for Scan Line (Inline to ensure it works) */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ScanningLoader;