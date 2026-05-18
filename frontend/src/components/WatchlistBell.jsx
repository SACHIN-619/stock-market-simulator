import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { socket } from "../socket/socket";

// ──────────────────────────────────────────────
// WATCHLIST BELL — Global Notification Component
// Sits in the Navbar. Listens to real-time socket
// alerts from the watchlist polling service and
// shows a dropdown panel with all unread alerts.
// ──────────────────────────────────────────────

const SIGNAL_CONFIG = {
    BUY:   { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400", icon: "↑" },
    SELL:  { color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",         dot: "bg-red-400",     icon: "↓" },
    HOLD:  { color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/30",   dot: "bg-yellow-400",  icon: "→" },
    WATCH: { color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/30",       dot: "bg-blue-400",    icon: "◎" },
};

const MAX_ALERTS = 20;

function WatchlistBell({ userId }) {
    const [alerts, setAlerts]       = useState([]);
    const [isOpen, setIsOpen]       = useState(false);
    const [unreadCount, setUnread]  = useState(0);
    const panelRef                  = useRef(null);

    // Register userId with socket so server can target us
    useEffect(() => {
        if (userId) {
            socket.emit("register", userId);
        }
    }, [userId]);

    // Listen for watchlist alerts from server
    useEffect(() => {
        const handleAlert = (payload) => {
            setAlerts(prev => {
                const updated = [{ ...payload, id: Date.now(), read: false }, ...prev];
                return updated.slice(0, MAX_ALERTS);
            });
            setUnread(n => n + 1);

            // Play subtle audio cue (silent if browser blocks)
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } catch { /* silent fail */ }
        };

        socket.on("watchlistAlert", handleAlert);
        return () => socket.off("watchlistAlert", handleAlert);
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const markAllRead = () => {
        setAlerts(prev => prev.map(a => ({ ...a, read: true })));
        setUnread(0);
    };

    const clearAll = () => {
        setAlerts([]);
        setUnread(0);
    };

    const openPanel = () => {
        setIsOpen(v => !v);
        if (!isOpen) markAllRead();
    };

    const formatTime = (iso) => {
        const d = new Date(iso);
        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* ── BELL BUTTON ── */}
            <button
                onClick={openPanel}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 group
                    ${unreadCount > 0
                        ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                    }`}
                title="Watchlist Alerts"
            >
                {/* Bell SVG */}
                <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-colors ${unreadCount > 0 ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"}`}
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {/* ── UNREAD BADGE ── */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black shadow-lg shadow-red-500/30 animate-bounce-once border-2 border-[#020617]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}

                {/* Pulse ring when new alert */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 pointer-events-none">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-30"></span>
                    </span>
                )}
            </button>

            {/* ── DROPDOWN PANEL ── */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 max-h-[520px] flex flex-col rounded-2xl border border-white/10 bg-[#0a0f1e]/95 backdrop-blur-xl shadow-2xl shadow-black/60 z-50 overflow-hidden animate-fade-in">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-900/40 shrink-0">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-black">Real-Time Alerts</p>
                            <h3 className="text-sm font-black text-white mt-0.5">Watchlist Signals</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {alerts.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Alert List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-2xl mb-4">🔔</div>
                                <p className="text-sm font-bold text-slate-400">No alerts yet</p>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">AI will notify you here when a watchlist signal changes (e.g. HOLD → BUY)</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/[0.03]">
                                {alerts.map((alert) => {
                                    const cfg = SIGNAL_CONFIG[alert.newSignal] || SIGNAL_CONFIG.WATCH;
                                    const prevCfg = SIGNAL_CONFIG[alert.previousSignal] || SIGNAL_CONFIG.WATCH;
                                    return (
                                        <Link
                                            key={alert.id}
                                            to={alert.link}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex flex-col gap-2 px-5 py-4 hover:bg-white/[0.02] transition-colors group ${!alert.read ? "bg-white/[0.015]" : ""}`}
                                        >
                                            {/* Top row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {/* Unread dot */}
                                                    {!alert.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                                                    <span className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">{alert.symbol}</span>
                                                    {/* Signal transition badge */}
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${prevCfg.bg} ${prevCfg.color}`}>
                                                            {alert.previousSignal}
                                                        </span>
                                                        <span className="text-slate-600 text-xs">→</span>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                                                            {alert.newSignal}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-600 font-medium shrink-0">{formatTime(alert.timestamp)}</span>
                                            </div>

                                            {/* Price + change */}
                                            {alert.price != null && (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-300 font-bold">${alert.price.toFixed(2)}</span>
                                                    {alert.change != null && (
                                                        <span className={`text-[10px] font-black ${alert.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                            {alert.change >= 0 ? "+" : ""}{alert.change.toFixed(2)}%
                                                        </span>
                                                    )}
                                                    {alert.sentiment && (
                                                        <span className="text-[10px] text-slate-500 font-medium">{alert.sentiment}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reason */}
                                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{alert.reason}</p>

                                            {/* Click to view CTA */}
                                            <span className="text-[10px] text-slate-600 group-hover:text-emerald-500 transition-colors font-black uppercase tracking-widest">
                                                View Chart →
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/5 bg-slate-900/40 shrink-0">
                        <Link
                            to="/ai"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors"
                        >
                            Manage Watchlist in AI Dashboard →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WatchlistBell;
