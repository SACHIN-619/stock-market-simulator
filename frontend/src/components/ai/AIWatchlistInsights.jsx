import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../service/api";

// ──────────────────────────────────────────────
// AI WATCHLIST INSIGHTS — Full CRUD
//
// • Add tickers manually (search input)
// • Remove individual tickers
// • View live AI signal per ticker (fetched from DB)
// • Click ticker → navigate to /stocks/:symbol (chart view)
// ──────────────────────────────────────────────

const SIGNAL_STYLES = {
    BUY:   { border: "border-emerald-100/80", bg: "bg-emerald-50/30",  badge: "bg-emerald-50 text-emerald-600 border-emerald-100/50", dot: "bg-emerald-500" },
    SELL:  { border: "border-red-100/80",     bg: "bg-red-50/30",      badge: "bg-red-50 text-red-600 border-red-100/50",             dot: "bg-red-500"     },
    HOLD:  { border: "border-yellow-100/80",  bg: "bg-yellow-50/30",   badge: "bg-yellow-50 text-yellow-600 border-yellow-100/50",    dot: "bg-yellow-500"  },
    WATCH: { border: "border-blue-100/80",    bg: "bg-blue-50/30",     badge: "bg-blue-50 text-blue-600 border-blue-100/50",          dot: "bg-blue-500"    },
};

const SENTIMENT_COLOR = {
    BULLISH: "text-emerald-600",
    BEARISH: "text-red-600",
    NEUTRAL: "text-slate-500",
};

