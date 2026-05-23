import { generateText } from "./aiGeminiService.js";
import { getUserMemory, saveUserMemory, saveAIResponse } from "./aiMemoryService.js";

// ──────────────────────────────────────────────
// GENERATE AI CHAT RESPONSE
// ──────────────────────────────────────────────
export const generateAIChatResponse = async ({
    userId,
    message,
    userProfile = {},
    portfolioData = [],
    marketData    = [],
    marketTrends = [],
    performanceMetrics = {},
}) => {
    try {
        // Persist user message first
        saveUserMemory(userId, message);

        // Retrieve recent conversation context (last 20 turns)
        const memory = getUserMemory(userId);
        const conversationContext = memory
            .map((m) => `${m.role === "user" ? "Trader" : "Alpha-Insight"}: ${m.content}`)
            .join("\n");

        // ── Build news digest ──
        const newsDigest = marketData
            .filter((m) => m.recentNews && m.recentNews.length > 0)
            .map((m) => {
                const headlines = m.recentNews
                    .map((n) => `  • [${n.source}] ${n.headline}`)
                    .join("\n");
                return `${m.symbol}:\n${headlines}`;
            })
            .join("\n\n");

        // ── Build live market snapshot ──
        const marketSnapshot = marketData
            .map((m) => {
                const price  = m.currentPrice != null ? `$${m.currentPrice.toFixed(2)}` : "N/A";
                const chg    = m.changePercent != null ? `${m.changePercent > 0 ? "+" : ""}${m.changePercent.toFixed(2)}%` : "N/A";
                const rsi    = m.rsi14 != null ? m.rsi14.toFixed(1) : "N/A";
                return `${m.symbol}: Price=${price} | Change=${chg} | RSI(14)=${rsi}`;
            })
            .join("\n");

        const prompt = `
You are **Alpha-Insight AI** — an institutional-grade financial trading assistant integrated into a premium stock market simulator. 

═══════════════════════════════
EXECUTIVE STRATEGY FOR ${userProfile.username}
═══════════════════════════════
- Target: ${userProfile.goal}
- Risk: ${userProfile.riskTolerance}
- Cash Position: High (94%) - Focus on deployment strategies.

═══════════════════════════════
SYSTEM RULES & TONE
═══════════════════════════════
1. **Persona**: Professional, data-driven, yet encouraging. You are a mentor to the trader.
2. **Focus**: Respond ONLY about trading, finance, stocks, market analysis, risk, and portfolio strategy.
3. **Personalization**: Always reference the trader's name (${userProfile.username}), their **Risk Tolerance** (${userProfile.riskTolerance}), and **Goal** (${userProfile.goal}) in your advice.
4. **Actionable Insights**: Provide clear recommendations (Buy/Sell/Hold) with specific data-backed reasoning.
5. **Format**: Use **bold** for symbols ($AAPL), numbers, and key terms. Use bullet points (- ) and headings (## ).
6. **Live Data**: Reference the RSI, real-time prices, and news provided below. If data is missing for a ticker, mention it professionally.
7. **Constraints**: Maximum 4 paragraphs. Never hallucinate. Warn about risks prominently.
8. **Performance Metrics Integration**: Proactively reference and analyze the user's unified **ROI**, **Sharpe Ratio**, **Sortino Ratio**, **Win Rate**, **Diversification HHI**, and **Composite Leaderboard Score** provided in the TRADER PERFORMANCE METRICS section. Answer their questions accurately regarding these metrics.

═══════════════════════════════
TRADER PROFILE (LIVE)
═══════════════════════════════
- Name:           ${userProfile.username}
- Account Balance: ${userProfile.balance != null ? "$" + Number(userProfile.balance).toLocaleString() : "N/A"}
- Risk Profile:    **${userProfile.riskTolerance}**
- Investment Goal: **${userProfile.goal}**
- Time Horizon:    **${userProfile.timeHorizon}**
- Total Positions: ${userProfile.totalHoldings}

═══════════════════════════════
TRADER PERFORMANCE METRICS (UNIFIED CALCULATIONS)
═══════════════════════════════
- Total Profit: ${performanceMetrics.totalProfit != null ? "$" + Number(performanceMetrics.totalProfit.toFixed(2)).toLocaleString() : "N/A"}
- Percentage ROI: ${performanceMetrics.roi != null ? performanceMetrics.roi.toFixed(2) + "%" : "N/A"}
- True Win Rate: ${performanceMetrics.winRate != null ? performanceMetrics.winRate.toFixed(1) + "%" : "N/A"}
- Realized Sharpe Ratio: ${performanceMetrics.sharpeRatio != null ? performanceMetrics.sharpeRatio.toFixed(2) : "N/A"}
- Realized Sortino Ratio: ${performanceMetrics.sortinoRatio != null ? performanceMetrics.sortinoRatio.toFixed(2) : "N/A"}
- Diversification Score: ${performanceMetrics.diversificationScore != null ? performanceMetrics.diversificationScore.toFixed(0) + "/100" : "N/A"}
- Concentration Risk: ${performanceMetrics.concentrationRisk || "N/A"}
- Volatility Penalty Score: ${performanceMetrics.tradeVolatility != null ? performanceMetrics.tradeVolatility.toFixed(2) + "%" : "N/A"}
- Composite Leaderboard Score: ${performanceMetrics.compositeScore || "N/A"}

═══════════════════════════════
PORTFOLIO SNAPSHOT
═══════════════════════════════
${portfolioData.length > 0 ? JSON.stringify(portfolioData, null, 2) : "Currently holding no active positions."}

═══════════════════════════════
LIVE MARKET INTELLIGENCE
═══════════════════════════════
${marketSnapshot || "No live market data available at this moment."}

═══════════════════════════════
RECENT NEWS (GLOBAL & SYMBOL)
═══════════════════════════════
${newsDigest || "No recent news headlines found."}

═══════════════════════════════
CONVERSATION CONTEXT
═══════════════════════════════
${conversationContext || "Fresh session started."}


═══════════════════════════════
GLOBAL MARKET CONTEXT (NON-PORTFOLIO)
═══════════════════════════════
${marketTrends.length > 0 ? marketTrends.join("\n") : "General market sentiment is mixed."}
Use the above headlines to suggest potential opportunities if the user asks for new stocks.

═══════════════════════════════
TRADER'S INQUIRY
═══════════════════════════════
"${message}"

Respond as Alpha-Insight AI (Markdown):`;

        const text = await generateText(prompt);

        if (!text) {
            return "AI conversation engine is temporarily unavailable. Please try again shortly.";
        }

        // Persist AI response
        saveAIResponse(userId, text);

        return text;

    } catch (err) {
        console.error("AI Conversation error:", err.message);
        return "AI conversation engine is temporarily unavailable. Please try again shortly.";
    }
};