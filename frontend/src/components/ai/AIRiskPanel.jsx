// frontend/src/components/ai/AIRiskPanel.jsx

function AIRiskPanel({ riskData }) {
  const {
    level = "N/A",
    score = 0,
    concentrationRisk = "N/A",
    warning = "",
    warnings: propWarnings = [],
  } = riskData || {};

  const overallRisk = level;
  const volatility = score;
  const warnings = propWarnings.length > 0 ? propWarnings : (warning ? [warning] : []);

  const riskColor =
    overallRisk === "LOW"
      ? "text-emerald-600"
      : overallRisk === "HIGH"
      ? "text-red-600"
      : "text-yellow-600";

  const riskBg =
    overallRisk === "LOW"
      ? "bg-emerald-50 border-emerald-100"
      : overallRisk === "HIGH"
      ? "bg-red-50 border-red-100"
      : "bg-yellow-50 border-yellow-100";

  return (
    <div className="glass-card rounded-[2rem] border border-slate-200/60 p-7 h-full bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-2">
            Risk Engine
          </p>

          <h2 className="text-2xl font-black text-slate-900">
            Portfolio Risk
          </h2>
        </div>

        <div
          className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider ${riskBg} ${riskColor}`}
        >
          {overallRisk}
        </div>
      </div>

      {/* VOLATILITY */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-500 font-semibold">
            Volatility Index
          </span>

          <span className={`font-black ${riskColor}`}>
            {volatility}%
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              volatility > 70
                ? "bg-red-500"
                : volatility > 40
                ? "bg-yellow-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${volatility}%` }}
          />
        </div>
      </div>

      {/* CONCENTRATION */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-semibold">
            Concentration Risk
          </span>

          <span className="text-slate-900 font-black">
            {concentrationRisk}
          </span>
        </div>
      </div>

      {/* WARNINGS */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-red-600 mb-4">
          Risk Warnings
        </h3>

        <div className="space-y-3">
          {warnings.length > 0 ? (
            warnings.map((warning, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl border border-red-100 bg-red-50/50"
              >
                <div className="flex gap-3 items-start">
                  <div className="text-lg">⚠️</div>

                  <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                    {warning}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100/50">
              <p className="text-sm text-emerald-600 font-semibold">
                No major portfolio risks detected currently.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIRiskPanel;