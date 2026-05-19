// frontend/src/components/ai/AITradeSignals.jsx

import { useState } from "react";

function AITradeSignals({ signals = [] }) {
  const [showAll, setShowAll] = useState(false);

  const getSignalStyle = (signal) => {
    if (!signal) return { text: "text-yellow-600", bg: "bg-yellow-50 border-yellow-100" };
    if (signal.includes("BUY"))  return { text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" };
    if (signal.includes("SELL")) return { text: "text-red-600",     bg: "bg-red-50 border-red-100" };
    return { text: "text-yellow-600", bg: "bg-yellow-50 border-yellow-100" };
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 75) return "text-emerald-600";
    if (conf >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBar = (conf) => {
    if (conf >= 75) return "bg-emerald-500";
    if (conf >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const displayedSignals = showAll ? signals : signals.slice(0, 2);

  return (
    <div className="glass-card rounded-[2rem] border border-slate-200/60 p-7 overflow-hidden relative h-[450px] flex flex-col bg-white">

      {/* GLOW */}
      <div className="absolute top-0 left-0 w-52 h-52 bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-2">
            Institutional Signal Engine
          </p>
          <h2 className="text-2xl font-black text-slate-900">
            AI Trade Signals
          </h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg">
          ⚡
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 space-y-5">
        {signals.length > 0 ? (
          <>
            {signals.map((stock, index) => {
              const style = getSignalStyle(stock.signal);
              const conf  = stock.confidence || 0;

              return (
                <div
                  key={index}
                  className="rounded-[1.5rem] border border-slate-200/60 bg-slate-50/20 p-5 hover:border-emerald-500/20 transition-all duration-300"
                >
                  {/* TOP ROW */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {stock.symbol}
                      </h3>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mt-0.5">
                        Confidence {conf}%
                      </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}>
                      {stock.signal}
                    </div>
                  </div>

                  {/* REASONING */}
                  {stock.reasoning && (
                    <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200/60 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Reasoning</p>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">{stock.reasoning}</p>
                    </div>
                  )}

                  {/* CONTEXT */}
                  <div className="grid grid-cols-2 gap-2">
                    {stock.rsiContext && (
                      <div className="rounded-xl bg-slate-100/50 border border-slate-200/40 p-2.5">
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">RSI</p>
                        <p className="text-[10px] text-yellow-600 font-semibold">{stock.rsiContext}</p>
                      </div>
                    )}
                    {stock.sentimentContext && (
                      <div className="rounded-xl bg-slate-100/50 border border-slate-200/40 p-2.5">
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-0.5">Sentiment</p>
                        <p className="text-[10px] text-indigo-600 font-semibold">{stock.sentimentContext}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200/60 bg-slate-50/50 p-8 text-center text-slate-400 font-medium text-sm">
            No signals available.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/30 p-4 relative z-10 shrink-0">
        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
          Powered by: <span className="text-slate-800 font-bold">RSI, momentum, and sentiment fusion.</span>
        </p>
      </div>
    </div>
  );
}

export default AITradeSignals;