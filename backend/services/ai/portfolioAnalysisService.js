export const calculatePortfolioHealth = (portfolioData) => {

    if (!portfolioData || !portfolioData.length) {
        return {
            diversificationScore: 0,
            concentrationRisk: "HIGH",
        };
    }

    // Use totalInvested (the actual field in portfolio data objects)
    const total = portfolioData.reduce(
        (acc, item) => acc + (item.totalInvested || item.total || 0),
        0
    );

    if (!total || total === 0) {
        return {
            diversificationScore: 0,
            concentrationRisk: "HIGH",
        };
    }

    const biggestPosition = Math.max(
        ...portfolioData.map((p) => p.totalInvested || p.total || 0)
    );

    const concentration = (biggestPosition / total) * 100;

    return {
        diversificationScore: Math.max(0, 100 - concentration),
        concentrationRisk:
            concentration > 50 ? "HIGH"
            : concentration > 30 ? "MEDIUM"
            : "LOW",
    };
};