import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function DashboardCharts({ submissions = [] }) {
  // 1. Calculate Data
  const verified = submissions.filter(s => s.verified).length;
  const unverified = submissions.length - verified;

  const riskCounts = { Low: 0, Medium: 0, High: 0 };
  submissions.forEach(s => {
    const score = s.fraud?.score || 0;
    let category = "Low";
    if (score > 70) category = "High";
    else if (score > 30) category = "Medium";
    riskCounts[category] = (riskCounts[category] || 0) + 1;
  });

  // 2. Theme Colors (Neon)
  const colors = {
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    slate: '#94a3b8',
    white: '#f8fafc'
  };

  // 3. Chart Configuration
  const pieData = {
    labels: ["Verified", "Unverified"],
    datasets: [{
      data: [verified, unverified],
      backgroundColor: [colors.emerald, colors.rose],
      borderColor: '#0f172a', // Match background color
      borderWidth: 4,
      hoverOffset: 10
    }]
  };

  const barData = {
    labels: ["Low Risk", "Medium Risk", "High Risk"],
    datasets: [{
      label: "Documents",
      data: [riskCounts.Low, riskCounts.Medium, riskCounts.High],
      backgroundColor: [colors.emerald, colors.amber, colors.rose],
      borderRadius: 4,
      barThickness: 30,
    }]
  };

  // 4. Dark Mode Options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: colors.slate, // Light text for legend
          usePointStyle: true,
          padding: 20,
          font: { family: "'Inter', sans-serif", size: 11 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: colors.white,
        bodyColor: colors.slate,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      }
    }
  };

  const pieOptions = {
    ...commonOptions,
    cutout: '70%', // Thinner donut
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' }, // Faint grid
        ticks: { color: colors.slate, font: { family: "'Inter', sans-serif" } }
      },
      x: {
        grid: { display: false },
        ticks: { color: colors.slate, font: { family: "'Inter', sans-serif" } }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Donut Chart */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center relative">
        <h5 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Status Ratio</h5>
        <div className="h-48 w-full relative z-10">
          <Pie data={pieData} options={pieOptions} />
        </div>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 pointer-events-none">
           <span className="text-2xl font-bold text-white">{submissions.length}</span>
           <span className="text-[10px] text-slate-500 uppercase">Total</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
        <h5 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Risk Distribution</h5>
        <div className="h-48 w-full">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}