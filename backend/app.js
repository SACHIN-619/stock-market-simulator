import exp from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRouter from "./routes/authRoute.js";
import stockRouter from "./routes/stockRoute.js";
import transactionRouter from "./routes/transactionRoute.js";
import portfolioRouter from "./routes/portfolioRoute.js";
import alertRouter from "./routes/alertRoute.js";
import historicalRouter from "./routes/historicalRoute.js";
import userRouter from "./routes/userRoute.js";
import aiRouter from "./routes/aiRoute.js";
import aiChatRouter from "./routes/aiChatRoute.js";
import adminActivityRouter from "./routes/adminActivityRoute.js";
import leaderboardApp from "./routes/leaderboardRoute.js";
import watchlistRouter from "./routes/watchlistRoute.js";

// ──────────────────────────────────────────────
// CREATE EXPRESS APP
// ──────────────────────────────────────────────
const app = exp();

// ──────────────────────────────────────────────
// SECURITY HEADERS (helmet)
// ──────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Relaxed CSP for production (allowing Vercel and any HTTPS domain)
            imgSrc: ["'self'", "data:", "http://localhost:5000", "http://127.0.0.1:5000", "https://res.cloudinary.com", "https://*.vercel.app", "https:"],
            connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000", "https://*.vercel.app", "https:"],
        }
    }
}));

// ──────────────────────────────────────────────
// BODY PARSER
// ──────────────────────────────────────────────
app.use(exp.json({ limit: "1mb" }));

// ──────────────────────────────────────────────
// COOKIE PARSER
// ──────────────────────────────────────────────
app.use(cookieParser());

// ──────────────────────────────────────────────
// CORS — Explicit origins only
// ──────────────────────────────────────────────
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
}));

// ──────────────────────────────────────────────
// STATIC UPLOADS
// ──────────────────────────────────────────────
app.use("/uploads", exp.static("uploads"));

// ──────────────────────────────────────────────
// RATE LIMITERS
// ──────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 20,
    message: { message: "Too many auth attempts. Try again in 1 minute." },
    standardHeaders: true,
    legacyHeaders: false,
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 10,
    message: { message: "AI rate limit reached. Try again in 1 minute." },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000, // Increased to 1000 to support high frequency local testing and updates without 429 blocks
    message: { message: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply general limiter to all routes
app.use(generalLimiter);

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/stocks", stockRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/alerts", alertRouter);
app.use("/api/historical", historicalRouter);
app.use("/api/users", userRouter);
app.use("/api/admin/activity", adminActivityRouter);

// AI routes — with dedicated rate limiter (Gemini API costs money)
app.use("/api/ai", aiLimiter, aiRouter);
app.use("/api/ai", aiLimiter, aiChatRouter);

// Trader leaderboard
app.use("/trader-api", leaderboardApp);

// Watchlist — real-time AI signal tracking
app.use("/api/watchlist", watchlistRouter);

// ──────────────────────────────────────────────
// 404 HANDLER
// ──────────────────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({ message: `Path ${req.url} not found` });
});

// ──────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
    // Only log full error in development
    if (process.env.NODE_ENV !== "production") {
        console.error("Error:", err);
    } else {
        console.error("Error:", err.message);
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({ message: "Validation error", error: err.message });
    }

    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid ID format", error: err.message });
    }

    const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
    const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

    if (errCode === 11000) {
        const field = Object.keys(keyValue)[0];
        const value = keyValue[field];
        return res.status(409).json({
            message: "Duplicate entry",
            error: `${field} "${value}" already exists`,
        });
    }

    res.status(500).json({ message: "Internal server error" });
});

export default app;