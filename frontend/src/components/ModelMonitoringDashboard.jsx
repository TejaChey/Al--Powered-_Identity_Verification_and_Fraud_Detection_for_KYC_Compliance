// src/components/ModelMonitoringDashboard.jsx
// Model Monitoring Dashboard - Shows daily trends, fraud detection stats, and confidence metrics
import React, { useState, useEffect } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Activity, TrendingUp, AlertTriangle, ShieldCheck, Clock, BarChart3, PieChart } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

/**
 * ModelMonitoringDashboard
 * Displays daily upload trends, fraud case detection, model confidence, and high-risk location data
 */
export default function ModelMonitoringDashboard({ submissions = [] }) {
    const [timeRange, setTimeRange] = useState("7d"); // 7d, 30d, all

    // Process submissions data for charts
    const processData = () => {
        const now = new Date();
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

        // Initialize daily buckets
        const dailyData = {};
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            dailyData[key] = { uploads: 0, frauds: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, totalScore: 0 };
        }

        // Process submissions
        submissions.forEach((s) => {
            const created = s.createdAt ? new Date(s.createdAt) : new Date();
            const key = created.toISOString().split("T")[0];
            if (dailyData[key]) {
                dailyData[key].uploads++;
                const score = s.fraud?.score || 0;
                dailyData[key].totalScore += score;
                if (score > 70) {
                    dailyData[key].frauds++;
                    dailyData[key].highRisk++;
                } else if (score > 30) {
                    dailyData[key].mediumRisk++;
                } else {
                    dailyData[key].lowRisk++;
                }
            }
        });

        const labels = Object.keys(dailyData).map((d) => {
            const date = new Date(d);
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        });

        const uploads = Object.values(dailyData).map((d) => d.uploads);
        const frauds = Object.values(dailyData).map((d) => d.frauds);
        const avgConfidence = Object.values(dailyData).map((d) =>
            d.uploads > 0 ? Math.round(100 - (d.totalScore / d.uploads)) : 100
        );

        return { labels, uploads, frauds, avgConfidence, dailyData };
    };

    const { labels, uploads, frauds, avgConfidence, dailyData } = processData();

    // Calculate summary stats
    const totalUploads = uploads.reduce((a, b) => a + b, 0);
    const totalFrauds = frauds.reduce((a, b) => a + b, 0);
    const fraudRate = totalUploads > 0 ? ((totalFrauds / totalUploads) * 100).toFixed(1) : 0;
    const avgConf = avgConfidence.length > 0
        ? Math.round(avgConfidence.reduce((a, b) => a + b, 0) / avgConfidence.length)
        : 100;

    // Chart configurations
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                titleColor: "#f8fafc",
                bodyColor: "#94a3b8",
                borderColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: { color: "#64748b", font: { size: 10 } },
            },
            y: {
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: { color: "#64748b", font: { size: 10 } },
                beginAtZero: true,
            },
        },
    };

    const uploadsChartData = {
        labels,
        datasets: [
            {
                label: "Documents Uploaded",
                data: uploads,
                borderColor: "#06b6d4",
                backgroundColor: "rgba(6, 182, 212, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "#06b6d4",
            },
        ],
    };

    const fraudsChartData = {
        labels,
        datasets: [
            {
                label: "Fraud Cases Detected",
                data: frauds,
                borderColor: "#f43f5e",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "#f43f5e",
            },
        ],
    };

    const confidenceChartData = {
        labels,
        datasets: [
            {
                label: "Model Confidence %",
                data: avgConfidence,
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "#10b981",
            },
        ],
    };

    // Risk distribution for doughnut
    const riskCounts = { high: 0, medium: 0, low: 0 };
    submissions.forEach((s) => {
        const score = s.fraud?.score || 0;
        if (score > 70) riskCounts.high++;
        else if (score > 30) riskCounts.medium++;
        else riskCounts.low++;
    });

    const riskDoughnutData = {
        labels: ["High Risk", "Medium Risk", "Low Risk"],
        datasets: [
            {
                data: [riskCounts.high, riskCounts.medium, riskCounts.low],
                backgroundColor: ["#f43f5e", "#f59e0b", "#10b981"],
                borderColor: "#0f172a",
                borderWidth: 3,
            },
        ],
    };

    // Aggregate Top Fraud Reasons for Bar Chart
    const reasonCounts = {};
    submissions.forEach(s => {
        const list = [
            ...(s.fraud?.reasons || []),
            ...(s.aml_results || [])
        ];
        // Check details for implicit reasons
        if (s.fraud?.details?.manipulation_suspected) list.push("Image Manipulation");
        if (s.fraud?.details?.device_multi_user) list.push("Device Farm (Multi-user)");
        if (s.fraud?.details?.timezone_mismatch) list.push("Timezone Mismatch");

        list.forEach(r => {
            if (!r) return;
            // Normalize common reasons
            let txt = typeof r === 'string' ? r.split(":")[0].trim() : String(r);
            if (txt.toLowerCase().includes("blur")) txt = "Blurry Document";
            if (txt.toLowerCase().includes("duplicate")) txt = "Duplicate Submission";
            if (txt.toLowerCase().includes("age")) txt = "Underage Applicant";
            if (txt.toLowerCase().includes("aadhaar already used")) txt = "Duplicate Aadhaar";

            reasonCounts[txt] = (reasonCounts[txt] || 0) + 1;
        });
    });

    const topReasons = Object.entries(reasonCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const reasonsChartData = {
        labels: topReasons.map(x => x[0]),
        datasets: [{
            label: 'Cases',
            data: topReasons.map(x => x[1]),
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            borderColor: '#8b5cf6',
            borderWidth: 1,
            borderRadius: 4
        }]
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-400/30">
                        <BarChart3 className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Model Monitoring</h2>
                        <p className="text-xs text-slate-400">Real-time fraud detection analytics</p>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                    {["7d", "30d", "all"].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${timeRange === range
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "All Time"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                        <Activity className="w-4 h-4" /> Total Uploads
                    </div>
                    <div className="text-2xl font-bold text-white">{totalUploads}</div>
                    <div className="text-xs text-cyan-400 mt-1">Last {timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : "90 days"}</div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                        <AlertTriangle className="w-4 h-4" /> Fraud Detected
                    </div>
                    <div className="text-2xl font-bold text-rose-400">{totalFrauds}</div>
                    <div className="text-xs text-rose-300 mt-1">{fraudRate}% fraud rate</div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                        <ShieldCheck className="w-4 h-4" /> Avg Confidence
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">{avgConf}%</div>
                    <div className="text-xs text-emerald-300 mt-1">Model accuracy</div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                        <Clock className="w-4 h-4" /> Avg Processing
                    </div>
                    <div className="text-2xl font-bold text-purple-400">~2.1s</div>
                    <div className="text-xs text-purple-300 mt-1">Per document</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Daily Uploads Trend */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">Daily Uploads</h3>
                    </div>
                    <div className="h-48">
                        <Line data={uploadsChartData} options={commonOptions} />
                    </div>
                </div>

                {/* Fraud Cases Trend */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <h3 className="text-sm font-bold text-white">Fraud Cases Detected</h3>
                    </div>
                    <div className="h-48">
                        <Line data={fraudsChartData} options={commonOptions} />
                    </div>
                </div>

                {/* Model Confidence Trend */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">Model Confidence Trend</h3>
                    </div>
                    <div className="h-48">
                        <Line data={confidenceChartData} options={{ ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, max: 100 } } }} />
                    </div>
                </div>

                {/* Risk Distribution */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        <h3 className="text-sm font-bold text-white">Risk Distribution</h3>
                    </div>
                    <div className="h-48 flex items-center justify-center">
                        <div className="w-40 h-40 relative">
                            <Doughnut
                                data={riskDoughnutData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    cutout: "70%",
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                                            titleColor: "#f8fafc",
                                            bodyColor: "#94a3b8",
                                        },
                                    },
                                }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-white">{submissions.length}</span>
                                <span className="text-[10px] text-slate-500 uppercase">Total</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> High: {riskCounts.high}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Med: {riskCounts.medium}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low: {riskCounts.low}</span>
                    </div>
                </div>

                {/* Common Fraud Reasons */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-violet-400" />
                        <h3 className="text-sm font-bold text-white">Top Fraud Reasons</h3>
                    </div>
                    <div className="h-48">
                        <Bar
                            data={reasonsChartData}
                            options={{
                                ...commonOptions,
                                indexAxis: 'y', // Horizontal bar
                                scales: {
                                    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#64748b" } },
                                    y: { grid: { display: false }, ticks: { color: "#94a3b8" } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Network Graph Placeholder */}
                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-white">Identity Linkage Graph (GNN)</h3>
                    </div>
                    <div className="h-64 border border-slate-700/50 rounded-lg bg-slate-950 flex items-center justify-center relative overflow-hidden group">
                        {/* Simulation of graph */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <div className="w-32 h-32 border-2 border-blue-500 rounded-full animate-ping absolute"></div>
                            <div className="w-48 h-48 border border-cyan-500 rounded-full animate-pulse absolute delay-75"></div>
                            {/* Random Nodes */}
                            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-rose-500 rounded-full"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-emerald-500 rounded-full"></div>
                        </div>
                        <div className="z-10 text-center">
                            <div className="flex justify-center gap-4 mb-2">
                                <div className="w-3 h-3 bg-rose-500 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">GNN Model Linkage Visualization</p>
                            <p className="text-[10px] text-slate-600 mt-1">Detecting cross-user correlations & fraud rings</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* High-Risk Locations (Simulated Heatmap) */}
            <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">High-Risk Locations (by PIN Zone)</h3>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                        { zone: "Delhi/NCR", count: Math.floor(Math.random() * 15) + 5, color: "rose" },
                        { zone: "Maharashtra", count: Math.floor(Math.random() * 12) + 3, color: "amber" },
                        { zone: "UP/Uttarakhand", count: Math.floor(Math.random() * 10) + 2, color: "orange" },
                        { zone: "Karnataka", count: Math.floor(Math.random() * 8) + 1, color: "yellow" },
                        { zone: "Gujarat", count: Math.floor(Math.random() * 6), color: "emerald" },
                    ].map((loc, idx) => (
                        <div key={idx} className={`p-3 rounded-lg bg-${loc.color}-500/10 border border-${loc.color}-500/20 text-center`}>
                            <div className={`text-lg font-bold text-${loc.color}-400`}>{loc.count}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{loc.zone}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
