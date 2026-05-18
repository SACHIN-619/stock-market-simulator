import { generateStructuredJSON } from "./aiGeminiService.js";
import { buildAIPrompt } from "./aiPromptBuilder.js";
import { calculatePortfolioHealth } from "./portfolioAnalysisService.js";
import { calculateOverallSentiment } from "./sentimentService.js";

// ──────────────────────────────────────────────
// SMART DETERMINISTIC FALLBACK
// Generates meaningful data from raw portfolio without any AI call.
// Used when ALL external providers (Gemini, GROQ, HF) fail.
// ──────────────────────────────────────────────
const buildDeterministicFallback = (portfolioData, marketData, portfolioHealth, sentimentLabel) => {

    const hasPortfolio = portfolioData && portfolioData.length > 0;

    // ── Trade Signals: one per holding, derived from market data
    const tradeSignals = hasPortfolio ? portfolioData.slice(0, 5).map((holding) => {
        const mkt = marketData?.find(m => m.symbol === holding.symbol);
        const rsi = mkt?.rsi14;
        let signal = "HOLD";
        let reasoning = `${holding.symbol} is being monitored. Await confirmation signals.`;
        let rsiContext = "RSI data unavailable.";

        if (rsi != null) {
            if (rsi > 70) { signal = "SELL"; reasoning = `${holding.symbol} RSI at ${rsi.toFixed(1)} — overbought territory. Consider partial profit-taking.`; }
            else if (rsi < 35) { signal = "BUY"; reasoning = `${holding.symbol} RSI at ${rsi.toFixed(1)} — oversold. Potential accumulation opportunity.`; }
            else { reasoning = `${holding.symbol} RSI at ${rsi.toFixed(1)} — in neutral zone. Hold current position and monitor for breakout.`; }
            rsiContext = `RSI(14): ${rsi.toFixed(1)}`;
        }
        const changePercent = mkt?.changePercent;
        if (changePercent != null && Math.abs(changePercent) > 2) {
            signal = changePercent > 0 ? "BUY" : "SELL";
        }
        return {
            symbol: holding.symbol,
            signal,
            confidence: rsi != null ? Math.round(Math.abs(50 - rsi) + 40) : 45,
            reasoning,
            rsiContext,
            sentimentContext: `Sentiment: ${sentimentLabel}. Change: ${changePercent != null ? changePercent.toFixed(2) + "%" : "N/A"}`,
        };
    }) : [];

    // ── Reasoning Steps: derived from portfolio health metrics
    const reasoning = [];
    if (hasPortfolio) {
        reasoning.push({ step: "1. Concentration Analysis", finding: `Portfolio concentration risk is ${portfolioHealth.concentrationRisk}. Largest position dominates ${(100 - portfolioHealth.diversificationScore).toFixed(0)}% of holdings.`, impact: portfolioHealth.concentrationRisk === "HIGH" ? "HIGH" : "MEDIUM" });
        reasoning.push({ step: "2. Diversification Score", finding: `Diversification score: ${portfolioHealth.diversificationScore.toFixed(0)}/100. ${portfolioHealth.diversificationScore < 40 ? "Portfolio is highly concentrated — consider spreading across sectors." : "Reasonable spread across holdings detected."}`, impact: portfolioHealth.diversificationScore < 40 ? "HIGH" : "LOW" });
        reasoning.push({ step: "3. Market Sentiment", finding: `Overall market sentiment detected as ${sentimentLabel}. Align new entries with this macro trend.`, impact: "MEDIUM" });
        reasoning.push({ step: "4. Risk Assessment", finding: "Deterministic analysis active (AI providers temporarily rate-limited). Core metrics are calculated from your live transaction history.", impact: "LOW" });
    } else {
        reasoning.push({ step: "1. Portfolio Status", finding: "No active holdings detected. Deploy capital to activate full AI analysis including RSI signals, sentiment fusion, and sector rotation insights.", impact: "HIGH" });
        reasoning.push({ step: "2. Getting Started", finding: "Begin with 3–5 diversified positions across different sectors to establish a baseline for AI pattern recognition.", impact: "MEDIUM" });
    }

    // ── Watchlist: top market movers as suggested watches
    const watchlist = hasPortfolio ? portfolioData.slice(0, 3).map((holding) => {
        const mkt = marketData?.find(m => m.symbol === holding.symbol);
        const chg = mkt?.changePercent;
        return {
            symbol: holding.symbol,
            signal: chg != null ? (chg > 1 ? "BUY" : chg < -1 ? "SELL" : "WATCH") : "WATCH",
            reason: chg != null ? `${chg > 0 ? "+" : ""}${chg.toFixed(2)}% price movement detected. Monitor for sustained momentum.` : "Monitoring for volatility signals and news catalysts.",
            sentiment: sentimentLabel,
        };
    }) : [];

    return {
        executiveSummary: hasPortfolio
            ? `Deterministic portfolio analysis for ${portfolioData.length} active position(s). AI model providers are temporarily rate-limited; core metrics derived from live transaction and RSI data. Market sentiment is ${sentimentLabel}.`
            : "No active portfolio detected. Alpha-Insight is ready to analyze your holdings the moment you make your first trade. Consider a diversified entry across 3–5 sectors.",
        marketSentiment: { label: sentimentLabel, score: sentimentLabel === "BULLISH" ? 65 : sentimentLabel === "BEARISH" ? 35 : 50, reasoning: `Sentiment calculated from available market data indicators.` },
        traderScore: hasPortfolio ? Math.round(portfolioHealth.diversificationScore * 0.7 + 10) : 0,
        confidenceScore: hasPortfolio ? 38 : 0,
        riskAnalysis: {
            level: portfolioHealth.concentrationRisk === "HIGH" ? "HIGH" : portfolioHealth.concentrationRisk === "MEDIUM" ? "MODERATE" : "LOW",
            warning: portfolioHealth.concentrationRisk === "HIGH" ? "High concentration detected. Portfolio is vulnerable to single-stock risk." : "Risk levels are within acceptable parameters.",
            concentrationRisk: portfolioHealth.concentrationRisk,
        },
        portfolioScore: {
            diversification: Math.round(portfolioHealth.diversificationScore),
            riskAdjusted: hasPortfolio ? Math.round(portfolioHealth.diversificationScore * 0.75) : 0,
            concentration: portfolioHealth.concentrationRisk,
        },
        tradeSignals,
        reasoning,
        watchlist,
        suggestions: hasPortfolio ? [
            { type: "DIVERSIFY", title: "Sector Diversification", description: "Spread holdings across Tech, Healthcare, Energy, and Consumer sectors to reduce correlated drawdown risk.", impact: "HIGH" },
        ] : [
            { type: "BUY", title: "Begin Portfolio Construction", description: "Make your first trade to activate full AI-powered portfolio intelligence, including RSI signals, sentiment analysis, and risk scoring.", impact: "HIGH" },
        ],
    };
};

