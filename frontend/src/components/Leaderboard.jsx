import { useEffect, useState } from "react";
import axios from "axios";

import CoinIcon from "./CoinIcon";

function Leaderboard() {

  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      // Dynamic API Base URL with a safe local fallback
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await axios.get(
        `${API_BASE_URL}/trader-api/leaderboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLeaders(response.data.payload || []);

    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.message ||
        "Failed to load leaderboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F0] text-slate-800 px-6 py-8">
        <div className="max-w-xl mb-8 animate-pulse">
          <div className="h-10 bg-slate-200 rounded-xl w-64 mb-3"></div>
          <div className="h-4 bg-slate-200 rounded-md w-48"></div>
        </div>

        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[2rem] bg-white h-24 border border-slate-100 shadow-sm"
            />
          ))}
        </div>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F5F0] text-slate-800 flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm max-w-sm">
          <h2 className="text-2xl font-black text-rose-500 uppercase tracking-wide">
            Error
          </h2>
          <p className="mt-3 text-slate-500 font-medium">
            {error}
          </p>
          <button
            onClick={fetchLeaderboard}
            className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 font-bold text-white shadow-md transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredLeaders = leaders
    .map((trader, idx) => ({ ...trader, originalRank: idx + 1 }))
    .filter((trader) =>
      trader.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-slate-800 px-6 py-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Trader Leaderboard
          </h1>
          <p className="mt-2 text-slate-500 text-sm font-medium">
            Top performing simulated traders ranked globally in real-time.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-6 py-3.5 shadow-xs">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-0.5">
            Live Competition
          </p>
          <h2 className="text-xl font-black text-indigo-700 uppercase">
            {leaders.length} Active Traders
          </h2>
        </div>
      </div>

      {/* TOP 3 */}
      {leaders.length >= 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 items-end">

          {/* SECOND */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 order-2 lg:order-1 hover:-translate-y-1 transition duration-300 shadow-sm">
            <div className="text-center">
              <div className="text-5xl mb-4">🥈</div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {leaders[1]?.username}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Global Rank #2
              </p>
              <div className="mt-4 text-3xl font-black text-emerald-600">
                {leaders[1]?.score}
              </div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-1">
                Performance Score
              </p>
            </div>
          </div>

          {/* FIRST */}
          <div className="rounded-[2.8rem] border border-amber-200 bg-gradient-to-b from-amber-50/70 to-white p-10 hover:-translate-y-1.5 transition duration-300 shadow-md lg:-translate-y-2 order-1 lg:order-2">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">👑</div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {leaders[0]?.username}
              </h2>
              <p className="text-amber-600 mt-1.5 font-black uppercase tracking-[0.2em] text-[9px] bg-amber-100/50 rounded-lg px-2 py-0.5 w-fit mx-auto">
                Elite Rank #1
              </p>
              <div className="mt-5 text-4xl font-black text-emerald-600">
                {leaders[0]?.score}
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                Trader Score
              </p>
            </div>
          </div>

          {/* THIRD */}
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 order-3 hover:-translate-y-1 transition duration-300 shadow-sm">
            <div className="text-center">
              <div className="text-5xl mb-4">🥉</div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {leaders[2]?.username}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Global Rank #3
              </p>
              <div className="mt-4 text-3xl font-black text-emerald-600">
                {leaders[2]?.score}
              </div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mt-1">
                Performance Score
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-white">
          <input
            type="text"
            placeholder="Search trader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:bg-white focus:border-indigo-500"
          />
        </div>
        <div className="overflow-x-auto max-h-[640px] custom-scrollbar relative">
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="sticky top-0 z-10 grid grid-cols-6 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div>Rank</div>
              <div>Trader</div>
              <div>Score</div>
              <div>Profit/Loss</div>
              <div>Trades</div>
              <div>Status</div>
            </div>

            {/* Content rows */}
            <div className="divide-y divide-slate-100">
              {filteredLeaders.length === 0 ? (
                <div className="px-8 py-12 text-center text-slate-400 font-medium">
                  No traders found matching your search.
                </div>
              ) : (
                filteredLeaders.map((trader) => (
                  <div
                    key={trader._id}
                    className="grid grid-cols-6 items-center px-8 py-6 transition hover:bg-slate-50/40 duration-200"
                  >
                    <div className="font-black text-slate-900 text-base">
                      #{trader.originalRank}
                    </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-sm font-black text-indigo-600">
                      {trader.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {trader.username}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Trader Account
                      </p>
                    </div>
                  </div>

                  <div className="text-lg font-black text-slate-800">
                    {trader.score}
                  </div>

                  {/* UPDATED PROFIT/LOSS CODE */}
                  <div
                    className={`font-semibold ${
                      trader.totalProfit >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {trader.totalProfit >= 0
                      ? `+$${trader.totalProfit?.toFixed(2)}`
                      : `-$${Math.abs(trader.totalProfit)?.toFixed(2)}`}
                  </div>

                  <div className="font-bold text-slate-600">
                    {trader.totalTrades}
                  </div>

                  <div>
                    <span className="rounded-lg bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 text-[9px] font-black text-emerald-600 tracking-wider uppercase">
                      ACTIVE
                    </span>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;