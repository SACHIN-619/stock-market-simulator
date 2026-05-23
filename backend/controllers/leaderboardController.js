import mongoose from "mongoose";
import { userModel } from "../models/UserModel.js";
import { transactionModel } from "../models/transactionModel.js";
import { stockCache } from "../services/cacheService.js";
import { calculateUserMetrics } from "../services/metricsService.js";

// ──────────────────────────────────────────────
// LEADERBOARD — Refactored to use Quantitative Metrics
// ──────────────────────────────────────────────
export const getLeaderboard = async (req, res) => {
    try {
        // ── STEP 1: Get all traders ──
        const traders = await userModel
            .find({ role: "trader" })
            .select("-password")
            .lean();

        if (!traders.length) {
            return res.status(200).json({ message: "Leaderboard fetched", payload: [] });
        }

        const traderIds = traders.map((t) => t._id);

        // ── STEP 2: Fetch all chronological transactions for active traders ──
        const transactions = await transactionModel
            .find({ userId: { $in: traderIds } })
            .sort({ createdAt: 1 })
            .lean();

        // ── STEP 3: Group transactions by user ──
        const userTxMap = {};
        for (const tx of transactions) {
            const uid = tx.userId.toString();
            if (!userTxMap[uid]) userTxMap[uid] = [];
            userTxMap[uid].push(tx);
        }

        // ── STEP 4: Build current price mapping for all symbols using cache ──
        const uniqueSymbols = [...new Set(transactions.map((tx) => tx.stockSymbol))];
        const currentPrices = {};
        for (const sym of uniqueSymbols) {
            const cachedPrice = stockCache.get(`stock_${sym}`)?.currentPrice;
            if (cachedPrice != null) {
                currentPrices[sym] = cachedPrice;
            }
        }

        // ── STEP 5: Calculate performance metrics per trader ──
        const leaderboard = traders.map((user) => {
            const uid = user._id.toString();
            const userTx = userTxMap[uid] || [];
            
            const metrics = calculateUserMetrics(user, userTx, currentPrices);

            const portfolioVal = metrics.holdings.reduce((sum, h) => sum + h.totalValue, 0);

            return {
                _id: user._id,
                username: user.username,
                profileImage: user.profileImage || "",
                totalProfit: Number(metrics.totalProfit.toFixed(2)),
                totalTrades: userTx.length,
                winRate: Number(metrics.winRate.toFixed(2)),
                portfolioValue: Number(portfolioVal.toFixed(2)),
                score: metrics.compositeScore,
            };
        });

        // Sort by score descending
        leaderboard.sort((a, b) => b.score - a.score);

        res.status(200).json({
            message: "Leaderboard fetched",
            payload: leaderboard,
        });

    } catch (error) {
        console.error("Leaderboard error:", error);
        res.status(500).json({ message: "Unable to fetch leaderboard" });
    }
};
