// frontend/src/components/ai/AICommandCenter.jsx

import { useEffect, useState } from "react";
import api from "../../service/api";

import AISummaryCard from "./AISummaryCard";
import AITradeSignals from "./AITradeSignals";
import AIPortfolioScore from "./AIPortfolioScore";
import AIReasoningPanel from "./AIReasoningPanel";
import AIConfidenceMeter from "./AIConfidenceMeter";
import AIWatchlistInsights from "./AIWatchlistInsights";
import AIChatPanel from "./AIChatPanel";

function AICommandCenter() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [aiData, setAiData] = useState({
    executiveSummary:
      "AI engine is analyzing your portfolio and market conditions...",
    traderScore: 0,
    confidenceScore: 0,
    marketSentiment: {
      label: "NEUTRAL",
      score: 50,
    },
    portfolioScore: {
      diversification: 0,
      riskAdjusted: 0,
      concentration: "LOW",
    },
    riskAnalysis: {
      level: "Moderate",
      warning: "Risk engine initializing...",
    },
    tradeSignals: [],
    watchlist: [],
    reasoning: [],
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAI = async () => {
      try {
        setLoading(true);
        const res = await api.get("/ai/suggestions");
        if (res?.data?.payload) {
          setAiData(res.data.payload);
        }
      } catch (err) {
        console.error(err);
        setError("Institutional AI engine temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchAI();
  }, []);

  if (loading || !aiData) {
    return (
      <div className="min-h-screen bg-[#F4F5F0] p-6 lg:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-[2rem] bg-slate-200/60" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-[2rem] bg-slate-200/60"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-[2rem] bg-slate-200/60"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Overview Metrics", icon: "📊" },
    { id: "signals", label: "Trade Signals & Reasoning", icon: "⚡" },
    { id: "watchlist", label: "Watchlist Insights", icon: "👁️" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-slate-800 p-6 lg:p-10 pb-32">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="px-4 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-600 text-[10px] font-black tracking-[0.25em] uppercase">
            Institutional AI
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-4">
          Alpha Insight Engine
        </h1>
        <p className="text-slate-500 max-w-3xl text-lg leading-relaxed font-medium">
          Real-time portfolio intelligence, AI trade signals, risk analysis, and institutional-grade market reasoning.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-100/50 rounded-3xl p-6 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* EXECUTIVE SUMMARY */}
      <div className="mb-10">
        <AISummaryCard
          summary={aiData.executiveSummary}
          traderScore={aiData.traderScore}
          marketPhase={aiData?.marketSentiment?.label}
        />
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 cursor-pointer ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10 scale-102"
                : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-850 border border-slate-200/60"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTIONS / TAB CONTENT */}
      <div className="animate-fade-in mb-24 min-h-[500px]">
        
        {/* SECTION 1: OVERVIEW METRICS */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AIPortfolioScore 
              portfolioScore={aiData.portfolioScore} 
              sentimentLabel={aiData?.marketSentimentData?.label || aiData?.marketSentiment?.label}
            />
            <AIConfidenceMeter
              confidence={aiData?.confidenceScore}
              prediction={aiData?.marketSentimentData?.reasoning || aiData?.marketSentiment?.reasoning || "Analyzing market velocity..."}
              risk={aiData?.riskAnalysis?.level}
              volatility={aiData?.riskAnalysis?.score || 45}
              fearGreedIndex={aiData?.marketSentimentData?.score || aiData?.marketSentiment?.score || 50}
            />
          </div>
        )}

        {/* SECTION 2: TRADE SIGNALS & REASONING */}
        {activeTab === "signals" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <AITradeSignals signals={aiData.tradeSignals} />
            <AIReasoningPanel reasoning={aiData.reasoning} />
          </div>
        )}

        {/* SECTION 3: WATCHLIST INSIGHTS */}
        {activeTab === "watchlist" && (
          <div className="max-w-4xl">
            <AIWatchlistInsights watchlist={aiData.watchlist || []} />
          </div>
        )}
      </div>

      {/* FLOATING CHAT PANEL */}
      <AIChatPanel />
    </div>
  );
}

export default AICommandCenter;