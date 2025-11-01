// src/Login.js
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
      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-lg p-8 w-96"
      >
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Login
        </h2>

        {error && <p className="text-red-500 text-center mb-3">{error}</p>}

        <div className="mb-4">
          <label className="block mb-2 text-gray-600">Email</label>
          <div className="flex items-center border rounded-md p-2">
            <FaUser className="text-gray-400 mr-2" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="outline-none flex-1"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-gray-600">Password</label>
          <div className="flex items-center border rounded-md p-2">
            <FaLock className="text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="outline-none flex-1"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Login
        </button>

        <p className="text-center mt-4 text-sm">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-700 font-semibold">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
