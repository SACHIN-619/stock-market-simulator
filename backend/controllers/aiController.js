import { userModel } from "../models/UserModel.js";
import { transactionModel } from "../models/transactionModel.js";
import { stockModel } from "../models/StockModel.js";
import { analyzePortfolioWithAI } from "../services/ai/aiPortfolioAnalyzer.js";
import { generateStructuredJSON } from "../services/ai/aiGeminiService.js";
import { getCachedAIResponse, setCachedAIResponse } from "../services/ai/aiCacheService.js";
import { calculateUserMetrics } from "../services/metricsService.js";
import axios from "axios";

// ──────────────────────────────────────────────
// GET AI SUGGESTIONS — Full portfolio analysis
// ──────────────────────────────────────────────
export const getAiSuggestions = async (req, res) => {
    try {
        console.log("AI Controller: suggestion request for user:", req.user.id);

        const userId = req.user.id;

        // ── CACHE CHECK ──
        const cached = getCachedAIResponse(userId);
        if (cached) {
            console.log("AI Controller: returning cached response");
            return res.status(200).json({ success: true, payload: cached, cached: true });
        }

        // ── FETCH REAL USER DATA ──
        const user = await userModel.findById(userId).select("-password").lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // ── FETCH REAL TRANSACTIONS ──
        const transactions = await transactionModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        // ── FETCH AVAILABLE TRADABLE STOCKS ──
        const availableStocks = await stockModel
            .find({ isActive: true })
            .select("stockSymbol companyName sector availableQuantity")
            .lean();

        // ── BUILD REAL USER PROFILE (reads actual DB fields — not hardcoded) ──
        const userProfile = {
            username: user.username,
            balance: user.walletBalance,
            riskTolerance: user.riskTolerance || "Medium",   // real field from UserModel
            timeHorizon: user.timeHorizon || "Long Term",     // real field from UserModel
            primaryGoal: user.goal || "Growth",               // real field from UserModel
            totalTrades: transactions.length,
        };

        // ── BUILD PORTFOLIO FROM REAL TRANSACTIONS ──
        // Net holdings map (BUY - SELL aggregation)
        const holdingsMap = {};
        for (const tx of transactions) {
            const sym = tx.stockSymbol;
            if (!holdingsMap[sym]) holdingsMap[sym] = { symbol: sym, netQty: 0, totalInvested: 0 };
            if (tx.transactionType === "BUY") {
                holdingsMap[sym].netQty += tx.quantity;
                holdingsMap[sym].totalInvested += tx.totalAmount;
            } else {
                holdingsMap[sym].netQty -= tx.quantity;
                holdingsMap[sym].totalInvested -= tx.totalAmount;
            }
        }

        const portfolioData = Object.values(holdingsMap)
            .filter((h) => h.netQty > 0)
            .map((h) => ({
                symbol: h.symbol,
                quantity: h.netQty,
                avgBuyPrice: h.netQty > 0 ? h.totalInvested / h.netQty : 0,
                totalInvested: h.totalInvested,
            }));

        // ── MARKET DATA (REAL-TIME FINNHUB PIPELINE) ──
        const marketData = await Promise.all(portfolioData.map(async (p) => {
            try {
                // Fetch real-time quote
                const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${p.symbol}&token=${process.env.FINNHUB_API_KEY}`);
                const data = response.data;

                const currentPrice = data.c || 0;
                const dp = data.dp || 0; // Daily percentage change

                // Heuristic RSI based on daily momentum (0 to 100)
                const rsi = Math.min(100, Math.max(0, 50 + (dp * 5)));

                // Heuristic Sentiment based on daily momentum (0 to 1)
                const sentiment = Math.min(1, Math.max(0, 0.5 + (dp / 10)));

                // Determine volatility class based on magnitude of change
                let volatility = "Medium";
                if (Math.abs(dp) > 4) volatility = "High";
                else if (Math.abs(dp) < 1) volatility = "Low";

                // ── ALPHA VANTAGE (HISTORICAL ANALYSIS) ──
                let historicalData = [];
                try {
                    const avResponse = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${p.symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
                    const avData = avResponse.data;
                    const timeSeries = avData["Time Series (Daily)"];
                    if (timeSeries) {
                        // Get last 3 days to keep it small
                        historicalData = Object.entries(timeSeries).slice(0, 3).map(([date, values]) => ({
                            date,
                            close: values["4. close"],
                        }));
                    }
                } catch (avErr) {
                    console.error(`Alpha Vantage failed for ${p.symbol}:`, avErr.message);
                }

                return {
                    symbol: p.symbol,
                    currentPrice,
                    rsi: Number(rsi.toFixed(2)),
                    sentiment: Number(sentiment.toFixed(2)),
                    volatility,
                    historicalPrices: historicalData,
                    note: `Real-time Finnhub + Alpha Vantage (dp: ${dp.toFixed(2)}%)`,
                };
            } catch (err) {
                console.error(`Failed to fetch market data for ${p.symbol}:`, err.message);
                return {
                    symbol: p.symbol,
                    currentPrice: p.avgBuyPrice, // Fallback
                    rsi: 50,
                    sentiment: 0.5,
                    volatility: "Medium",
                    historicalPrices: [],
                    note: "Fallback data (API error)",
                };
            }
        }));

        // ── UNIFIED PORTFOLIO PERFORMANCE METRICS ──
        const currentPrices = {};
        for (const m of marketData) {
            currentPrices[m.symbol] = m.currentPrice;
        }
        const performanceMetrics = calculateUserMetrics(user, transactions, currentPrices);

        // ── AI ANALYSIS ──
        const aiResult = await analyzePortfolioWithAI({
            userProfile,
            portfolioData,
            marketData,
            performanceMetrics,
            availableStocks,
        });

        // Detect if AI returned real data vs fallback (fallback has confidenceScore=0 and empty tradeSignals)
        const isRealAIResponse = aiResult.confidenceScore > 0 || (aiResult.tradeSignals && aiResult.tradeSignals.length > 0);

        // ── CACHE RESULT (only if AI gave a real response, not a fallback) ──
        setCachedAIResponse(userId, aiResult, isRealAIResponse);

        // ── BUILD COMPATIBILITY SHIM (supports both AiSuggestions.jsx + AICommandCenter.jsx) ──
        const payload = {
            ...aiResult,
            // Expose the raw quantitative metrics directly for advanced features
            performanceMetrics: {
                totalProfit: performanceMetrics.totalProfit,
                roi: performanceMetrics.roi,
                winRate: performanceMetrics.winRate,
                sharpeRatio: performanceMetrics.sharpeRatio,
                sortinoRatio: performanceMetrics.sortinoRatio,
                diversificationScore: performanceMetrics.diversificationScore,
                concentrationRisk: performanceMetrics.concentrationRisk,
                tradeVolatility: performanceMetrics.tradeVolatility,
                consistencyScore: performanceMetrics.consistencyScore,
                activityScore: performanceMetrics.activityScore,
                compositeScore: performanceMetrics.compositeScore,
            },
            // Legacy fields for AiSuggestions.jsx
            summary: aiResult.executiveSummary,
            riskWarning: aiResult.riskAnalysis?.warning || "",
            traderScore: performanceMetrics.compositeScore, // unified score
            marketSentiment: aiResult.marketSentiment?.label || "NEUTRAL",  // string for old page
            portfolioHealth: {
                diversificationScore: performanceMetrics.diversificationScore, // unified diversification
                concentrationRisk: performanceMetrics.concentrationRisk,
            },
            suggestions: aiResult.suggestions || [],
            // Keep the nested object too for AICommandCenter.jsx
            marketSentimentData: aiResult.marketSentiment,
        };

        return res.status(200).json({ success: true, payload });

    } catch (err) {
        console.error("AI Controller ERROR:", err.message);
        return res.status(500).json({
            success: false,
            message: "AI analysis failed. Please try again shortly.",
        });
    }
};


export const getWatchlistInsights = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await userModel.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const prompt = `
You are the Alpha-Insight Engine.
Generate a watchlist of 3-5 stocks that are suitable for this user based on their profile.

TRADER PROFILE:
${JSON.stringify({ riskTolerance: user.riskTolerance, goal: user.goal }, null, 2)}

Provide the output in the following JSON schema:
{
  "payload": [
    {
      "symbol": "string",
      "sentiment": "BULLISH | NEUTRAL | BEARISH",
      "currentPrice": 0,
      "predictedMove": 0,
      "reasoning": "string"
    }
  ]
}
Return ONLY valid JSON.
`;

        const parsed = await generateStructuredJSON(prompt);

        return res.status(200).json({ success: true, payload: parsed.payload || [] });

    } catch (err) {
        console.error("Watchlist AI Controller ERROR:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate watchlist insights.",
        });
    }
};