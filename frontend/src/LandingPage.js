import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Shield,
    Fingerprint,
    ScanFace,
    FileCheck,
    Zap,
    Lock,
    Eye,
    ArrowRight,
    ChevronRight,
    Brain,
    Network,
    CheckCircle,
    Sparkles
} from "lucide-react";

function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Auto-rotate features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        { icon: <Fingerprint className="w-6 h-6" />, title: "Biometric Verification", desc: "Advanced fingerprint and face recognition" },
        { icon: <Brain className="w-6 h-6" />, title: "AI-Powered Analysis", desc: "CNN & GNN neural networks for fraud detection" },
        { icon: <FileCheck className="w-6 h-6" />, title: "Document OCR", desc: "Real-time Aadhaar, PAN & DL extraction" },
        { icon: <Lock className="w-6 h-6" />, title: "Real-time Fraud Alerts", desc: "Instant notifications for high-risk submissions" },
    ];

    const stats = [
        { value: "99.9%", label: "Accuracy Rate" },
        { value: "<2s", label: "Processing Time" },
        { value: "10M+", label: "Documents Verified" },
        { value: "24/7", label: "Real-time Monitoring" },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            {/* ===== NAVBAR ===== */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3 bg-slate-950/80 backdrop-blur-xl border-b border-white/5' : 'py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 group-hover:border-cyan-400/50 transition-all">
                            <Shield className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            KYC<span className="text-cyan-400">.AI</span>
                        </span>
                    </Link>

                    {/* Center Nav */}
                    <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-lg rounded-full px-2 py-1.5 border border-white/10">
                        <a href="#features" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-full hover:bg-white/5 transition-all">Features</a>
                        <a href="#technology" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-full hover:bg-white/5 transition-all">Technology</a>
                        <a href="#security" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-full hover:bg-white/5 transition-all">Security</a>
                        <a href="#about" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-full hover:bg-white/5 transition-all">About</a>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                            Log In
                        </Link>
                        <Link to="/signup" className="px-5 py-2.5 text-sm font-bold bg-white text-slate-900 rounded-full hover:bg-slate-200 transition-all shadow-lg shadow-white/10 hover:shadow-white/20">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-screen flex items-center justify-center pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Gradient Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundSize: '60px 60px',
                        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)'
                    }}></div>

                    {/* Animated Lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                        <line x1="10%" y1="30%" x2="40%" y2="50%" stroke="url(#lineGrad)" strokeWidth="1" className="animate-pulse" />
                        <line x1="90%" y1="35%" x2="60%" y2="50%" stroke="url(#lineGrad)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <line x1="20%" y1="70%" x2="45%" y2="55%" stroke="url(#lineGrad)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
                        <line x1="80%" y1="65%" x2="55%" y2="55%" stroke="url(#lineGrad)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                    </svg>

                    {/* Floating Nodes */}
                    <div className="absolute top-[30%] left-[15%] animate-float">
                        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                            <Fingerprint className="w-6 h-6 text-cyan-400" />
                        </div>
                    </div>
                    <div className="absolute top-[25%] right-[20%] animate-float" style={{ animationDelay: '1s' }}>
                        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
                            <ScanFace className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <div className="absolute bottom-[30%] left-[20%] animate-float" style={{ animationDelay: '2s' }}>
                        <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-cyan-500/30 flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-cyan-400" />
                        </div>
                    </div>
                    <div className="absolute bottom-[35%] right-[15%] animate-float" style={{ animationDelay: '0.5s' }}>
                        <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-purple-500/30 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                    {/* Central Chip Animation */}
                    <div className="mb-12 flex justify-center">
                        <div className="relative">
                            {/* Outer glow ring */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 blur-xl opacity-30 animate-pulse"></div>
                            {/* Main chip */}
                            <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/50 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 flex items-center justify-center animate-pulse">
                                    <Shield className="w-8 h-8 text-cyan-400" />
                                </div>
                                {/* Corner connectors */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-3 border-l border-r border-t border-cyan-500/50 rounded-t-lg"></div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 border-l border-r border-b border-cyan-500/50 rounded-b-lg"></div>
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-6 border-t border-b border-l border-cyan-500/50 rounded-l-lg"></div>
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-6 border-t border-b border-r border-cyan-500/50 rounded-r-lg"></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
                        <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Smart KYC{" "}
                        </span>
                        <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                            Fraud Detection
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        AI-powered document verification for <span className="text-cyan-400 font-semibold">Aadhaar, PAN & Driving License</span>.
                        Detect fraud instantly with CNN & GNN neural networks.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            to="/signup"
                            className="group flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-105 transition-all duration-300"
                        >
                            <ChevronRight className="w-5 h-5 text-cyan-600" />
                            Start Verifying Now
                        </Link>
                        <a
                            href="#features"
                            className="group flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-full font-medium text-lg hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            Explore Features
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-slate-500 tracking-wider uppercase">Supported Document Types</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/50 border border-white/5 rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer group">
                                <FileCheck className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                <span className="text-sm font-medium text-slate-300">Aadhaar Card</span>
                            </div>
                            <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/50 border border-white/5 rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer group">
                                <FileCheck className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                <span className="text-sm font-medium text-slate-300">PAN Card</span>
                            </div>
                            <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/50 border border-white/5 rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer group">
                                <FileCheck className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                                <span className="text-sm font-medium text-slate-300">Driving License</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
                        <div className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* ===== FEATURES SECTION ===== */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Section Header */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Powered by Deep Learning
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                            <span className="text-white">Next-Gen </span>
                            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">KYC Verification</span>
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Combining Convolutional Neural Networks for document analysis with Graph Neural Networks for fraud pattern detection.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className={`group relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${activeFeature === idx
                                    ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30 scale-105'
                                    : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                                    }`}
                                onMouseEnter={() => setActiveFeature(idx)}
                            >
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all ${activeFeature === idx
                                    ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400'
                                    : 'bg-white/5 text-slate-400 group-hover:text-cyan-400'
                                    }`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-slate-400">{feature.desc}</p>
                                {activeFeature === idx && (
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-xl -z-10"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== STATS SECTION ===== */}
            <section className="py-20 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-400 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TECHNOLOGY SECTION ===== */}
            <section id="technology" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left - Content */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-6">
                                <Brain className="w-4 h-4" />
                                Neural Network Architecture
                            </div>
                            <h2 className="text-4xl font-bold mb-6 leading-tight">
                                <span className="text-white">Dual-Layer </span>
                                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI Processing</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-8">
                                Our system employs a sophisticated dual-neural-network approach for comprehensive document verification and fraud detection.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                                        <Eye className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">CNN - Document Analysis</h4>
                                        <p className="text-sm text-slate-400">Detects image manipulation, forgery, and quality issues in uploaded documents.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Network className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">GNN - Fraud Detection</h4>
                                        <p className="text-sm text-slate-400">Analyzes relationships and patterns across submissions to identify fraud rings.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                    <div className="p-2 bg-pink-500/20 rounded-lg">
                                        <Zap className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Real-time OCR</h4>
                                        <p className="text-sm text-slate-400">Instant extraction of Aadhaar, PAN, and DL data with 99.9% accuracy.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right - Visual */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-3xl blur-3xl opacity-30"></div>
                            <div className="relative bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="ml-4 text-xs text-slate-500 font-mono">neural_verification.py</span>
                                </div>
                                <pre className="text-sm font-mono text-slate-300 overflow-x-auto">
                                    <code>{`class NeuralKYC:
    def __init__(self):
        self.cnn = CNNDocumentAnalyzer()
        self.gnn = GNNFraudDetector()
    
    def verify(self, document):
        # Step 1: CNN Analysis
        quality = self.cnn.analyze(document)
        manipulation = self.cnn.detect_forgery()
        
        # Step 2: GNN Pattern Detection
        graph = self.gnn.build_graph(user)
        fraud_score = self.gnn.predict()
        
        return {
            "verified": quality > 0.95,
            "fraud_risk": fraud_score,
            "confidence": 0.99
        }`}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SECURITY SECTION ===== */}
            <section id="security" className="py-32 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
                        <Lock className="w-4 h-4" />
                        Built-in Security Features
                    </div>
                    <h2 className="text-4xl font-bold mb-6">
                        <span className="text-white">Secure by </span>
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Design</span>
                    </h2>
                    <p className="text-lg text-slate-400 mb-12">
                        Your documents and personal information are protected with industry-standard security practices.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                            <h4 className="font-bold text-white mb-2">JWT Authentication</h4>
                            <p className="text-sm text-slate-400">Secure token-based authentication for all user sessions</p>
                        </div>
                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                            <h4 className="font-bold text-white mb-2">Masked Sensitive Data</h4>
                            <p className="text-sm text-slate-400">Aadhaar & PAN numbers are masked in all displays</p>
                        </div>
                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                            <h4 className="font-bold text-white mb-2">Role-based Access</h4>
                            <p className="text-sm text-slate-400">Admin and User roles with separate permissions</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="py-32">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                        <span className="text-white">Secure Your </span>
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Verification Process</span>
                    </h2>
                    <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
                        Upload your documents and get instant AI-powered verification with fraud detection alerts.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-bold text-lg shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300"
                    >
                        Create Your Account
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer id="about" className="py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-cyan-400" />
                            <span className="font-bold text-white">KYC<span className="text-cyan-400">.AI</span></span>
                            <span className="text-slate-500 text-sm ml-2">© 2024 All rights reserved</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
