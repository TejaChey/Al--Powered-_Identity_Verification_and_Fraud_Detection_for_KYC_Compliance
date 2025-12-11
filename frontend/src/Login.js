import React, { useState } from "react";
import { login } from "./api";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Fingerprint, CreditCard, ScanFace } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Access Denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex relative overflow-hidden">
      {/* ===== MOBILE BACKGROUND ===== */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundSize: '40px 40px',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)'
        }}></div>
        <div className="absolute top-0 left-1/4 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 opacity-10 animate-pulse">
          <Fingerprint size={150} className="text-cyan-500 rotate-12" strokeWidth={0.5} />
        </div>
        <div className="absolute top-16 right-8 opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>
          <CreditCard size={50} className="text-purple-500 -rotate-12" strokeWidth={1} />
        </div>
      </div>

      {/* ===== LEFT SIDE - Form Panel ===== */}
      <div className="w-full lg:w-[45%] h-full relative flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10">
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950"></div>
        <div className="hidden lg:block absolute top-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="hidden lg:block absolute bottom-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="hidden lg:block absolute inset-0 backdrop-blur-[1px] bg-slate-900/30"></div>

        {/* Form Container */}
        <div className="relative z-10 w-full max-w-sm">
          <div className="lg:bg-transparent bg-white/5 backdrop-blur-2xl lg:backdrop-blur-none rounded-2xl lg:rounded-none p-5 sm:p-6 lg:p-0 border border-white/10 lg:border-0">
            {/* Logo/Brand */}
            <div className="mb-5 lg:mb-6">
              <div className="flex items-center gap-2 mb-4 lg:mb-5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">KYC<span className="text-cyan-400">.AI</span></span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 tracking-tight">
                Sign in
              </h1>
              <p className="text-slate-400 text-sm">
                Don't have an account? <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-medium transition-colors">Create now</Link>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email Field */}
              <div>
                <label className="block mb-1.5 text-slate-300 text-xs font-medium">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="w-full bg-white text-slate-900 rounded-lg px-3 py-2.5 pr-10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium text-sm"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block mb-1.5 text-slate-300 text-xs font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white text-slate-900 rounded-lg px-3 py-2.5 pr-10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <p className="mt-4 text-center text-slate-500 text-[10px]">
              Secured with AES-256 encryption & ISO-27001 compliance
            </p>
          </div>
        </div>
      </div>

      {/* ===== RIGHT SIDE - Video Panel (Desktop Only) ===== */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/Signin_Precise_Proteus.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-slate-900/30"></div>
        <div className="absolute inset-0 bg-slate-900/20"></div>
        <div className="absolute top-6 right-6 w-24 h-24 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl"></div>
        <div className="absolute bottom-6 left-6 w-24 h-24 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-2xl"></div>
      </div>

      <div className="hidden lg:block absolute left-[45%] top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900 to-transparent z-20 rounded-r-2xl"></div>
    </div>
  );
}

export default Login;