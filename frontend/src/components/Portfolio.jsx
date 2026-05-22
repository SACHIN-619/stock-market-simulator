import { useEffect, useState } from "react";
import api from "../service/api";
import { TableSkeleton } from "./Skeleton";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { Link } from "react-router-dom";
import CoinIcon from "./CoinIcon";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState(null);
  const [growthHistory, setGrowthHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const res = await api.get("/portfolio");
        setPortfolio(res.data.payload || []);
        setSummary(res.data.summary || null);
        setGrowthHistory(res.data.growthHistory || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load portfolio");
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const donutData = {
    labels: portfolio.map(s => s.stockSymbol),
    datasets: [{
      data: portfolio.map(s => s.currentValue),
      backgroundColor: [
        '#6366f1', // Indigo
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#3b82f6', // Blue
      ],
      borderColor: '#ffffff',
      borderWidth: 4,
    }]
  };

  // Deduplicate growth history by date, keeping the last value for each date
  const processedGrowthHistory = [];
  const seenDates = new Set();
  for (let i = growthHistory.length - 1; i >= 0; i--) {
    const item = growthHistory[i];
    if (!seenDates.has(item.date)) {
      seenDates.add(item.date);
      processedGrowthHistory.unshift(item);
    }
  }

  const growthData = {
    labels: processedGrowthHistory.map(item => item.date),
    datasets: [{
      fill: true,
      label: 'Portfolio Value',
      data: processedGrowthHistory.map(item => item.value),
      borderColor: '#6366f1',
      borderWidth: 3,
      backgroundColor: 'rgba(99, 102, 241, 0.05)',
      tension: 0.4,
    }]
  };

  if (loading) return <div className="space-y-10"><TableSkeleton rows={8} /></div>;
  if (error) return <div className="glass-card p-10 text-red-500 font-bold rounded-3xl text-center border border-red-100 bg-red-50/30">{error}</div>;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight pb-1">Your Portfolio</h1>
          <p className="text-slate-500 mt-2 font-medium">Detailed breakdown of your virtual investments</p>
        </div>
      </header>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            label: "Stockking virtual wallet", 
            value: summary?.walletBalance, 
            bgStyle: "border-slate-100 hover:border-amber-200 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.06)]",
            glowColor: "bg-amber-500/5",
            textColor: "text-slate-900"
          },
          { 
            label: "Total Spent", 
            value: summary?.totalInvestment, 
            bgStyle: "border-slate-100 hover:border-indigo-200 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.06)]",
            glowColor: "bg-indigo-500/5",
            textColor: "text-slate-900"
          },
          { 
            label: "Market Value", 
            value: summary?.totalCurrentValue, 
            bgStyle: "border-slate-100 hover:border-emerald-200 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)]",
            glowColor: "bg-emerald-500/5",
            textColor: "text-slate-900"
          }
        ].map((item, i) => (
          <div key={i} className={`glass-card p-8 rounded-[2rem] relative overflow-hidden group border bg-white transition-all duration-300 hover:-translate-y-1 shadow-sm ${item.bgStyle}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
            <div className="flex items-end justify-between">
              <h3 className={`text-3xl font-black flex items-center ${item.textColor}`}>
                <span className="mr-1 text-slate-900 font-black">$</span>
                {(item.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity ${item.glowColor}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* GROWTH CHART */}
        <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] space-y-6">
          <h2 className="text-lg font-black text-slate-900">Growth Analysis</h2>
          {growthHistory.length > 0 ? (
            <div className="h-[300px]">
              <Line 
                data={growthData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { display: false } 
                  }, 
                  scales: { 
                    x: { 
                      grid: { display: false }, 
                      ticks: { 
                        color: '#94a3b8', 
                        font: { 
                          family: 'Inter', 
                          weight: 'bold', 
                          size: 10 
                        },
                        maxTicksLimit: 8,
                        maxRotation: 0,
                        minRotation: 0
                      } 
                    }, 
                    y: { 
                      grid: { color: 'rgba(226, 232, 240, 0.6)' }, 
                      ticks: { 
                        color: '#94a3b8', 
                        font: { 
                          family: 'Inter', 
                          weight: 'bold', 
                          size: 10 
                        } 
                      } 
                    } 
                  } 
                }} 
              />
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-2xs">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">No Performance History</h3>
                <p className="text-xs text-slate-450 font-semibold max-w-sm leading-relaxed">
                  Your portfolio performance and growth analytics will generate dynamically once you complete your first trade.
                </p>
              </div>
              <Link to="/stocks" className="rounded-xl bg-indigo-650 hover:bg-indigo-750 text-white px-5 py-2 text-xs font-black uppercase tracking-wider transition shadow-2xs cursor-pointer">
                Browse Stocks
              </Link>
            </div>
          )}
        </div>

        {/* ASSET ALLOCATION */}
        <div className="glass-card p-8 rounded-[2.5rem] flex flex-col">
          <h2 className="text-lg font-black text-slate-900 mb-8">Asset Allocation</h2>
          
          {portfolio.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* CHART AREA */}
              <div className="relative w-full max-w-[240px] aspect-square flex items-center justify-center">
                <Doughnut 
                  data={donutData} 
                  options={{ 
                    cutout: '84%', 
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#0f172a',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        titleFont: { size: 13, weight: 'bold', family: 'Inter' },
                        bodyFont: { size: 12, family: 'Inter' },
                        padding: 12,
                        cornerRadius: 12,
                        displayColors: true,
                        boxPadding: 4,
                        callbacks: {
                          label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return ` $${value.toLocaleString()} (${percentage}%)`;
                          }
                        }
                      }
                    } 
                  }} 
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total P/L</p>
                  <p className={`text-3xl font-black flex items-center tracking-tighter ${summary?.totalProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {summary?.totalProfit < 0 ? "-" : ""}${Math.abs(summary?.totalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <div className={`w-6 h-0.5 rounded-full mt-2 ${summary?.totalProfit >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"}`} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Empty Allocation</h3>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  Your asset distribution ring is empty because you do not own any equities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HOLDINGS TABLE */}
      <section className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Current Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Quantity</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Avg Price</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Current Price</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {portfolio.length === 0 ? (
                <tr>
                  <td className="px-8 py-10 text-center text-slate-400 font-medium" colSpan="5">
                    No active positions. <Link to="/stocks" className="text-indigo-600 hover:underline">Start trading</Link>
                  </td>
                </tr>
              ) : (
                portfolio.map((stock) => (
                  <tr key={stock.stockSymbol} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {stock.stockSymbol[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 uppercase">{stock.stockSymbol}</p>
                          <p className="text-xs font-semibold text-slate-400">Equity Position</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-slate-800">{stock.ownedQuantity}</td>
                    <td className="px-8 py-6 text-right font-medium text-slate-500">
                      ${stock.avgPrice?.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-slate-800">
                      ${stock.currentPrice?.toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className={`font-bold flex items-center justify-end gap-1 ${stock.profitLoss >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        <span>{stock.profitLoss >= 0 ? "▲" : "▼"}</span>
                        {stock.profitLoss >= 0 ? "+" : "-"}${Math.abs(stock.profitLoss || 0).toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${stock.profitLoss >= 0 ? "text-emerald-500/60" : "text-red-500/60"}`}>
                        {stock.profitPercent?.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Portfolio;
