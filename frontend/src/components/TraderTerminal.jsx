import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllStocks, getStockDetails } from '../service/stockService';
import AdvancedChart from './AdvancedChart'; // Fixed: Restored the vital chart engine import
import api from '../service/api';

// Utility for formatting market cap
const formatMarketCap = (num) => {
  if (!num || num === 0) return "N/A";
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "T";
  if (num >= 1000) return (num / 1000).toFixed(2) + "B";
  return num.toFixed(2) + "M";
};

// Mini Sparkline component
export const Sparkline = ({ symbol, color = "#10b981" }) => {
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/historical/history/${symbol}?range=1W`);
        let data = response.data.data || response.data || [];
        // Filter out invalid data and normalize price/close
        data = data.map(d => ({ ...d, close: d.price || d.close }))
                   .filter(d => d && typeof d.close === 'number' && !isNaN(d.close));

        if (data.length > 1 && isMounted) {
          const prices = data.map(d => d.close);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const range = maxPrice - minPrice || 1;

          const svgPoints = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 25 - ((d.close - minPrice) / range) * 20;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          setPoints(svgPoints.join(" "));
        } else if (data.length === 1 && isMounted) {
          setPoints("0,15 100,15"); // Flat line for single point
        }
      } catch (err) {
        console.error("Sparkline fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [symbol]);

  if (loading) {
    return <div className="w-full h-12 flex items-center justify-center opacity-50"><div className="w-4 h-4 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" /></div>;
  }

  if (!points) {
    return <div className="w-full h-12 flex items-center justify-center text-[9px] font-bold tracking-widest text-slate-700 uppercase">No Data</div>;
  }

  return (
    <svg viewBox="0 0 100 30" className="w-full h-12 opacity-80 group-hover:opacity-100 transition-opacity preserve-3d">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="animate-draw-line"
      />
      <polygon
        points={`0,30 ${points} 100,30`}
        fill={`url(#gradient-${color.replace('#', '')})`}
        stroke="none"
      />
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default function TraderTerminal() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);

  // Phase 2 state
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState('1M');
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const data = await getAllStocks(1, "", 50); // Get up to 50 active stocks
        const allStocks = data.payload || [];
        const activeStocks = allStocks.filter(s => s.isActive);

        // Fetch live details
        const detailedStocks = await Promise.all(
          activeStocks.map(async (stock) => {
            try {
              const details = await getStockDetails(stock.stockSymbol);
              return { ...stock, ...details.payload };
            } catch (err) {
              return stock;
            }
          })
        );
        setStocks(detailedStocks);
      } catch (err) {
        console.error("Failed to fetch stocks for terminal:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, []);

  // Fetch chart data when a stock is selected
  useEffect(() => {
    if (!selectedStock) return;

    const fetchChartData = async () => {
      setLoadingChart(true);
      try {
        const response = await api.get(
          `/historical/history/${selectedStock.stockSymbol.toUpperCase()}?range=${range}`
        );
        if (response.data && response.data.success) {
          setChartData(response.data.data);
        } else if (response.data && response.data.data) {
          setChartData(response.data.data);
        } else {
          setChartData(response.data || []);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchChartData();
  }, [selectedStock, range]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-emerald-500">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-[10px] font-black tracking-[0.3em] uppercase">Initializing Fleet Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-slate-100 p-6 font-sans">
      <style>{`
        @keyframes flash-green {
          0% { background-color: rgba(16, 185, 129, 0.4); }
          100% { background-color: transparent; }
        }
        @keyframes draw-line {
          from { stroke-dasharray: 200; stroke-dashoffset: 200; }
          to { stroke-dasharray: 200; stroke-dashoffset: 0; }
        }
        .animate-draw-line {
          animation: draw-line 1.5s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* PHASE 1: BEFORE CLICK (Card Feed grid layout) */}
      {!selectedStock ? (
        <div className="max-w-[1600px] mx-auto animate-fadeIn">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">Fleet Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">Real-time visual summaries for active market assets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stocks.map((stock) => {
              const currentPrice = stock.c !== undefined ? stock.c.toFixed(2) : "N/A";
              const change = stock.d !== undefined ? stock.d : 0;
              const changePercent = stock.dp !== undefined ? stock.dp : 0;
              const isPositive = change >= 0;
              const sparklineColor = "#10b981"; 

              return (
                <div
                  key={stock.stockSymbol}
                  onClick={() => setSelectedStock(stock)}
                  className="group bg-[#161a25] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between h-56 relative overflow-hidden"
                >
                  {/* Background Glow */}
                  <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500 ${isPositive ? 'bg-emerald-500 group-hover:bg-emerald-400' : 'bg-red-500 group-hover:bg-red-400'}`}></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-2xl font-black tracking-tight transition-colors ${isPositive ? 'text-white group-hover:text-emerald-400' : 'text-white group-hover:text-red-400'}`}>{stock.stockSymbol}</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[150px]">{stock.companyName}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                        IPO: {stock.ipo || "N/A"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-white">${currentPrice}</span>
                      {stock.d !== undefined && (
                        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`} style={{ animation: 'flash-green 1s ease-out' }}>
                          {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="absolute left-0 right-0 bottom-12 px-2 pointer-events-none">
                    <Sparkline symbol={stock.stockSymbol} color={sparklineColor} />
                  </div>

                  {/* Technical indicators inside the card */}
                  <div className="mt-6 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest relative z-10">
                    <div>MKT CAP: <span className="text-slate-300">{formatMarketCap(stock.marketCapitalization)}</span></div>
                    <div className="text-emerald-500 group-hover:underline flex items-center gap-1">
                      Terminal <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* PHASE 2: AFTER CLICK (Full Operational Terminal View) */
        <div className="max-w-[1600px] mx-auto bg-[#131722] border border-slate-800 rounded-[2rem] p-6 shadow-2xl animate-fadeIn relative overflow-hidden min-h-[calc(100vh-80px)] flex flex-col">

          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none" />

          {/* Back Action Controller */}
          <div className="relative z-10 flex justify-between items-center mb-6">
            <button
              onClick={() => setSelectedStock(null)}
              className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 hover:text-emerald-400 uppercase transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
              Fleet Dashboard
            </button>

            {/* Range Controller */}
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-xl">
              {['1W', '1M', '3M', '1Y'].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${range === r ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Metric Ribbon Header */}
          <div className="relative z-10 flex flex-wrap justify-between items-center bg-[#171b26]/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 mb-6 gap-6 shadow-xl shadow-black/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1">
                {selectedStock.logo ? (
                  <img src={selectedStock.logo} alt={selectedStock.stockSymbol} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xl font-black text-black">{selectedStock.stockSymbol[0]}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-white tracking-tight">{selectedStock.stockSymbol}</h2>
                  <span className="text-[10px] font-black tracking-widest uppercase bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20">
                    {selectedStock.sector || "EQUITY"}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-medium">{selectedStock.companyName}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-800 min-w-[120px]">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Current</span>
                {/* Fixed: Replaced hardcoded price string with real dynamic context value */}
                <span className="text-xl font-mono font-bold text-emerald-400">
                  ${selectedStock.c !== undefined ? selectedStock.c.toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-800 min-w-[120px] hidden sm:block">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Mkt Cap</span>
                <span className="text-xl font-mono font-bold text-slate-200">{formatMarketCap(selectedStock.marketCapitalization)}</span>
              </div>
              <div className="bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-800 min-w-[120px] hidden md:block">
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Country</span>
                <span className="text-xl font-sans font-black text-slate-200">{selectedStock.country || "USA"}</span>
              </div>
            </div>
          </div>

          {/* Chart Workspace Container */}
          <div className="relative z-10 flex-1 bg-[#0f131c] rounded-2xl border border-slate-800/80 overflow-hidden min-h-[500px]">
            {loadingChart ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500 space-y-4">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500/80">LOADING TICK DATA...</span>
              </div>
            ) : (
              <AdvancedChart chartData={chartData} range={range} mainSymbol={selectedStock.stockSymbol} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}