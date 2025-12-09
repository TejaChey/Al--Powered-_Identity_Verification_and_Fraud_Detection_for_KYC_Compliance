import React, { useState } from "react";
import { login } from "./api";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { Fingerprint, ScanFace, CreditCard } from "lucide-react"; // Added Icons

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Access Denied.");
    }
  };

  return (
    <div className="cyber-container flex items-center justify-center p-4 relative">
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="cyber-grid"></div>
      <div className="cyber-bg-glow"></div>

      {/* 1. Giant Fingerprint (Bottom Left) */}
      <div className="absolute -bottom-20 -left-20 animate-pulse-glow opacity-10">
        <Fingerprint size={400} className="text-cyan-500 rotate-12" strokeWidth={0.5} />
      </div>

      {/* 2. Floating ID Card (Top Right) */}
      <div className="absolute top-20 right-20 animate-float opacity-10">
        <CreditCard size={150} className="text-purple-500 -rotate-12" strokeWidth={1} />
      </div>

      {/* 3. Face Scan Icon (Top Left) */}
      <div className="absolute top-40 left-10 animate-float opacity-5" style={{ animationDelay: '2s' }}>
        <ScanFace size={100} className="text-blue-400" strokeWidth={1} />
      </div>

      {/* 4. Animated Background Text Layers */}

      {/* Layer 1: Top (Fast) */}
      <div className="absolute top-20 left-0 w-full overflow-hidden opacity-5 pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[80px] font-black uppercase text-cyan-500 mr-20">
            REAL-TIME OCR PROCESSING • AADHAAR & PAN VERIFICATION • INSTANT FRAUD ALERTS •
          </span>
          <span className="text-[80px] font-black uppercase text-cyan-500 mr-20">
            REAL-TIME OCR PROCESSING • AADHAAR & PAN VERIFICATION • INSTANT FRAUD ALERTS •
          </span>
        </div>
      </div>

      {/* Layer 2: Middle (Main, Reversed) */}
      <div className="absolute top-1/2 left-0 w-full overflow-hidden -translate-y-1/2 opacity-10 pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee-reverse">
          <span className="text-[120px] font-black uppercase text-cyan-500 mr-20">
            KYC VERIFICATION SYSTEM • FRAUD DETECTION ONLINE • SECURE NEURAL NETWORK • BIOMETRIC ANALYSIS •
          </span>
          <span className="text-[120px] font-black uppercase text-cyan-500 mr-20">
            KYC VERIFICATION SYSTEM • FRAUD DETECTION ONLINE • SECURE NEURAL NETWORK • BIOMETRIC ANALYSIS •
          </span>
        </div>
      </div>

      {/* Layer 3: Bottom (Slow, Detailed) */}
      <div className="absolute bottom-20 left-0 w-full overflow-hidden opacity-5 pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[60px] font-bold uppercase text-blue-500 mr-20">
            CROSS-MATCHING ALGORITHMS • BIOMETRIC LIVENESS CHECK • AES-256 ENCRYPTION • ISO-27001 COMPLIANT •
          </span>
          <span className="text-[60px] font-bold uppercase text-blue-500 mr-20">
            CROSS-MATCHING ALGORITHMS • BIOMETRIC LIVENESS CHECK • AES-256 ENCRYPTION • ISO-27001 COMPLIANT •
          </span>
        </div>
      </div>

      {/* Glass Card */}
      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md p-8 relative z-10 animate-float backdrop-blur-3xl border border-white/10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Login
          </h2>
          <p className="text-slate-400 text-sm mt-2">Authenticate to access KYC Neural Net</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-center text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block mb-2 text-cyan-100/80 text-xs font-bold uppercase tracking-wider">Email ID</label>
            <div className="relative">
              <FaUser className="absolute left-4 top-3.5 text-slate-500" />
              <input
                type="email"
                className="input-cyber pl-10"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-cyan-100/80 text-xs font-bold uppercase tracking-wider">Password Key</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-3.5 text-slate-500" />
              <input
                type="password"
                className="input-cyber pl-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-luminous w-full">
            Login Session
          </button>
        </div>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-slate-400 text-sm">New Personnel? <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Register ID</Link></p>
        </div>
      </form>
    </div>
  );
}

export default Login;