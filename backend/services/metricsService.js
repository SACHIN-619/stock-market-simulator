/**
 * Unified Quantitative Performance Metrics Service
 * 
 * Computes portfolio metrics (ROI, Volatility, Sharpe/Sortino Ratios, 
 * HHI Diversification, Win Rate, and the composite Leaderboard Score)
 * using the user's chronological transaction history and current prices.
 */

export const calculateUserMetrics = (user, transactions, currentPrices) => {
    const initialBalance = 100000;
    const walletBalance = user.walletBalance || 0;

    // 1. Reconstruct current holdings and track realized trades chronologically
    const holdings = {}; // stockSymbol -> { qty, totalInvested, avgBuyPrice }
    const closedTrades = []; // list of percentage returns for each sell transaction

    // Sort transactions chronologically
    const sortedTx = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    for (const tx of sortedTx) {
        const symbol = tx.stockSymbol;
        const qty = tx.quantity;
        const price = tx.pricePerShare;
        const type = tx.transactionType;

        if (type === "BUY") {
            if (!holdings[symbol]) {
                holdings[symbol] = { qty: 0, totalInvested: 0, avgBuyPrice: 0 };
            }
            const h = holdings[symbol];
            h.qty += qty;
            h.totalInvested += qty * price;
            h.avgBuyPrice = h.totalInvested / h.qty;
        } else if (type === "SELL") {
            if (holdings[symbol] && holdings[symbol].qty > 0) {
                const h = holdings[symbol];
                const soldQty = Math.min(qty, h.qty);
                const avgBuyPrice = h.avgBuyPrice;

                // Realized trade return percent
                const tradeReturnPercent = ((price - avgBuyPrice) / avgBuyPrice) * 100;
                closedTrades.push({
                    symbol,
                    qty: soldQty,
                    buyPrice: avgBuyPrice,
                    sellPrice: price,
                    returnPercent: tradeReturnPercent,
                    profitValue: soldQty * (price - avgBuyPrice)
                });

                // Update holdings
                h.qty -= soldQty;
                h.totalInvested = h.qty * avgBuyPrice;
                if (h.qty === 0) {
                    delete holdings[symbol];
                }
            }
        }
    }

    // 2. Portfolio Value
    let portfolioValue = 0;
    for (const [symbol, h] of Object.entries(holdings)) {
        if (h.qty > 0) {
            const currentPrice = currentPrices[symbol] || h.avgBuyPrice || 0;
            portfolioValue += h.qty * currentPrice;
        }
    }

    const totalProfit = portfolioValue + walletBalance - initialBalance;
    const roi = (totalProfit / initialBalance) * 100;

    // 3. True Win Rate
    const totalSells = closedTrades.length;
    const profitableSells = closedTrades.filter(t => t.returnPercent > 0).length;
    const winRate = totalSells > 0 ? (profitableSells / totalSells) * 100 : 0;

    // 4. Sharpe & Sortino (trade-based)
    let sharpeRatio = 0;
    let sortinoRatio = 0;
    let tradeVolatility = 0;
    let avgTradeReturn = 0;

    if (totalSells > 0) {
        const returns = closedTrades.map(t => t.returnPercent);
        const sum = returns.reduce((a, b) => a + b, 0);
        avgTradeReturn = sum / totalSells;

        if (totalSells >= 2) {
            // Standard Deviation
            const variance = returns.reduce((a, b) => a + Math.pow(b - avgTradeReturn, 2), 0) / (totalSells - 1);
            tradeVolatility = Math.sqrt(variance);

            // Downside Deviation (deviations below 0%)
            const negativeReturns = returns.filter(r => r < 0);
            const downsideSum = negativeReturns.reduce((a, b) => a + Math.pow(b, 2), 0);
            const downsideVolatility = Math.sqrt(downsideSum / totalSells);

            sharpeRatio = tradeVolatility > 0 ? avgTradeReturn / tradeVolatility : 0;
            sortinoRatio = downsideVolatility > 0 ? avgTradeReturn / downsideVolatility : (avgTradeReturn > 0 ? 10 : 0);
        } else {
            // Fallback for single closed trade
            tradeVolatility = 0;
            sharpeRatio = avgTradeReturn > 0 ? 1 : (avgTradeReturn < 0 ? -1 : 0);
            sortinoRatio = avgTradeReturn > 0 ? 1 : (avgTradeReturn < 0 ? -1 : 0);
        }
    }

    // 5. Diversification Score (Herfindahl-Hirschman Index HHI)
    let diversificationScore = 0;
    let concentrationRisk = "HIGH";
    if (portfolioValue > 0) {
        let hhi = 0;
        let largestWeight = 0;
        for (const [symbol, h] of Object.entries(holdings)) {
            const currentPrice = currentPrices[symbol] || h.avgBuyPrice || 0;
            const value = h.qty * currentPrice;
            const weight = value / portfolioValue;
            hhi += Math.pow(weight, 2);
            if (weight > largestWeight) {
                largestWeight = weight;
            }
        }
        diversificationScore = (1 - hhi) * 100;
        concentrationRisk = largestWeight > 0.5 ? "HIGH" : largestWeight > 0.3 ? "MEDIUM" : "LOW";
    } else {
        // Cash-only portfolio is technically concentrated in cash, but in terms of stock risk, it is low.
        diversificationScore = 0;
        concentrationRisk = "LOW";
    }

    // 6. Scoring Components
    // ROI Score (smooth double-sigmoid curve)
    let roiScore = 0;
    if (roi >= 0) {
        roiScore = 50 + 50 * (1 - Math.exp(-0.03 * roi));
    } else {
        roiScore = 50 * Math.exp(0.03 * roi);
    }

    // Sharpe Ratio Score
    // If they have never sold, they have no realized Sharpe ratio. Set to a lower baseline (20)
    // so inactive or buy-only users do not gain a default-neutral (50) point advantage over active traders.
    const sharpeScore = totalSells > 0
        ? Math.min(100, Math.max(0, 50 + sharpeRatio * 20))
        : (transactions.length > 0 ? 20 : 0);

    // Win Rate Score
    const winRateScore = winRate; // 0 to 100

    // Diversification Score
    const divScore = diversificationScore;

    // Activity Score
    const totalTrades = transactions.length;
    const activityScore = Math.min(100, totalTrades * 2);

    // Composite Performance Score
    let compositeScore = Math.round(
        roiScore * 0.40 +
        sharpeScore * 0.25 +
        winRateScore * 0.20 +
        divScore * 0.15
    );

    // Inactive traders who have never made a trade get 0!
    if (totalTrades === 0) {
        compositeScore = 0;
    }

    // Consistency score (volatility penalty)
    const consistencyScore = totalSells > 0 ? Math.max(0, 100 - tradeVolatility) : 0;

    return {
        totalProfit,
        roi,
        winRate,
        sharpeRatio,
        sortinoRatio,
        diversificationScore,
        concentrationRisk,
        tradeVolatility,
        consistencyScore,
        activityScore,
        compositeScore,
        holdings: Object.entries(holdings).map(([symbol, h]) => ({
            symbol,
            quantity: h.qty,
            avgBuyPrice: h.avgBuyPrice,
            totalValue: h.qty * (currentPrices[symbol] || h.avgBuyPrice || 0)
        }))
    };
};
