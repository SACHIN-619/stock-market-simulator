import { userModel } from "../models/UserModel.js";
import { transactionModel } from "../models/transactionModel.js";
import { logAdminActivity } from "./adminActivityController.js";
import axios from "axios";

// Get all users with total transactions
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userModel.aggregate([
      {
        $match: { role: "trader", isDeleted: { $ne: true } } // Only fetch active traders
      },
      {
        $lookup: {
          from: "transactions", // Ensure this matches the collection name exactly
          localField: "_id",
          foreignField: "userId",
          as: "transactions"
        }
      },
      {
        $addFields: {
          totalTransactions: { $size: "$transactions" }
        }
      },
      {
        $project: {
          password: 0,
          transactions: 0 // Remove the large transactions array from output
        }
      },
      {
        $sort: { createdAt: -1 } // Sort by newest joined
      }
    ]);

    res.status(200).json({ payload: users, message: "Users fetched successfully" });
  } catch (error) {
    next(error);
  }
};

// Toggle user active status
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newStatus = !user.isUserActive;

    // Use findByIdAndUpdate to bypass pre-save validators (like username length) for older records
    await userModel.findByIdAndUpdate(userId, { isUserActive: newStatus });

    // Log Activity
    await logAdminActivity(
      req.user.id,
      "USER_STATUS",
      "USER",
      user.username,
      `Admin ${newStatus ? 'activated' : 'deactivated'} trader: ${user.username}`
    );

    res.status(200).json({
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      payload: { ...user.toObject(), isUserActive: newStatus }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optional: Also delete their transactions to clean up DB
    await transactionModel.deleteMany({ userId });
    await userModel.findByIdAndDelete(userId);

    // Log Activity
    await logAdminActivity(
      req.user.id,
      "DELETE_USER",
      "USER",
      userId,
      `Admin permanently deleted trader: ${user.username}`
    );

    res.status(200).json({ message: "User and their transactions deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get a user's transaction history
export const getUserTransactions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const transactions = await transactionModel.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ payload: transactions, message: "Transactions fetched" });
  } catch (error) {
    next(error);
  }
};

// Get a user's portfolio
export const getUserPortfolio = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await transactionModel.find({ userId }).sort({ createdAt: 1 });

    // Set default wallet balance if missing or if it's a new user with 0 transactions and 0 balance
    if (user.walletBalance === undefined || user.walletBalance === null || (user.walletBalance === 0 && transactions.length === 0)) {
      user.walletBalance = 100000;
      await user.save();
    }

    const portfolio = {};

    transactions.forEach((tx) => {
      const symbol = tx.stockSymbol;
      if (!portfolio[symbol]) {
        portfolio[symbol] = {
          stockSymbol: symbol,
          ownedQuantity: 0,
          totalInvestment: 0,
        };
      }
      if (tx.transactionType === "BUY") {
        portfolio[symbol].ownedQuantity += tx.quantity;
        portfolio[symbol].totalInvestment += tx.quantity * tx.pricePerShare;
      } else if (tx.transactionType === "SELL") {
        portfolio[symbol].ownedQuantity -= tx.quantity;
        portfolio[symbol].totalInvestment -= tx.quantity * tx.pricePerShare;
      }
    });

    const filteredPortfolio = Object.values(portfolio).filter((stock) => stock.ownedQuantity > 0);

    await Promise.all(
      filteredPortfolio.map(async (stock) => {
        try {
          const response = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${stock.stockSymbol}&token=${process.env.FINNHUB_API_KEY}`
          );
          stock.currentPrice = response.data.c || 0;
        } catch (apiError) {
          stock.currentPrice = stock.totalInvestment / stock.ownedQuantity;
        }

        stock.currentValue = stock.currentPrice * stock.ownedQuantity;
        stock.avgPrice = stock.totalInvestment / stock.ownedQuantity;
        stock.profitLoss = stock.currentValue - stock.totalInvestment;
        stock.profitPercent = stock.totalInvestment > 0 ? (stock.profitLoss / stock.totalInvestment) * 100 : 0;
      })
    );

    let totalInvestment = 0;
    let totalCurrentValue = 0;

    filteredPortfolio.forEach((stock) => {
      totalInvestment += stock.totalInvestment;
      totalCurrentValue += stock.currentValue;
    });

    // Generate dynamic growth history from transactions
    const growthHistory = [];
    if (transactions.length > 0) {
      let currentCash = 100000; // starting cash
      const holdings = {};
      const lastPrice = {};

      // Add starting baseline point (1 day before first transaction)
      const firstTxTime = new Date(transactions[0].createdAt);
      const startingTime = new Date(firstTxTime.getTime() - 24 * 60 * 60 * 1000);
      growthHistory.push({
        date: startingTime.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: 100000
      });

      transactions.forEach((tx) => {
        const symbol = tx.stockSymbol;
        lastPrice[symbol] = tx.pricePerShare;

        if (tx.transactionType === "BUY") {
          currentCash -= tx.totalAmount;
          holdings[symbol] = (holdings[symbol] || 0) + tx.quantity;
        } else if (tx.transactionType === "SELL") {
          currentCash += tx.totalAmount;
          holdings[symbol] = (holdings[symbol] || 0) - tx.quantity;
        }

        // Calculate portfolio holdings value at the time of this transaction using last recorded prices
        let holdingsValue = 0;
        Object.keys(holdings).forEach((s) => {
          holdingsValue += holdings[s] * (lastPrice[s] || 0);
        });

        const netWorth = currentCash + holdingsValue;
        growthHistory.push({
          date: new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: Math.round(netWorth * 100) / 100
        });
      });

      // Add current point with live prices
      let currentHoldingsValue = 0;
      filteredPortfolio.forEach((stock) => {
        currentHoldingsValue += stock.currentValue;
      });
      const currentNetWorth = user.walletBalance + currentHoldingsValue;
      growthHistory.push({
        date: "Today",
        value: Math.round(currentNetWorth * 100) / 100
      });
    }

    res.status(200).json({
      summary: {
        totalInvestment,
        totalCurrentValue,
        totalProfit: totalCurrentValue - totalInvestment,
        walletBalance: user.walletBalance,
      },
      payload: filteredPortfolio,
      growthHistory,
      message: "Portfolio fetched",
    });
  } catch (error) {
    next(error);
  }
};
