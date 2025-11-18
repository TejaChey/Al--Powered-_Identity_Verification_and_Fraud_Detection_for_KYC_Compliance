import React, { useState } from "react";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ShieldCheck, UserPlus } from "lucide-react"; // Added Icons
import { signup } from "./api"; 

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signup(username, email, password);
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
      <div className="absolute bottom-20 right-10 animate-float opacity-10" style={{animationDelay: '1.5s'}}>
         <FileText size={140} className="text-cyan-400 -rotate-6" />
      </div>

      <form onSubmit={handleSubmit} className="glass-panel w-full max-w-md p-8 relative z-10 animate-float">
        <div className="text-center mb-8">
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

        {error && <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-center text-sm">⚠️ {error}</div>}

        <div className="space-y-5">
          <div className="relative">
             <FaUser className="absolute left-4 top-3.5 text-slate-500" />
             <input type="text" className="input-cyber pl-10" placeholder="Full Name" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="relative">
             <FaEnvelope className="absolute left-4 top-3.5 text-slate-500" />
             <input type="email" className="input-cyber pl-10" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="relative">
             <FaLock className="absolute left-4 top-3.5 text-slate-500" />
             <input type="password" className="input-cyber pl-10" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading} className="btn-luminous w-full from-purple-500 to-pink-600 shadow-purple-500/30 hover:shadow-purple-500/50">
            {loading ? "Registering..." : "Register "}
          </button>
        </div>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
           <p className="text-slate-400 text-sm">Have an ID? <Link to="/" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Login</Link></p>
        </div>
      </form>
    </div>
  );
}

export default SignUp;