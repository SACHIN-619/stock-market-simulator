import { watchlistModel } from "../models/WatchlistModel.js";
import { stockModel } from "../models/StockModel.js";
import { validateStockSymbol } from "../services/finnhubService.js";

// ──────────────────────────────────────────────
// GET  /api/watchlist
// Returns all watchlist items for the logged-in user
// ──────────────────────────────────────────────
export const getWatchlist = async (req, res) => {
    try {
        const items = await watchlistModel
            .find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json({ success: true, data: items });
    } catch (err) {
        console.error("Watchlist GET error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to fetch watchlist." });
    }
};

// ──────────────────────────────────────────────
// POST /api/watchlist
// Add a ticker to the watchlist (idempotent — duplicate returns existing)
// ──────────────────────────────────────────────
export const addToWatchlist = async (req, res) => {
    try {
        const { symbol } = req.body;

        if (!symbol || typeof symbol !== "string") {
            return res.status(400).json({ success: false, message: "incorrect symbol name" });
        }

        const clean = symbol.trim().toUpperCase();
        if (!/^[A-Z.]{1,10}$/.test(clean)) {
            return res.status(400).json({ success: false, message: "incorrect symbol name" });
        }

        // Check if stock exists in our database stockModel (must be active too)
        const stockExists = await stockModel.findOne({ stockSymbol: clean, isActive: true });
        if (!stockExists) {
            // Differentiate between 'incorrect symbol' and 'not listed in application'
            let companyData = null;
            try {
                companyData = await validateStockSymbol(clean);
            } catch (err) {
                console.error("Finnhub validation failed inside watchlist:", err.message);
            }

            if (!companyData || !companyData.name || companyData.rateLimited) {
                // If it is invalid or rate-limited/failed, throw incorrect symbol name
                return res.status(400).json({ success: false, message: "incorrect symbol name" });
            }

            // If it exists in Finnhub but not in our database stockModel
            return res.status(400).json({ success: false, message: "this stocks is not listed in StockKing" });
        }

        // upsert — safe to call multiple times
        const item = await watchlistModel.findOneAndUpdate(
            { userId: req.user.id, symbol: clean },
            { $setOnInsert: { userId: req.user.id, symbol: clean } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({ success: true, data: item, message: `${clean} added to watchlist.` });
    } catch (err) {
        console.error("Watchlist ADD error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to add to watchlist." });
    }
};

// ──────────────────────────────────────────────
// DELETE /api/watchlist/:symbol
// Remove a ticker from the watchlist
// ──────────────────────────────────────────────
export const removeFromWatchlist = async (req, res) => {
    try {
        const symbol = req.params.symbol?.trim().toUpperCase();
        if (!symbol) {
            return res.status(400).json({ success: false, message: "symbol param required." });
        }

        const result = await watchlistModel.findOneAndDelete({ userId: req.user.id, symbol });
        if (!result) {
            return res.status(404).json({ success: false, message: `${symbol} not in watchlist.` });
        }

        return res.status(200).json({ success: true, message: `${symbol} removed from watchlist.` });
    } catch (err) {
        console.error("Watchlist REMOVE error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to remove from watchlist." });
    }
};

// ──────────────────────────────────────────────
// DELETE /api/watchlist
// Clear entire watchlist for the user
// ──────────────────────────────────────────────
export const clearWatchlist = async (req, res) => {
    try {
        await watchlistModel.deleteMany({ userId: req.user.id });
        return res.status(200).json({ success: true, message: "Watchlist cleared." });
    } catch (err) {
        console.error("Watchlist CLEAR error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to clear watchlist." });
    }
};
