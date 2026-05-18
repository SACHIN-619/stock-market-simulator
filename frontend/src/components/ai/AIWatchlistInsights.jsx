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
// • Real-time signal updates come via WatchlistBell (socket)
// ──────────────────────────────────────────────

const SIGNAL_STYLES = {
    BUY:   { border: "border-emerald-500/30", bg: "bg-emerald-500/5",  badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
    SELL:  { border: "border-red-500/30",     bg: "bg-red-500/5",      badge: "bg-red-500/15 text-red-400 border-red-500/30",             dot: "bg-red-400"     },
    HOLD:  { border: "border-yellow-500/30",  bg: "bg-yellow-500/5",   badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",    dot: "bg-yellow-400"  },
    WATCH: { border: "border-blue-500/30",    bg: "bg-blue-500/5",     badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",          dot: "bg-blue-400"    },
};

const SENTIMENT_COLOR = {
    BULLISH: "text-emerald-400",
    BEARISH: "text-red-400",
    NEUTRAL: "text-slate-400",
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
        <div className="glass-card rounded-[2rem] border border-white/5 p-7 h-[450px] overflow-hidden relative flex flex-col">

            {/* AMBIENT GLOW */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/8 blur-[100px] pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-48 h-48 bg-purple-500/6 blur-[80px] pointer-events-none" />

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between mb-5 relative z-10 shrink-0">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-1">
                        AI Signal Monitor
                    </p>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        Watchlist Insights
                        {watchlist.length > 0 && (
                            <span className="text-[10px] font-black bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                                {watchlist.length} tracked
                            </span>
                        )}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    {watchlist.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                            title="Clear all watchlist items"
                        >
                            Clear
                        </button>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
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
                    className="flex-1 bg-slate-900/60 border border-white/8 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-slate-900/80 transition-all uppercase tracking-widest"
                />
                <button
                    type="submit"
                    disabled={adding || !inputSymbol.trim()}
                    className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-500/20"
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
                <div className={`text-[11px] font-bold px-4 py-2 rounded-xl mb-3 shrink-0 ${
                    success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                    {success || error}
                </div>
            )}

            {/* ── SCROLLABLE WATCHLIST ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-3 pr-1">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-[1.5rem] bg-slate-900/50" />
                        ))}
                    </div>
                ) : watchlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-2xl mb-3">
                            🎯
                        </div>
                        <p className="text-sm font-bold text-slate-400">No stocks tracked yet</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-[200px]">
                            Add tickers above. AI will monitor signals and alert you when they change.
                        </p>
                    </div>
                ) : (
                    watchlist.map((item) => {
                        const signal = item.lastSignal || "WATCH";
                        const style  = SIGNAL_STYLES[signal] || SIGNAL_STYLES.WATCH;
                        const sentimentColor = SENTIMENT_COLOR[item.lastSentiment] || "text-slate-400";

                        return (
                            <div
                                key={item._id}
                                className={`rounded-[1.5rem] border ${style.border} ${style.bg} p-4 hover:brightness-110 transition-all duration-300 group`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* LEFT: Symbol + signal */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Signal dot */}
                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot} shadow-lg`} />

                                        {/* Symbol → links to stock chart */}
                                        <Link
                                            to={`/stocks/${item.symbol}`}
                                            className="text-lg font-black text-white hover:text-indigo-400 transition-colors tracking-tight"
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
                                        <span className="text-[10px] text-slate-600 font-medium hidden sm:block">
                                            {getSentimentAge(item.lastChecked)}
                                        </span>

                                        {/* View chart link */}
                                        <Link
                                            to={`/stocks/${item.symbol}`}
                                            className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-indigo-500/20 border border-slate-700/50 hover:border-indigo-500/40 flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-all"
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
                                            className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-red-500/20 border border-slate-700/50 hover:border-red-500/40 flex items-center justify-center text-slate-600 hover:text-red-400 transition-all disabled:opacity-40"
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
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5 line-clamp-2">
                                        {item.lastReason}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── FOOTER INFO ── */}
            <div className="mt-3 rounded-xl border border-white/5 bg-black/20 px-4 py-2.5 relative z-10 shrink-0 flex items-center justify-between">
                <p className="text-[10px] text-slate-500 font-medium">
                    Signals update every <span className="text-white font-bold">3 min</span> · Bell icon alerts on change
                </p>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-bold">Live</span>
                </div>
            </div>
        </div>
    );
}

export default AIWatchlistInsights;