function AIWatchlistInsights() {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [inputSymbol, setInput]   = useState("");
    const [adding, setAdding]       = useState(false);
    const [removingId, setRemoving] = useState(null);
    const [error, setError]         = useState("");
    const [success, setSuccess]     = useState("");

    // Flash a status message then clear it
    const flash = (setter, msg, ms = 2500) => {
        setter(msg);
        setTimeout(() => setter(""), ms);
    };

    // ── Fetch watchlist from backend ──
    const fetchWatchlist = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/watchlist");
            setWatchlist(res.data?.data || []);
        } catch (err) {
            console.error("Watchlist fetch error:", err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

    // ── ADD ticker ──
    const handleAdd = async (e) => {
        e.preventDefault();
        const symbol = inputSymbol.trim().toUpperCase();
        if (!symbol) return;

        setAdding(true);
        setError("");
        try {
            const res = await api.post("/watchlist", { symbol });
            setWatchlist(prev => {
                const exists = prev.find(w => w.symbol === symbol);
                if (exists) return prev;
                return [res.data.data, ...prev];
            });
            setInput("");
            flash(setSuccess, `${symbol} added to watchlist ✓`);
        } catch (err) {
            flash(setError, err.response?.data?.message || "Failed to add ticker.");
        } finally {
            setAdding(false);
        }
    };

    // ── REMOVE single ticker ──
    const handleRemove = async (symbol) => {
        setRemoving(symbol);
        try {
            await api.delete(`/watchlist/${symbol}`);
            setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
            flash(setSuccess, `${symbol} removed.`);
        } catch (err) {
            flash(setError, err.response?.data?.message || "Failed to remove.");
        } finally {
            setRemoving(null);
        }
    };

    // ── CLEAR ALL ──
    const handleClearAll = async () => {
        if (!window.confirm("Clear entire watchlist?")) return;
        try {
            await api.delete("/watchlist");
            setWatchlist([]);
            flash(setSuccess, "Watchlist cleared.");
        } catch (err) {
            flash(setError, "Failed to clear watchlist.");
        }
    };

    const getSentimentAge = (lastChecked) => {
        if (!lastChecked) return "Not yet checked";
        const mins = Math.round((Date.now() - new Date(lastChecked)) / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        return `${Math.round(mins / 60)}h ago`;
    };

    // ─────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────
    return (
        <div className="glass-card rounded-[2rem] border border-slate-200/60 p-7 h-[450px] overflow-hidden relative flex flex-col bg-white">

            {/* AMBIENT GLOW */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/3 blur-[100px] pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-48 h-48 bg-purple-500/3 blur-[80px] pointer-events-none" />

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between mb-5 relative z-10 shrink-0">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-1">
                        AI Signal Monitor
                    </p>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        Watchlist Insights
                        {watchlist.length > 0 && (
                            <span className="text-[10px] font-black bg-indigo-50 text-indigo-650 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                {watchlist.length} tracked
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {watchlist.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-650 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
                            title="Clear all watchlist items"
                        >
                            Clear
                        </button>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        👁️
                    </div>
                </div>
            </div>

            {/* ── ADD TICKER FORM ── */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-4 relative z-10 shrink-0">
                <input
                    type="text"
                    value={inputSymbol}
                    onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                    placeholder="Add ticker e.g. AAPL"
                    maxLength={6}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/40 focus:bg-white transition-all uppercase tracking-widest"
                />
                <button
                    type="submit"
                    disabled={adding || !inputSymbol.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                    {adding ? (
                        <span className="animate-spin text-base">⟳</span>
                    ) : (
                        <>+ Add</>
                    )}
                </button>
            </form>

            {/* ── STATUS FLASH ── */}
            {(success || error) && (
                <div className={`text-[11px] font-bold px-4 py-2 rounded-xl mb-3 shrink-0 border ${
                    success ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                }`}>
                    {success || error}
                </div>
            )}

            {/* ── SCROLLABLE WATCHLIST ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-3 pr-1">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-[1.5rem] bg-slate-100" />
                        ))}
                    </div>
                ) : watchlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-2xl mb-3">
                            🎯
                        </div>
                        <p className="text-sm font-bold text-slate-500">No stocks tracked yet</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[200px] font-medium">
                            Add tickers above. AI will monitor signals and alert you when they change.
                        </p>
                    </div>
                ) : (
                    watchlist.map((item) => {
                        const signal = item.lastSignal || "WATCH";
                        const style  = SIGNAL_STYLES[signal] || SIGNAL_STYLES.WATCH;
                        const sentimentColor = SENTIMENT_COLOR[item.lastSentiment] || "text-slate-500";

                        return (
                            <div
                                key={item._id}
                                className={`rounded-[1.5rem] border ${style.border} ${style.bg} p-4 hover:brightness-102 transition-all duration-300 group`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* LEFT: Symbol + signal */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Signal dot */}
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot} shadow-md`} />

                                        {/* Symbol → links to stock chart */}
                                        <Link
                                            to={`/stocks/${item.symbol}`}
                                            className="text-lg font-black text-slate-900 hover:text-indigo-600 transition-colors tracking-tight font-black"
                                            title={`View ${item.symbol} chart`}
                                        >
                                            {item.symbol}
                                        </Link>

                                        {/* Signal badge */}
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${style.badge}`}>
                                            {signal}
                                        </span>

                                        {/* Sentiment */}
                                        {item.lastSentiment && (
                                            <span className={`text-[9px] font-black ${sentimentColor} hidden sm:block`}>
                                                {item.lastSentiment}
                                            </span>
                                        )}
                                    </div>

                                    {/* RIGHT: Time + actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                                            {getSentimentAge(item.lastChecked)}
                                        </span>

                                        {/* View chart link */}
                                        <Link
                                            to={`/stocks/${item.symbol}`}
                                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"
                                            title="View chart"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                                <polyline points="15 3 21 3 21 9"/>
                                                <line x1="10" y1="14" x2="21" y2="3"/>
                                            </svg>
                                        </Link>

                                        {/* Remove button */}
                                        <button
                                            onClick={() => handleRemove(item.symbol)}
                                            disabled={removingId === item.symbol}
                                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-500 hover:text-red-650 transition-all disabled:opacity-40 cursor-pointer"
                                            title={`Remove ${item.symbol}`}
                                        >
                                            {removingId === item.symbol ? (
                                                <span className="animate-spin text-xs">⟳</span>
                                            ) : (
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Reason text */}
                                {item.lastReason && (
                                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold mt-2.5 line-clamp-2">
                                        {item.lastReason}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── FOOTER INFO ── */}
            <div className="mt-3 rounded-xl border border-slate-200/60 bg-slate-50/30 px-4 py-2.5 relative z-10 shrink-0 flex items-center justify-between">
                <p className="text-[10px] text-slate-600 font-medium">
                    Signals update every <span className="text-slate-800 font-bold">3 min</span> · Bell icon alerts on change
                </p>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-bold">Live</span>
                </div>
            </div>
        </div>
    );
}

export default AIWatchlistInsights;
