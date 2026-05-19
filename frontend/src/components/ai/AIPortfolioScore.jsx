// frontend/src/components/ai/AIPortfolioScore.jsx

function AIPortfolioScore({ portfolioScore, sentimentLabel }) {
  const {
    diversification = 0,
    riskAdjusted = 0,
    concentration = "N/A"
  } = portfolioScore || {};

  const overall = Math.round((diversification + riskAdjusted) / 2) || 0;


  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const metrics = [
    {
      title: "Diversification",
      value: diversification,
    },
    {
      title: "Risk Adjusted",
      value: riskAdjusted,
    },
  ];

  return (
    <div className="glass-card rounded-[2rem] border border-slate-200/60 p-7 h-[450px] relative overflow-hidden flex flex-col bg-white">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex items-start justify-between mb-6 shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-2">
            AI Portfolio Rating
          </p>

          <h2 className="text-2xl font-black text-slate-900">
            Portfolio Score
          </h2>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-[6px] border-slate-100 flex items-center justify-center">
            <div className="text-center">
              <h1
                className={`text-xl font-black ${getScoreColor(overall)}`}
              >
                {overall}
              </h1>
            </div>
          </div>

          {/* PROGRESS RING */}
          <svg
            className="absolute inset-0 -rotate-90"
            width="80"
            height="80"
          >
            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="rgba(0,0,0,0.04)"
              strokeWidth="6"
              fill="transparent"
            />

            <circle
              cx="40"
              cy="40"
              r="35"
              stroke="rgb(16 185 129)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={220}
              strokeDashoffset={220 - (220 * overall) / 100}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {/* METRICS */}
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500">
                  {metric.title}
                </span>

                <span
                  className={`text-xs font-black ${getScoreColor(metric.value)}`}
                >
                  {metric.value}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getProgressColor(
                    metric.value
                  )}`}
                  style={{
                    width: `${metric.value}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ADDITIONAL INSIGHTS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200/50">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">Concentration</p>
            <p className="text-xs font-black text-slate-800">{concentration}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200/50">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">Sentiment</p>
            <p className={`text-xs font-black ${sentimentLabel === 'BULLISH' ? 'text-emerald-600' : sentimentLabel === 'BEARISH' ? 'text-red-600' : 'text-yellow-600'}`}>
              {sentimentLabel || 'NEUTRAL'}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            AI evaluated your portfolio based on diversification,
            momentum strength, stability, and {sentimentLabel?.toLowerCase() || 'market'} conditions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIPortfolioScore;