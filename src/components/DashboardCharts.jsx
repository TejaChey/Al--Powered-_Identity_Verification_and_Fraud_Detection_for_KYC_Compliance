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
    // Handle different data structures (backend vs local)
    const score = s.fraud?.score || 0;
    let category = "Low";
    if (score > 70) category = "High";
    else if (score > 30) category = "Medium";
    
    riskCounts[category] = (riskCounts[category] || 0) + 1;
  });

  // 2. Chart Data Configuration
  const pieData = {
    labels: ["Verified", "Unverified"],
    datasets: [{
      data: [verified, unverified],
      backgroundColor: ['#10b981', '#f43f5e'], // Emerald-500, Rose-500
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const barData = {
    labels: ["Low Risk", "Medium Risk", "High Risk"],
    datasets: [{
      label: "Documents",
      data: [riskCounts.Low, riskCounts.Medium, riskCounts.High],
      backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
      borderRadius: 6,
      barThickness: 40, // Fixed width for neater bars
    }]
  };

  // 3. Premium Options (No Grid Lines, Better Fonts)
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows chart to fill the container height
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: "'Inter', sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate-900
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: "'Inter', sans-serif", size: 13 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 }
      }
    }
  };

  const pieOptions = {
    ...commonOptions,
    cutout: '60%', // Makes it a Donut chart (looks more modern)
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: false }, // Remove grid lines for clean look
        ticks: { precision: 0, font: { family: "'Inter', sans-serif" } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Inter', sans-serif" } }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6"> {/* Force 1 Column Stack */}
      
      {/* Donut Chart */}
      <div className="bg-white/50 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center">
        <h5 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Verification Status</h5>
        <div className="h-64 w-full">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white/50 rounded-2xl p-4 border border-slate-200">
        <h5 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Risk Distribution</h5>
        <div className="h-64 w-full">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

    </div>
  );
}