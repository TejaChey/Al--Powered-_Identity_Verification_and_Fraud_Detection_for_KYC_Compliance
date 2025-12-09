import React, { useState } from "react";
import { FaUser, FaLock, FaEnvelope, FaCalendar, FaVenusMars, FaUserShield } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ShieldCheck, UserPlus } from "lucide-react"; // Added Icons
import { signup } from "./api";

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signup(username, email, password, dob, gender, role);
      if (res?.access_token) {
        localStorage.setItem("token", res.access_token);
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Registration failed. ID conflict or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-container flex items-center justify-center p-4 relative">
      <div className="cyber-grid"></div>
      <div className="cyber-bg-glow"></div>

      {/* --- BACKGROUND ICONS --- */}
      {/* 1. Giant Shield (Center Faded) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
        <ShieldCheck size={600} className="text-white" />
      </div>

      {/* 2. Floating User Icon */}
      <div className="absolute top-20 left-20 animate-float opacity-10">
        <UserPlus size={120} className="text-pink-500 rotate-12" />
      </div>

      {/* 3. Document Icon */}
      <div className="absolute bottom-20 right-10 animate-float opacity-10" style={{ animationDelay: '1.5s' }}>
        <FileText size={140} className="text-cyan-400 -rotate-6" />
      </div>

      {/* 4. Animated Background Text Layers (Purple Theme) */}

      {/* Layer 1: Top (Fast) */}
      <div className="absolute top-20 left-0 w-full overflow-hidden opacity-5 pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[80px] font-black uppercase text-purple-500 mr-20">
            REAL-TIME OCR PROCESSING • AADHAAR & PAN VERIFICATION • INSTANT FRAUD ALERTS •
          </span>
          <span className="text-[80px] font-black uppercase text-purple-500 mr-20">
            REAL-TIME OCR PROCESSING • AADHAAR & PAN VERIFICATION • INSTANT FRAUD ALERTS •
          </span>
        </div>
      </div>

      {/* Layer 2: Middle (Main, Reversed) */}
      <div className="absolute top-1/2 left-0 w-full overflow-hidden -translate-y-1/2 opacity-10 pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee-reverse">
          <span className="text-[120px] font-black uppercase text-pink-500 mr-20">
            KYC VERIFICATION SYSTEM • FRAUD DETECTION ONLINE • SECURE NEURAL NETWORK • BIOMETRIC ANALYSIS •
          </span>
          <span className="text-[120px] font-black uppercase text-pink-500 mr-20">
            KYC VERIFICATION SYSTEM • FRAUD DETECTION ONLINE • SECURE NEURAL NETWORK • BIOMETRIC ANALYSIS •
          </span>
        </div>
      </div>

      {/* Layer 3: Bottom (Slow, Detailed) */}
      <div className="absolute bottom-20 left-0 w-full overflow-hidden opacity-5 pointer-events-none select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[60px] font-bold uppercase text-purple-400 mr-20">
            CROSS-MATCHING ALGORITHMS • BIOMETRIC LIVENESS CHECK • AES-256 ENCRYPTION • ISO-27001 COMPLIANT •
          </span>
          <span className="text-[60px] font-bold uppercase text-purple-400 mr-20">
            CROSS-MATCHING ALGORITHMS • BIOMETRIC LIVENESS CHECK • AES-256 ENCRYPTION • ISO-27001 COMPLIANT •
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md p-8 relative z-10 animate-float">
        <div className="text-center mb-6">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Create Account
          </h2>
          <p className="text-slate-400 text-sm mt-2">Join the Verification Network</p>
        </div>

        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-center text-sm">⚠️ {error}</div>}

        <div className="space-y-4">
          {/* Full Name */}
          <div className="relative">
            <FaUser className="absolute left-4 top-3.5 text-slate-500" />
            <input type="text" className="input-cyber pl-10" placeholder="Full Name" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          {/* Email */}
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-3.5 text-slate-500" />
            <input type="email" className="input-cyber pl-10" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute left-4 top-3.5 text-slate-500" />
            <input type="password" className="input-cyber pl-10" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {/* DOB and Gender Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date of Birth */}
            <div className="relative">
              <FaCalendar className="absolute left-4 top-3.5 text-slate-500 z-10" />
              <input
                type="date"
                className="input-cyber pl-10 text-slate-300"
                placeholder="Date of Birth"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Gender */}
            <div className="relative">
              <FaVenusMars className="absolute left-4 top-3.5 text-slate-500 z-10" />
              <select
                className="input-cyber pl-10 text-slate-300 appearance-none cursor-pointer"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="" className="bg-slate-900">Gender</option>
                <option value="Male" className="bg-slate-900">Male</option>
                <option value="Female" className="bg-slate-900">Female</option>
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
              <div className="absolute right-3 top-3.5 text-slate-500 pointer-events-none">▼</div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === "user"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 text-cyan-300"
                : "bg-slate-800/50 border border-white/10 text-slate-400 hover:bg-slate-700/50"
                }`}
            >
              <FaUser className="w-4 h-4" />
              User
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === "admin"
                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 text-purple-300"
                : "bg-slate-800/50 border border-white/10 text-slate-400 hover:bg-slate-700/50"
                }`}
            >
              <FaUserShield className="w-4 h-4" />
              Admin
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-luminous w-full from-purple-500 to-pink-600 shadow-purple-500/30 hover:shadow-purple-500/50">
            {loading ? "Registering..." : "Register Account"}
          </button>
        </div>

        <div className="mt-6 text-center border-t border-white/5 pt-6">
          <p className="text-slate-400 text-sm">Have an ID? <Link to="/" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Login</Link></p>
        </div>
      </form>
    </div>
  );
}

export default SignUp;