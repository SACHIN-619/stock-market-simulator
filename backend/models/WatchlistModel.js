import mongoose, { Schema, model } from "mongoose";

// ──────────────────────────────────────────────
// WATCHLIST ITEM SCHEMA
// One document per (user, symbol) pair.
// Stores the last known AI signal so we can detect changes.
// ──────────────────────────────────────────────
const watchlistSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        // Last known AI signal — used to detect changes
        lastSignal: {
            type: String,
            enum: ["BUY", "SELL", "HOLD", "WATCH", null],
            default: null,
        },
        // Last AI reasoning for this ticker
        lastReason: {
            type: String,
            default: "",
        },
        // Last sentiment label
        lastSentiment: {
            type: String,
            enum: ["BULLISH", "NEUTRAL", "BEARISH", null],
            default: null,
        },
        // When we last polled this symbol
        lastChecked: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ── Compound index: each user can only watch a symbol once
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const watchlistModel =
    mongoose.models.watchlist || model("watchlist", watchlistSchema);
