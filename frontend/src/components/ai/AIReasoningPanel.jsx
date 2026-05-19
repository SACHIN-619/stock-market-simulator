// frontend/src/components/ai/AIReasoningPanel.jsx

function AIReasoningPanel({
  reasoning = [],
}) {
  const data = reasoning;


  const getImpactStyle = (impact = "") => {
    if (impact.includes("HIGH") || impact.includes("CRITICAL")) {
      return {
        text: "text-red-600",
        bg: "bg-red-50 border-red-100",
      };
    }

    if (impact.includes("MEDIUM")) {
      return {
        text: "text-yellow-600",
        bg: "bg-yellow-50 border-yellow-100",
      };
    }

    return {
      text: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    };
  };

  return (
    <div className="glass-card rounded-[2rem] border border-slate-200/60 p-7 h-[450px] overflow-hidden relative flex flex-col bg-white">
      
      {/* BACKGROUND GLOW */}
      <div className="absolute bottom-0 left-0 w-52 h-52 bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-2">
            Neural Decision Layer
          </p>

          <h2 className="text-2xl font-black text-slate-900">
            AI Reasoning Engine
          </h2>
        </div>

        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg">
          🧠
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 space-y-5">
        {data.length > 0 ? (
          data.map((item, index) => {
            const style = getImpactStyle(item?.impact);

            return (
              <div
                key={index}
                className="rounded-[1.5rem] border border-slate-200/60 bg-slate-50/20 p-5 hover:border-indigo-500/20 transition-all duration-300"
              >
                {/* TOP */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-0.5">
                      {item?.step}
                    </h3>

                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                      Analysis Vector
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}
                  >
                    {item?.impact} IMPACT
                  </div>
                </div>

                {/* FINDING */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {item?.finding}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200/60 bg-slate-50/50 p-8 text-center text-slate-400 font-medium text-sm">
            No reasoning data available.
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/30 p-4 relative z-10 shrink-0">
        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
          The AI engine cross-validates:
          <span className="text-slate-800 font-bold">
            {" "}
            RSI, moving averages, news momentum, and sector rotation.
          </span>
        </p>
      </div>
    </div>
  );
}

export default AIReasoningPanel;