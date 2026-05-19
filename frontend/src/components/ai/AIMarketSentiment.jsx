// frontend/src/components/ai/AIMarketSentiment.jsx

function AIMarketSentiment({ sentimentData }) {
  const data = sentimentData || {};


  const getColor = (score) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getBar = (score) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="glass-card rounded-[2rem] border border-slate-200/60 p-7 h-full relative overflow-hidden bg-white">
      {/* BACKGROUND EFFECT */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-2">
            Institutional Market Intelligence
          </p>

          <h2 className="text-2xl font-black text-slate-900">
            Market Sentiment
          </h2>
        </div>

        <div
          className={`px-5 py-3 rounded-2xl border text-sm font-black uppercase tracking-widest ${
            (data.overall || data.label) === "BULLISH"
              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
              : "bg-red-50 border-red-100 text-red-600"
          }`}
        >
          {data.overall || data.label || "NEUTRAL"}
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl bg-slate-50/50 border border-slate-200/50 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">
            Fear & Greed
          </p>

          <h3 className="text-4xl font-black text-emerald-600">
            {data.fearGreedIndex || data.score || 50}
          </h3>
        </div>

        <div className="rounded-2xl bg-slate-50/50 border border-slate-200/50 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">
            Volatility Index
          </p>

          <h3 className="text-4xl font-black text-yellow-600">
            {data.volatilityIndex || "N/A"}
          </h3>
        </div>
      </div>

      {/* INSTITUTIONAL VS RETAIL */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
          <p className="text-xs uppercase tracking-widest text-emerald-600 font-black mb-2">
            Institutional Bias
          </p>

          <h3 className="text-2xl font-black text-slate-850">
            {data.institutionalBias || "N/A"}
          </h3>
        </div>

        <div className="rounded-2xl border border-yellow-100 bg-yellow-50/30 p-5">
          <p className="text-xs uppercase tracking-widest text-yellow-600 font-black mb-2">
            Retail Bias
          </p>

          <h3 className="text-2xl font-black text-slate-850">
            {data.retailBias || "N/A"}
          </h3>
        </div>
      </div>

      {/* SECTOR ANALYSIS */}
      <div className="relative z-10">
        <h3 className="text-sm uppercase tracking-widest text-slate-400 font-black mb-5">
          Sector Strength Analysis
        </h3>

        <div className="space-y-5">
          {(data.sectors || []).map((sector, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-slate-900 font-black">
                    {sector.name}
                  </h4>

                  <p className={`text-xs font-black ${getColor(sector.score)}`}>
                    {sector.sentiment}
                  </p>
                </div>

                <span
                  className={`text-lg font-black ${getColor(sector.score)}`}
                >
                  {sector.score}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getBar(
                    sector.score
                  )}`}
                  style={{
                    width: `${sector.score}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AIMarketSentiment;