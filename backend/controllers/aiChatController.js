import mongoose from "mongoose";
import { userModel } from "../models/UserModel.js";
import { transactionModel } from "../models/transactionModel.js";
import { generateAIChatResponse } from "../services/ai/aiConversationService.js";
import { clearUserMemory } from "../services/ai/aiMemoryService.js";
import { calculateUserMetrics } from "../services/metricsService.js";
import axiosLib from "axios";

// ──────────────────────────────────────────────
// HELPERS — real market data from Finnhub + Alpha Vantage
// ──────────────────────────────────────────────

/** Finnhub real-time quote  →  { c, d, dp, h, l, o, pc } */
const fetchFinnhubQuote = async (symbol) => {
    try {
        const res = await axiosLib.get("https://finnhub.io/api/v1/quote", {
            params: { symbol, token: process.env.FINNHUB_API_KEY },
            timeout: 5000,
        });
        return res.data;
    } catch {
        return null;
    }
};

/** Finnhub company news — last 7 days, top 3 headlines */
const fetchFinnhubNews = async (symbol) => {
    try {
        const to = new Date().toISOString().split("T")[0];
        const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
        const res = await axiosLib.get("https://finnhub.io/api/v1/company-news", {
            params: { symbol, from, to, token: process.env.FINNHUB_API_KEY },
            timeout: 5000,
        });
        return (res.data || []).slice(0, 3).map((n) => ({
            headline: n.headline,
            source: n.source,
            summary: (n.summary || "").slice(0, 200),
        }));
    } catch {
        return [];
    }
};

/**
 * Alpha Vantage RSI (14-day, daily) — only called for top holding
 * to respect the free-tier 5 req/min cap.
 */
const fetchAlphaVantageRSI = async (symbol) => {
    try {
        const res = await axiosLib.get("https://www.alphavantage.co/query", {
            params: {
                function: "RSI",
                symbol,
                interval: "daily",
                time_period: 14,
                series_type: "close",
                apikey: process.env.ALPHA_VANTAGE_API_KEY,
            },
            timeout: 8000,
        });
        const data = res.data?.["Technical Analysis: RSI"];
        if (!data) return null;
        const latestDate = Object.keys(data)[0];
        return parseFloat(data[latestDate]?.RSI) || null;
    } catch {
        return null;
    }
};

// ──────────────────────────────────────────────
// POST /api/ai/chat — AI conversational assistant
// ──────────────────────────────────────────────
export const chatWithAI = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message } = req.body;

        // ── INPUT VALIDATION ──
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required and must be a non-empty string",
            });
        }
        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Message too long. Please keep it under 1000 characters.",
            });
        }

        const sanitizedMessage = message.trim();

        // ── FETCH USER ──
        const user = await userModel.findById(userId).select("-password").lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // ── FETCH ALL TRANSACTIONS CHRONOLOGICALLY FOR ACCURATE PERFORMANCE METRICS ──
        const allTransactions = await transactionModel
            .find({ userId })
            .sort({ createdAt: 1 })
            .lean();

        // Group holdings for portfolio snapshot (limit 50 logic for snapshot preview)
        const holdingsMap = {};
        for (const tx of allTransactions) {
            const sym = tx.stockSymbol;
            if (!holdingsMap[sym]) holdingsMap[sym] = { symbol: sym, quantity: 0, totalInvested: 0 };
            if (tx.transactionType === "BUY") {
                holdingsMap[sym].quantity += tx.quantity;
                holdingsMap[sym].totalInvested += tx.totalAmount;
            } else {
                holdingsMap[sym].quantity -= tx.quantity;
            }
        }

        // Active positions only, sorted by investment size (largest first)
        const portfolioData = Object.values(holdingsMap)
            .filter((h) => h.quantity > 0)
            .sort((a, b) => b.totalInvested - a.totalInvested)
            .map((h) => ({
                symbol: h.symbol,
                quantity: h.quantity,
                totalInvested: +h.totalInvested.toFixed(2),
            }));

        // ── FETCH REAL MARKET DATA IN PARALLEL ──
        const top3 = portfolioData.slice(0, 3);
        const top1 = portfolioData[0];

        const fetchMarketTrends = async () => {
            try {
                const res = await axiosLib.get("https://finnhub.io/api/v1/news", {
                    params: { category: "general", token: process.env.FINNHUB_API_KEY },
                    timeout: 5000,
                });
                return res.data.slice(0, 5).map(n => `[${n.source}] ${n.headline}`);
            } catch {
                return [];
            }
        };

        const [quotesArr, newsArr, topRSI, marketTrends] = await Promise.all([
            Promise.all(portfolioData.map((p) => fetchFinnhubQuote(p.symbol).catch(() => null))),
            Promise.all(top3.map((p) => fetchFinnhubNews(p.symbol).catch(() => []))),
            top1 ? fetchAlphaVantageRSI(top1.symbol).catch(() => null) : Promise.resolve(null),
            fetchMarketTrends(),
        ]);

        // ── ASSEMBLE MARKET INTELLIGENCE ──
        const marketData = portfolioData.map((p, i) => {
            const q = quotesArr[i];
            return {
                symbol: p.symbol,
                currentPrice: q?.c ?? null,
                change: q?.d ?? null,
                changePercent: q?.dp ?? null,
                dayHigh: q?.h ?? null,
                dayLow: q?.l ?? null,
                prevClose: q?.pc ?? null,
                rsi14: i === 0 ? topRSI : null,
                recentNews: i < 3 ? (newsArr[i] || []) : [],
            };
        });

        // ── UNIFIED PERFORMANCE METRICS ENGINE ──
        const currentPrices = {};
        for (const m of marketData) {
            if (m.currentPrice != null) {
                currentPrices[m.symbol] = m.currentPrice;
            }
        }
        const performanceMetrics = calculateUserMetrics(user, allTransactions, currentPrices);

        // ── USER PROFILE CONTEXT ──
        const userProfile = {
            username: user.username || "Trader",
            balance: user.walletBalance ?? null,
            riskTolerance: user.riskTolerance || "Medium",
            timeHorizon: user.timeHorizon || "Long Term",
            goal: user.goal || "Growth",
            role: user.role || "trader",
            totalHoldings: portfolioData.length,
        };

        // ── GENERATE RESPONSE ──
        const response = await generateAIChatResponse({
            userId,
            message: sanitizedMessage,
            userProfile,
            portfolioData,
            marketData,
            marketTrends,
            performanceMetrics,
        });

        return res.status(200).json({ success: true, response });

    } catch (err) {
        console.error("AI Chat Controller ERROR:", err.message);
        return res.status(500).json({
            success: false,
            message: "AI chat service temporarily unavailable. Please try again shortly.",
        });
    }
};

// ──────────────────────────────────────────────
// DELETE /api/ai/chat/clear — wipe conversation memory
// ──────────────────────────────────────────────
export const clearChatMemory = async (req, res) => {
    try {
        const userId = req.user.id;
        clearUserMemory(userId);
        return res.status(200).json({ success: true, message: "Conversation memory cleared." });
    } catch (err) {
        console.error("Clear memory error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to clear memory." });
    }
};