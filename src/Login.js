import React, { useState } from "react";
import { login } from "./api"; 
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";

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
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f8fafc] relative overflow-hidden">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-100 z-0"></div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-10 w-full max-w-md relative z-10 border border-white/50"
      >
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-500">Sign in to verify your identity</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl animate-pulse">
            <p className="text-rose-600 text-center font-medium text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="group">
            <label className="block mb-2 text-slate-600 font-semibold text-sm">Email Address</label>
            <div className="flex items-center border border-slate-300 rounded-xl p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all bg-white/50">
              <FaUser className="text-slate-400 mr-3" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="outline-none flex-1 text-slate-800 bg-transparent placeholder-slate-400 text-sm"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="block mb-2 text-slate-600 font-semibold text-sm">Password</label>
            <div className="flex items-center border border-slate-300 rounded-xl p-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all bg-white/50">
              <FaLock className="text-slate-400 mr-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="outline-none flex-1 text-slate-800 bg-transparent placeholder-slate-400 text-sm"
                required
              />
            </div>
          </div>

          {/* --- FIXED BUTTON --- */}
          {/* We explicitly use 'bg-gradient-to-r' here to ensure it appears */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Sign In
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-slate-500">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors"
          >
            Create Account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;