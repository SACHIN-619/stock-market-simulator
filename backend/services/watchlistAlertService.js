import axios from "axios";
import { watchlistModel } from "../models/WatchlistModel.js";

// ──────────────────────────────────────────────
// WATCHLIST ALERT POLLING SERVICE
//
// Every 3 minutes this service:
//  1. Loads every watchlist item from the DB
//  2. Fetches a quick quote + RSI from Finnhub / Alpha Vantage
//  3. Derives a simple AI signal (BUY/SELL/HOLD/WATCH)
//  4. Compares to the last known signal for that user+symbol
//  5. If the signal CHANGED → emits a socket alert to that specific user
// ──────────────────────────────────────────────

const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

// ── Finnhub quote ──
const fetchQuote = async (symbol) => {
    try {
        const res = await axios.get("https://finnhub.io/api/v1/quote", {
            params: { symbol, token: process.env.FINNHUB_API_KEY },
            timeout: 5000,
        });
        return res.data; // { c, d, dp, h, l, o, pc }
    } catch {
        return null;
    }
};

// ── Derive a lightweight signal from quote data ──
// BUY  → price up >2% today
// SELL → price down >2% today  
// HOLD → price in -2% to +2% range
// WATCH → no data
const deriveSignal = (quote) => {
    if (!quote || quote.c == null) return { signal: "WATCH", reason: "No market data available.", sentiment: "NEUTRAL" };

    const dp = quote.dp ?? 0;       // day change %
    const c  = quote.c;             // current price
    const pc = quote.pc ?? c;       // prev close

    let signal = "HOLD";
    let sentiment = "NEUTRAL";
    let reason = "";

    if (dp >= 3) {
        signal = "BUY";
        sentiment = "BULLISH";
        reason = `Strong momentum: +${dp.toFixed(2)}% today. Price at $${c.toFixed(2)}, up from $${pc.toFixed(2)}. Breakout potential detected.`;
    } else if (dp >= 1.5) {
        signal = "BUY";
        sentiment = "BULLISH";
        reason = `Moderate upswing: +${dp.toFixed(2)}% today. Bullish short-term pressure. Consider entry on volume confirmation.`;
    } else if (dp <= -3) {
        signal = "SELL";
        sentiment = "BEARISH";
        reason = `Significant decline: ${dp.toFixed(2)}% today. Selling pressure dominates. Consider reducing exposure.`;
    } else if (dp <= -1.5) {
        signal = "SELL";
        sentiment = "BEARISH";
        reason = `Moderate pullback: ${dp.toFixed(2)}%. Watch for support levels. Stop-loss review recommended.`;
    } else {
        signal = "HOLD";
        sentiment = dp >= 0 ? "NEUTRAL" : "NEUTRAL";
        reason = `Price stable at $${c.toFixed(2)} (${dp >= 0 ? "+" : ""}${dp.toFixed(2)}% today). No directional signal. Monitor for breakout.`;
    }

    return { signal, reason, sentiment };
};

// ── Main polling function ──
const pollWatchlistSignals = async (io, userSocketMap) => {
    try {
        // Load all watchlist items across all users
        const allItems = await watchlistModel.find({}).lean();

        if (!allItems.length) return;

        // Group by symbol to batch API calls
        const symbols = [...new Set(allItems.map(i => i.symbol))];

        // Fetch quotes in parallel (rate limit friendly: Finnhub free = 60 req/min)
        const quotes = await Promise.all(symbols.map(s => fetchQuote(s)));
        const quoteMap = {};
        symbols.forEach((s, i) => { quoteMap[s] = quotes[i]; });

        // Process each watchlist item
        for (const item of allItems) {
            const quote = quoteMap[item.symbol];
            const { signal, reason, sentiment } = deriveSignal(quote);
            const previousSignal = item.lastSignal;

            // Always update the DB with latest signal
            await watchlistModel.findByIdAndUpdate(item._id, {
                lastSignal: signal,
                lastReason: reason,
                lastSentiment: sentiment,
                lastChecked: new Date(),
            });

            // ── SIGNAL CHANGE DETECTED → push alert ──
            if (previousSignal && previousSignal !== signal) {
                const userId = item.userId.toString();
                const socketId = userSocketMap.get(userId);

                if (socketId) {
                    const alertPayload = {
                        type: "WATCHLIST_ALERT",
                        symbol: item.symbol,
                        previousSignal,
                        newSignal: signal,
                        sentiment,
                        reason,
                        price: quote?.c ?? null,
                        change: quote?.dp ?? null,
                        timestamp: new Date().toISOString(),
                        // Direct link to stock detail page
                        link: `/stocks/${item.symbol}`,
                    };

                    io.to(socketId).emit("watchlistAlert", alertPayload);
                    console.log(`[Watchlist] Alert → User ${userId}: ${item.symbol} ${previousSignal} → ${signal}`);
                }
            }
        }
    } catch (err) {
        console.error("[Watchlist Poller] Error:", err.message);
    }
};

// ──────────────────────────────────────────────
// START THE POLLING SERVICE
// Call this once from socketServer.js, pass io + userSocketMap
// ──────────────────────────────────────────────
export const startWatchlistAlertService = (io, userSocketMap) => {
    console.log("[Watchlist] Alert service started (polling every 3 minutes)");

    // Initial poll after 30 seconds (let the server settle)
    setTimeout(() => pollWatchlistSignals(io, userSocketMap), 30_000);

    // Then every 3 minutes
    setInterval(() => pollWatchlistSignals(io, userSocketMap), POLL_INTERVAL_MS);
};
