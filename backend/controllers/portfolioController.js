import axios from "axios";
import { transactionModel } from "../models/transactionModel.js";
import { userModel } from "../models/UserModel.js";

// GET USER PORTFOLIO
export const getPortfolio = async (req, res, next) => {
  try {
    // Get logged-in user
    const userId = req.user.id;
    
    // Fetch user for wallet balance
    const user = await userModel.findById(userId);
    const walletBalance = user ? user.walletBalance : 0;

    // 2. Fetch all transactions of user in chronological order
    const transactions = await transactionModel
      .find({ userId })
      .sort({ createdAt: 1 });

    // 3. Build portfolio object
    const portfolio = {};

    transactions.forEach((tx) => {
      const symbol = tx.stockSymbol;

      // Initialize stock entry
      if (!portfolio[symbol]) {
        portfolio[symbol] = {
          stockSymbol: symbol,
          ownedQuantity: 0,
          totalInvestment: 0,
        };
      }

      // Handle BUY
      if (tx.transactionType === "BUY") {
        portfolio[symbol].ownedQuantity += tx.quantity;
        portfolio[symbol].totalInvestment +=
          tx.quantity * tx.pricePerShare;
      }

      // Handle SELL
      else if (tx.transactionType === "SELL") {
        // Calculate average cost before this sell to maintain correct basis
        const avgCost = portfolio[symbol].totalInvestment / portfolio[symbol].ownedQuantity;
        portfolio[symbol].ownedQuantity -= tx.quantity;
        portfolio[symbol].totalInvestment -= tx.quantity * avgCost;

        // Prevent floating-point math drift when fully sold
        if (portfolio[symbol].ownedQuantity <= 0) {
            portfolio[symbol].ownedQuantity = 0;
            portfolio[symbol].totalInvestment = 0;
        }
      }
    });

    // 4. Keep only stocks with quantity > 0
    const filteredPortfolio = Object.values(portfolio)
      .filter((stock) => stock.ownedQuantity > 0);

    // 5. Fetch live prices + compute metrics
    await Promise.all(
      filteredPortfolio.map(async (stock) => {
        const response = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${stock.stockSymbol}&token=${process.env.FINNHUB_API_KEY}`
        );

        stock.currentPrice = response.data.c;

        // Current total value
        stock.currentValue =
          stock.currentPrice * stock.ownedQuantity;

        // Avg buy price
        stock.avgPrice =
          stock.totalInvestment / stock.ownedQuantity;

        // Profit / Loss
        stock.profitLoss =
          stock.currentValue - stock.totalInvestment;

        // Profit %
        stock.profitPercent =
          (stock.profitLoss / stock.totalInvestment) * 100;
      })
    );

    // 6. Portfolio summary
    let totalInvestment = 0;
    let totalCurrentValue = 0;

    filteredPortfolio.forEach((stock) => {
      totalInvestment += stock.totalInvestment;
      totalCurrentValue += stock.currentValue;
    });

    const totalProfit =
      (totalCurrentValue + walletBalance) - 100000;

    // 7. Send response
    res.status(200).json({
      message: "User Portfolio",
      summary: {
        totalInvestment,
        totalCurrentValue,
        totalProfit,
        walletBalance,
      },
      payload: filteredPortfolio,
    });

  } catch (error) {
    next(error);
  }
};
