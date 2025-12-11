import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, User, Calendar, Users, FileText, ShieldCheck, UserPlus } from "lucide-react";
import { signup } from "./api";

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
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
      setError("Registration failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex relative overflow-hidden">
      {/* ===== MOBILE BACKGROUND ===== */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundSize: '40px 40px',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)'
        }}></div>
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-40 h-40 bg-pink-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-12 left-4 opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>
          <UserPlus size={50} className="text-pink-500 rotate-12" />
        </div>
        <div className="absolute bottom-16 right-4 opacity-10 animate-pulse">
          <FileText size={60} className="text-cyan-400 -rotate-6" />
        </div>
      </div>

      {/* ===== LEFT SIDE - Video Panel (Desktop Only) ===== */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/Signup.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-transparent to-transparent opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-slate-900/30"></div>
        <div className="absolute inset-0 bg-slate-900/20"></div>
        <div className="absolute top-6 left-6 w-24 h-24 border-t-2 border-l-2 border-purple-500/30 rounded-tl-2xl"></div>
        <div className="absolute bottom-6 right-6 w-24 h-24 border-b-2 border-r-2 border-purple-500/30 rounded-br-2xl"></div>
      </div>

      <div className="hidden lg:block absolute left-[55%] top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900 to-transparent z-20 rounded-l-2xl"></div>

      {/* ===== RIGHT SIDE - Form Panel ===== */}
      <div className="w-full lg:w-[45%] h-full relative flex items-center justify-center p-4 sm:p-5 lg:p-6 z-10">
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950"></div>
        <div className="hidden lg:block absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="hidden lg:block absolute bottom-0 left-0 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="hidden lg:block absolute inset-0 backdrop-blur-[1px] bg-slate-900/30"></div>

        {/* Form Container */}
        <div className="relative z-10 w-full max-w-sm">
          <div className="lg:bg-transparent bg-white/5 backdrop-blur-2xl lg:backdrop-blur-none rounded-2xl lg:rounded-none p-4 sm:p-5 lg:p-0 border border-white/10 lg:border-0">
            {/* Logo/Brand */}
            <div className="mb-4 lg:mb-5">
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">KYC<span className="text-purple-400">.AI</span></span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">
                Create Account
              </h1>
              <p className="text-slate-400 text-sm">
                Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 font-medium transition-colors">Sign in</Link>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Full Name Field */}
              <div>
                <label className="block mb-1 text-slate-300 text-xs font-medium">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-white/95 text-slate-900 rounded-lg px-3 py-2 pr-9 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-sm"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block mb-1 text-slate-300 text-xs font-medium">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="w-full bg-white/95 text-slate-900 rounded-lg px-3 py-2 pr-9 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-sm"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block mb-1 text-slate-300 text-xs font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-white/95 text-slate-900 rounded-lg px-3 py-2 pr-9 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-sm"
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

              {/* DOB and Gender Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-slate-300 text-xs font-medium">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white/95 text-slate-900 rounded-lg px-2.5 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-xs [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-300 text-xs font-medium">Gender</label>
                  <div className="relative">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white/95 text-slate-900 rounded-lg px-2.5 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium appearance-none cursor-pointer text-xs"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <Users className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block mb-1 text-slate-300 text-xs font-medium">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 ${role === "user"
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-cyan-300"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50"
                      }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 ${role === "admin"
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400 text-purple-300"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50"
                      }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <p className="mt-3 text-center text-slate-500 text-[10px]">
              By signing up, you agree to our Terms & Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;