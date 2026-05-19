// frontend/src/components/ai/AISummaryCard.jsx

function AISummaryCard({ summary, traderScore, marketPhase = "N/A" }) {

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-gradient-to-br from-indigo-500/5 via-white to-emerald-500/5 p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10">

        {/* TOP */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">

          <div>

            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-100 border border-slate-200/40 mb-4">

              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

              <span className="text-[10px] tracking-[0.25em] uppercase font-black text-emerald-600">
                Executive AI Summary
              </span>

            </div>

            <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 mb-4">
              Institutional Grade Portfolio Intelligence
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed max-w-4xl font-medium">
              {summary}
            </p>

          </div>

          {/* SCORE PANEL */}
          <div className="min-w-[220px] rounded-[2rem] border border-emerald-100 bg-emerald-50/50 p-6 backdrop-blur-xl">

            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-600 font-black mb-3">
              Trader Score
            </p>

            <div className="flex items-end gap-2">

              <h1 className="text-6xl font-black text-slate-900 leading-none">
                {traderScore}
              </h1>

              <span className="text-emerald-600 font-black text-xl mb-1">
                /100
              </span>

            </div>

            <div className="mt-4 h-3 rounded-full bg-slate-200 overflow-hidden">

              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  traderScore >= 80
                    ? "bg-emerald-500"
                    : traderScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${traderScore}%`,
                }}
              />

            </div>

            <p className="mt-4 text-sm text-slate-500 leading-relaxed font-semibold">
              AI confidence calibrated using portfolio performance,
              diversification quality, volatility exposure,
              and market alignment.
            </p>

          </div>

        </div>

        {/* BOTTOM STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* AI STATUS */}
          <div className="rounded-[2rem] border border-slate-200/50 bg-slate-50/50 p-6">

            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 mb-3">
              AI Status
            </p>

            <div className="flex items-center gap-3">

              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />

              <h3 className="text-xl font-black text-slate-900">
                Operational
              </h3>

            </div>

            <p className="mt-3 text-slate-500 text-sm font-semibold">
              Live portfolio reasoning engine active.
            </p>

          </div>

          {/* ANALYSIS MODE */}
          <div className="rounded-[2rem] border border-slate-200/50 bg-slate-50/50 p-6">

            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 mb-3">
              Analysis Mode
            </p>

            <h3 className="text-xl font-black text-indigo-600">
              Multi-Factor
            </h3>

            <p className="mt-3 text-slate-500 text-sm font-semibold">
              Technical indicators + sentiment fusion +
              portfolio behavior analysis.
            </p>

          </div>

          {/* MARKET PHASE */}
          <div className="rounded-[2rem] border border-slate-200/50 bg-slate-50/50 p-6">

            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-400 mb-3">
              Market Phase
            </p>

            <h3 className="text-xl font-black text-emerald-600">
              {marketPhase}
            </h3>

            <p className="mt-3 text-slate-500 text-sm font-semibold">
              AI detects increased institutional accumulation
              across growth sectors.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default AISummaryCard;