// ──────────────────────────────────────────────
// VALIDATE AI RESPONSE SCHEMA
// Prevents hallucinated types from reaching the frontend
// ──────────────────────────────────────────────
const validateAIResponse = (parsed) => {
    const VALID_SENTIMENTS = ["BULLISH", "NEUTRAL", "BEARISH"];
    const VALID_RISK_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
    const VALID_CONCENTRATION = ["LOW", "MEDIUM", "HIGH"];
    const VALID_SIGNALS = ["BUY", "SELL", "HOLD"];
    const VALID_IMPACTS = ["HIGH", "MEDIUM", "LOW"];

    // Clamp integers to 0–100
    const clamp = (val) => Math.max(0, Math.min(100, Number(val) || 0));

    return {
        executiveSummary: String(parsed.executiveSummary || "Analysis complete."),
        marketSentiment: {
            label: VALID_SENTIMENTS.includes(parsed.marketSentiment?.label)
                ? parsed.marketSentiment.label : "NEUTRAL",
            score: clamp(parsed.marketSentiment?.score),
            reasoning: String(parsed.marketSentiment?.reasoning || ""),
        },
        traderScore: clamp(parsed.traderScore),
        confidenceScore: clamp(parsed.confidenceScore),
        riskAnalysis: {
            level: VALID_RISK_LEVELS.includes(parsed.riskAnalysis?.level)
                ? parsed.riskAnalysis.level : "MODERATE",
            warning: String(parsed.riskAnalysis?.warning || ""),
            concentrationRisk: VALID_CONCENTRATION.includes(parsed.riskAnalysis?.concentrationRisk)
                ? parsed.riskAnalysis.concentrationRisk : "MEDIUM",
        },
        portfolioScore: {
            diversification: clamp(parsed.portfolioScore?.diversification),
            riskAdjusted: clamp(parsed.portfolioScore?.riskAdjusted),
            concentration: VALID_CONCENTRATION.includes(parsed.portfolioScore?.concentration)
                ? parsed.portfolioScore.concentration : "MEDIUM",
        },
        tradeSignals: Array.isArray(parsed.tradeSignals)
            ? parsed.tradeSignals.map((s) => ({
                symbol: String(s.symbol || ""),
                signal: VALID_SIGNALS.includes(s.signal) ? s.signal : "HOLD",
                confidence: clamp(s.confidence),
                reasoning: String(s.reasoning || ""),
                rsiContext: String(s.rsiContext || ""),
                sentimentContext: String(s.sentimentContext || ""),
            }))
            : [],
        reasoning: Array.isArray(parsed.reasoning)
            ? parsed.reasoning.map((r) => ({
                step: String(r.step || ""),
                finding: String(r.finding || ""),
                impact: VALID_IMPACTS.includes(r.impact) ? r.impact : "MEDIUM",
            }))
            : [],
        watchlist: Array.isArray(parsed.watchlist)
            ? parsed.watchlist.map((w) => ({
                symbol: String(w.symbol || ""),
                signal: [...VALID_SIGNALS, "WATCH"].includes(w.signal) ? w.signal : "WATCH",
                reason: String(w.reason || ""),
                sentiment: VALID_SENTIMENTS.includes(w.sentiment) ? w.sentiment : "NEUTRAL",
            }))
            : [],
        suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions.map((s) => ({
                type: ["BUY", "SELL", "HOLD", "RISK_WARNING", "DIVERSIFY"].includes(s.type) ? s.type : "HOLD",
                title: String(s.title || ""),
                description: String(s.description || ""),
                impact: VALID_IMPACTS.includes(s.impact) ? s.impact : "MEDIUM",
            }))
            : [],
    };
};

// ──────────────────────────────────────────────
// MAIN ANALYZER
// ──────────────────────────────────────────────
export const analyzePortfolioWithAI = async ({
    userProfile,
    portfolioData,
    marketData,
}) => {
    try {
        // Pre-compute deterministic metrics (not AI-dependent)
        const portfolioHealth = calculatePortfolioHealth(portfolioData);
        const marketSentimentLabel = calculateOverallSentiment(marketData);

        const prompt = buildAIPrompt({ userProfile, portfolioData, marketData });

        const parsed = await generateStructuredJSON(prompt);

        if (!parsed) {
            console.warn("[AI] All providers exhausted → using deterministic fallback analysis.");
            return buildDeterministicFallback(portfolioData, marketData, portfolioHealth, marketSentimentLabel);
        }

        // Validate and sanitize AI output before returning
        const validated = validateAIResponse(parsed);
        return validated;

    } catch (err) {
        console.error("AI SERVICE ERROR:", err.message);
        const portfolioHealth = calculatePortfolioHealth(portfolioData);
        const marketSentimentLabel = calculateOverallSentiment(marketData);
        return buildDeterministicFallback(portfolioData, marketData, portfolioHealth, marketSentimentLabel);
    }
};