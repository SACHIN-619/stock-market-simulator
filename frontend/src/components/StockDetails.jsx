import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../service/api";

import { getSingleStock, getAllStocks, getStockDetails } from "../service/stockService";
import { buyStock, sellStock } from "../service/tradeService";

import { socket } from "../socket/socket";
import StockChart from "./StockChart";
import AdvancedChart from "./AdvancedChart";
import Skeleton from "./Skeleton";
import { useToast } from "./Toast";
import CoinIcon from "./CoinIcon";

function StockDetails() {
  const { stockSymbol } = useParams();
  const [stock, setStock] = useState(null);
  const navigate = useNavigate();

  // LIVE GRAPH STATES
  const [livePrice, setLivePrice] = useState(null);
  const [liveChartData, setLiveChartData] = useState([]);
  const [liveChartView, setLiveChartView] = useState("basic"); // basic

  // HISTORICAL STATES
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedRange, setSelectedRange] = useState("1D");
  const [showHistorical, setShowHistorical] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historicalChartView, setHistoricalChartView] = useState("basic"); // basic
  // COMPARISON STATES
  const [compareSymbol, setCompareSymbol] = useState("");
  const [compareData, setCompareData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // TRADING STATES
  // ... (rest of the states)
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState("");
  const [trading, setTrading] = useState(false);
  const [pendingTrade, setPendingTrade] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { addToast } = useToast();

  const role = sessionStorage.getItem("role");
  const historicalSectionRef = useRef(null);

  // AI MARKET PULSE POPUP STATES
  const [allStocksList, setAllStocksList] = useState([]);
  const [loadingStocksList, setLoadingStocksList] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [filterText, setFilterText] = useState("");

  // 1. FETCH STOCK DETAILS
  // ... (existing fetchStock and formatMarketCap)
  const formatMarketCap = (num) => {
    if (!num || num === 0) return "N/A";
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "T";
    if (num >= 1000) return (num / 1000).toFixed(2) + "B";
    return num.toFixed(2) + "M";
  };

  const fetchStock = async () => {
    try {
      const data = await getSingleStock(stockSymbol);
      const fetchedStock = data.payload;

      let ownedQuantity = 0;
      try {
        const portfolioRes = await api.get("/portfolio");
        const portfolio = portfolioRes.data.payload || [];
        const summary = portfolioRes.data.summary || null;
        if (summary) setWalletBalance(summary.walletBalance || 0);
        const ownedStock = portfolio.find(s => s.stockSymbol === stockSymbol);
        if (ownedStock) {
          ownedQuantity = ownedStock.ownedQuantity;
        }
      } catch (err) {
        console.log("Failed to fetch portfolio:", err);
      }

      setStock({
        ...fetchedStock,
        ownedQuantity,
        stats: {
          mktCap: formatMarketCap(fetchedStock.marketCapitalization),
          volume: fetchedStock.volume ? (fetchedStock.volume / 1000000).toFixed(2) + "M" : "12.4M",
          avgVol: "15.2M",
          high52: fetchedStock.high52 ? "$" + fetchedStock.high52 : "$142.50",
          low52: fetchedStock.low52 ? "$" + fetchedStock.low52 : "$89.20"
        }
      });
      setLivePrice(Number(fetchedStock.currentPrice).toFixed(2));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setHistoricalData([]);
    setShowHistorical(false);
    fetchStock();
  }, [stockSymbol]);

  // 2. INITIAL LIVE GRAPH
  useEffect(() => {
    if (liveChartData.length === 0 && stock?.currentPrice) {
      const dummy = [];
      const now = Date.now();
      let lastPrice = Number(stock.currentPrice);

      for (let i = 0; i < 50; i++) {
        const time = Math.floor((now - (50 - i) * 60000) / 1000);
        const open = lastPrice;
        // Smoother movement for initial data
        let movement = (Math.random() * 0.2 - 0.1);

        const close = open + movement;
        const high = Math.max(open, close) + Math.random() * 0.2;
        const low = Math.min(open, close) - Math.random() * 0.2;

        dummy.push({
          time,
          price: Number(close.toFixed(2)),
          value: Math.floor(Math.random() * 1000)
        });
        lastPrice = close;
      }
      setLiveChartData(dummy);
    }
  }, [stock]);

  // AI MARKET PULSE DATA FETCH
  const fetchAllStocksList = async () => {
    try {
      setLoadingStocksList(true);
      const data = await getAllStocks(1, "", 100);
      const allStocks = data.payload || [];
      const activeStocks = role === "trader" ? allStocks.filter(s => s.isActive) : allStocks;

      const detailedStocks = await Promise.all(
        activeStocks.map(async (stk) => {
          try {
            const details = await getStockDetails(stk.stockSymbol);
            const liveData = details.payload || {};
            const price = liveData.c || stk.currentPrice || 0;
            const changePct = liveData.dp !== undefined ? liveData.dp : 0;
            return {
              stockSymbol: stk.stockSymbol,
              companyName: stk.companyName,
              price: price,
              change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`
            };
          } catch (err) {
            console.error(`Failed to fetch details for ${stk.stockSymbol}`, err);
            return {
              stockSymbol: stk.stockSymbol,
              companyName: stk.companyName,
              price: stk.currentPrice || 0,
              change: "+0.00%"
            };
          }
        })
      );
      setAllStocksList(detailedStocks);
    } catch (error) {
      console.error("Error fetching all stocks list:", error);
    } finally {
      setLoadingStocksList(false);
    }
  };

  useEffect(() => {
    fetchAllStocksList();
  }, [stockSymbol]); // Refetch when transitioning between stocks to keep data fresh

  // 3. SOCKET LIVE UPDATES
  useEffect(() => {
    socket.on("stockUpdates", (data) => {
      let liveStock = null;
      if (Array.isArray(data)) {
        liveStock = data.find((item) => item.stockSymbol === stockSymbol);
      } else if (data?.stockSymbol === stockSymbol) {
        liveStock = data;
      }

      if (liveStock) {
        const latestPrice = Number(liveStock.currentPrice);
        setLivePrice(latestPrice.toFixed(2));
        setLiveChartData((prevData) => {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const updated = [
            ...prevData,
            {
              time: nowSeconds,
              price: Number(latestPrice.toFixed(2)),
              value: Math.floor(Math.random() * 1000)
            }
          ];
          return updated.slice(-50);
        });

        setStock(prev => prev ? { ...prev, currentPrice: latestPrice } : prev);
      }

      // Live updates for AI Market Pulse popup
      if (Array.isArray(data)) {
        setAllStocksList((prevList) => {
          return prevList.map((item) => {
            const match = data.find((d) => d.stockSymbol === item.stockSymbol);
            if (match) {
              const price = Number(match.currentPrice);
              const prevClose = Number(match.previousClose) || price;
              const diff = price - prevClose;
              const pct = prevClose ? (diff / prevClose) * 100 : 0;
              return {
                ...item,
                price: price,
                change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
              };
            }
            return item;
          });
        });
      } else if (data?.stockSymbol) {
        setAllStocksList((prevList) => {
          return prevList.map((item) => {
            if (item.stockSymbol === data.stockSymbol) {
              const price = Number(data.currentPrice);
              const prevClose = Number(data.previousClose) || price;
              const diff = price - prevClose;
              const pct = prevClose ? (diff / prevClose) * 100 : 0;
              return {
                ...item,
                price: price,
                change: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
              };
            }
            return item;
          });
        });
      }
    });

    return () => {
      socket.off("stockUpdates");
    };
  }, [stockSymbol]);

  // 4. FETCH HISTORICAL
  const fetchHistoricalData = async (rangeValue) => {
    try {
      setHistoryLoading(true);
      
      const response = await api.get(`/historical/history/${stockSymbol}?range=${rangeValue}`);
      if (response.data.success) {
        setHistoricalData(response.data.data);
      } else {
        setHistoricalData([]);
      }
    } catch (error) {
      console.log(error);
      setHistoricalData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRangeChange = (rangeValue) => {
    if (rangeValue === selectedRange) return;
    setSelectedRange(rangeValue);
  };

  useEffect(() => {
    if (showHistorical) {
      fetchHistoricalData(selectedRange);
    }
  }, [selectedRange, stockSymbol, showHistorical]);

  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!compareSymbol) return;
    setLoadingCompare(true);
    try {
      const response = await api.get(
        `/historical/history/${compareSymbol.toUpperCase()}?range=${selectedRange}`
      );
      if (response.data && response.data.success) {
        setCompareData(response.data.data);
        setIsComparing(true);
      } else {
        setCompareData(null);
        setIsComparing(false);
        addToast(`No data found for ${compareSymbol.toUpperCase()}`, "error");
      }
    } catch (err) {
      setCompareData(null);
      setIsComparing(false);
      const errorMsg = err.response?.data?.message || "Error fetching comparison data";
      addToast(errorMsg, "error");
    } finally {
      setLoadingCompare(false);
    }
  };

  const clearCompare = () => {
    setCompareData(null);
    setCompareSymbol("");
    setIsComparing(false);
  };

  // 5. TRADING
  const handleTrade = async (type) => {
    const tradeQuantity = Number(quantity);
    if (tradeQuantity <= 0) {
      setQuantityError("Please provide a valid number of quantity first");
      return;
    }

    if (type === "BUY") {
      const totalCost = tradeQuantity * livePrice;
      if (walletBalance < totalCost) {
        addToast(`Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${walletBalance.toFixed(2)}`, "error");
        return;
      }
    }

    setPendingTrade({ type, quantity: tradeQuantity, price: livePrice });
  };

  const confirmTrade = async () => {
    const { type, quantity: tradeQuantity } = pendingTrade;
    setPendingTrade(null);
    setTrading(true);

    try {
      if (type === "BUY") {
        await buyStock({ stockSymbol, quantity: tradeQuantity });
        addToast("Stock Bought Successfully", "success");
        setStock(prev => ({ ...prev, ownedQuantity: prev.ownedQuantity + tradeQuantity }));
      } else {
        await sellStock({ stockSymbol, quantity: tradeQuantity });
        addToast("Stock Sold Successfully", "success");
        setStock(prev => ({ ...prev, ownedQuantity: prev.ownedQuantity - tradeQuantity }));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Transaction failed";
      addToast(errorMessage, "error");
    } finally {
      setTrading(false);
      setQuantity(1);
      setShowTradeModal(false);
    }
  };

  // 6. RENDER
  if (!stock) return <div className="p-10"><Skeleton className="h-96 w-full" /></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        html, body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
        }
        /* Custom scrollbar for our quick table */
        .pulse-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .pulse-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.8);
          border-radius: 10px;
        }
        .pulse-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .pulse-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      ` }} />

      {/* PENDING TRADE MODAL */}
      {pendingTrade && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_16px_50px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-2xl ${pendingTrade.type === "BUY" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Confirm {pendingTrade.type === "BUY" ? "Buy" : "Sell"}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{stockSymbol}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{pendingTrade.quantity} Shares</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Price</span>
                  <span className={`text-sm font-black tracking-tighter ${pendingTrade.type === "BUY" ? "text-emerald-600" : "text-red-600"}`}>
                    ${(pendingTrade.quantity * pendingTrade.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Balance</span>
                  <span className="text-[10px] font-black text-slate-800 tracking-widest">
                    ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setPendingTrade(null)}
                className="flex-1 rounded-2xl bg-slate-50 border border-slate-200/60 py-4 font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTrade}
                className={`flex-1 rounded-2xl py-4 font-bold text-white transition-all shadow-md uppercase tracking-widest text-[10px] cursor-pointer ${pendingTrade.type === "BUY" ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15" : "bg-red-600 hover:bg-red-500 shadow-red-600/15"}`}
              >
                Execute Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRADE TERMINAL POPUP MODAL (BOTTOM RIGHT PINNED) */}
      {showTradeModal && (
        <div className="fixed bottom-8 right-8 z-[200] w-full max-w-[420px] animate-slide-up">
          <div className="relative w-full bg-white rounded-[2rem] border border-slate-100 shadow-[0_16px_50px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* MODAL HEADER */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-0.5">Trade Terminal</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live Engine</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTradeModal(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* ASSET INFO MINI-BAR */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900 leading-none">{stockSymbol}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">{stock.companyName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Market Price</span>
                  <span className="text-xl font-black text-slate-900 leading-none">${livePrice}</span>
                </div>
              </div>

              {!stock.isActive && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-150 text-amber-850 text-[10px] font-semibold leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                  <span className="text-base select-none">⚠️</span>
                  <div>
                    <span className="font-extrabold uppercase block mb-0.5">Asset Deactivated</span>
                    This stock is currently inactive. Buying is disabled, but you can sell any existing holdings you own to liquidate your position.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* STATS */}
                <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex flex-col justify-between h-full">
                  <div>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stock.ownedQuantity}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Shares Held</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <p className="text-lg font-black text-slate-800 tracking-tight">
                      ${(stock.ownedQuantity * livePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Position Value</p>
                  </div>
                </div>

                {/* INPUT */}
                <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setQuantityError("");
                      }}
                      className={`w-full bg-white border-2 ${quantityError ? 'border-red-500' : 'border-slate-200 focus:border-indigo-500'} rounded-2xl p-4 text-3xl font-black text-slate-800 outline-none transition-all text-center`}
                      placeholder="1"
                    />
                  </div>
                  <div className={`px-3 py-2 rounded-xl border text-center transition-all ${((quantity * livePrice) > walletBalance) ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                    <span className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${((quantity * livePrice) > walletBalance) ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {((quantity * livePrice) > walletBalance) ? "⚠️ Insufficient Funds" : "Required"}
                    </span>
                    <span className={`text-sm font-black ${((quantity * livePrice) > walletBalance) ? 'text-red-600' : 'text-slate-800'}`}>
                      ${(quantity * livePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pb-2">
                <button
                  disabled={trading || !stock.isActive || (quantity * livePrice) > walletBalance}
                  onClick={() => handleTrade("BUY")}
                  className={`flex-1 rounded-2xl py-4 text-xs font-bold transition-all shadow-md uppercase tracking-widest cursor-pointer ${(!stock.isActive || (quantity * livePrice) > walletBalance) ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/10'}`}
                >
                  {trading ? "..." : "Buy Asset"}
                </button>
                <button
                  disabled={trading || stock.ownedQuantity < quantity}
                  onClick={() => handleTrade("SELL")}
                  className="flex-1 rounded-2xl bg-transparent border-2 border-red-200 py-4 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                >
                  {trading ? "..." : "Sell Asset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}      <div className="animate-fade-in min-h-screen bg-[#F4F5F0] text-slate-800">
        <div className="w-full pt-2 pb-10 overflow-hidden">
          {/* TOP NAVIGATION ROW */}
          <div className="px-6 lg:px-8 mb-4">
            <div className="flex items-center h-8">
              <Link
                to={role === "stockmanager" ? "/manager" : "/stocks"}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all group"
              >
                <div className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 group-hover:border-indigo-500/50 transition-all shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-600">Back to Market</span>
              </Link>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="px-6 lg:px-12 space-y-8">

            {/* UNIFIED COMPACT HERO SECTION */}
            <section className="glass-card bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

                    <div className="flex items-center gap-6">
                      <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">{stock.stockSymbol}</h1>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {stock.change && (
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black w-fit flex items-center gap-1 ${stock.change.includes('-')
                              ? 'bg-red-50 text-red-600 border border-red-100/50'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                              }`}>
                              <span>{stock.change.includes('-') ? '▼' : '▲'}</span>
                              {stock.change}
                            </span>
                          )}
                          {!stock.isActive && (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black w-fit bg-red-50 text-red-600 border border-red-150 flex items-center gap-1 animate-fadeIn">
                              <span>⚠️</span> INACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate max-w-[150px]">{stock.companyName}</p>
                      </div>
                    </div>

                    <div className="hidden md:block h-12 w-px bg-slate-200"></div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">$</span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">{livePrice}</h2>
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] ml-1"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {role === "trader" && (
                      <button
                        onClick={() => setShowTradeModal(true)}
                        className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white cursor-pointer"
                      >
                        BUY/SELL
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowHistorical(!showHistorical);
                        if (!showHistorical) {
                          setTimeout(() => {
                            historicalSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 300);
                        }
                      }}
                      className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xs active:scale-95 border cursor-pointer ${showHistorical ? "bg-slate-800 text-white border-slate-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      {showHistorical ? "Hide Analysis" : "Historical Analysis"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6 bg-white">
                <div className="flex items-center justify-between px-6 py-3 bg-slate-50/70 rounded-t-2xl border-x border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Market Momentum</h3>
                  </div>
                </div>
                <div className="h-[380px] lg:h-[420px] w-full p-2 bg-white rounded-b-2xl border border-slate-100 shadow-[inset_0_1px_3px_rgba(0,0,0,0.005)]">
                  <StockChart chartData={liveChartData} range="LIVE" />
                </div>
              </div>
            </section>

            <div className="space-y-12">

              {/* HISTORICAL CHART - MAXIMUM WIDTH */}
              {showHistorical && (
                <section ref={historicalSectionRef} className="glass-card bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up flex flex-col scroll-mt-10 max-w-full">

                  {/* 1. HEADER SECTION */}
                  <div className="p-6 lg:p-8 pb-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-50 rounded-3xl border border-indigo-100 text-indigo-600 shadow-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-[0.1em]">Historical Analysis</h2>
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-indigo-600 animate-pulse"></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Grade Data Engine</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        {/* Comparison Tool */}
                        <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/55 shadow-xs">
                          <form onSubmit={handleCompareSubmit} className="flex items-center">
                            <input
                              type="text"
                              placeholder="COMPARE..."
                              value={compareSymbol}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCompareSymbol(val);
                                if (!val) {
                                  setCompareData(null);
                                  setIsComparing(false);
                                }
                              }}
                              className="bg-transparent px-4 py-2 text-[10px] font-black tracking-[0.2em] text-slate-700 outline-none w-28 md:w-36 transition-all placeholder:text-slate-400 uppercase"
                            />
                            <button
                              type="submit"
                              disabled={loadingCompare}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-md cursor-pointer"
                            >
                              {loadingCompare ? '...' : 'ADD'}
                            </button>
                          </form>
                        </div>

                        {/* Range Selector */}
                        <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/55 shadow-xs gap-1">
                          {["1D", "5D", "1M", "3M", "1Y", "MAX"].map((item) => (
                            <button
                              key={item}
                              onClick={() => handleRangeChange(item)}
                              className={`min-w-[60px] md:min-w-[70px] rounded-xl px-4 py-2.5 text-[10px] font-black transition-all cursor-pointer ${selectedRange === item ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-400 hover:text-slate-800"}`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Active Comparison Chip */}
                    {isComparing && (
                      <div className="mt-6 flex items-center gap-3 bg-indigo-50 border border-indigo-100/50 px-4 py-2 rounded-2xl w-fit animate-fade-in">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Comparing with {compareSymbol.toUpperCase()}</span>
                        <button onClick={clearCompare} className="ml-2 text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. CHART SECTION - Full Height and Width */}
                  <div className="h-[450px] w-full relative bg-white">
                    {historyLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-xs z-10">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full w-full">
                        <AdvancedChart
                          chartData={historicalData}
                          range={selectedRange}
                          mainSymbol={stockSymbol}
                          compareData={compareData}
                          compareSymbol={compareSymbol}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 border-t border-slate-100 bg-slate-50/30 divide-x divide-slate-100">
                    {stock.stats && Object.entries(stock.stats).map(([key, val]) => (
                      <div key={key} className="px-4 py-6 hover:bg-slate-50/50 transition-colors text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                        <p className="text-sm font-black text-slate-800">{val}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* 3. INFO & ABOUT - TWO COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="glass-card p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-8 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Company Analysis</h2>
                </div>
                <p className="text-base text-slate-600 leading-relaxed font-medium">
                  {stock.description || `Comprehensive overview for ${stock.companyName}. This profile includes key financial metrics and sectoral positioning within the ${stock.sector} industry. It highlights the company's market dominance and growth potential in the current economic landscape.`}
                </p>
              </section>

              <section className="glass-card p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm h-full">
                <div className="flex items-center gap-4 mb-10 pb-4 border-b border-slate-100">
                  <div className="h-1.5 w-6 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Asset Profile</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                  {[
                    { label: "Sector", value: stock.sector, icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
                    { label: "Country", value: stock.country, icon: "M12 22s8-4.5 8-11.8A8 8 0 0 0 12 2a8 8 0 0 0-8 8.2c0 7.3 8 11.8 8 11.8z" },
                    { label: "IPO Date", value: stock.ipo, icon: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM3 10h18M8 2v4M16 2v4" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 group">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-xs font-black text-slate-800 uppercase" title={item.value || "N/A"}>{item.value || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* AI MARKET PULSE FLOATING BUTTON & LOOKUP POPUP */}
      <div className="fixed bottom-24 right-6 z-[200] flex flex-col items-end gap-2">
        {isPopupOpen && (
          <div className="w-[320px] sm:w-[360px] rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.06)] animate-slide-up absolute bottom-16 right-0 mb-2">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h5l2 8 5-16 3 10 5-2"/></svg>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">AI Market Pulse</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Real-time Stock Hub</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100/50 rounded-full text-[8px] font-black uppercase tracking-wider">
                Live
              </span>
            </div>

            {/* Filter Input */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Filter by symbol or name..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 focus:border-indigo-500/50 focus:bg-white rounded-xl px-3 py-1.5 text-[10px] font-medium text-slate-800 outline-none placeholder:text-slate-400 transition-all"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400">🔍</span>
            </div>

            {/* Table */}
            <div className="overflow-y-auto max-h-[220px] pulse-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2 text-right">Price</th>
                    <th className="pb-2 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStocksList ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center">
                        <div className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Loading market data...</p>
                      </td>
                    </tr>
                  ) : allStocksList.filter(s => 
                      s.stockSymbol.toLowerCase().includes(filterText.toLowerCase()) || 
                      s.companyName.toLowerCase().includes(filterText.toLowerCase())
                    ).length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        No Stocks Found
                      </td>
                    </tr>
                  ) : (
                    allStocksList
                      .filter(s => 
                        s.stockSymbol.toLowerCase().includes(filterText.toLowerCase()) || 
                        s.companyName.toLowerCase().includes(filterText.toLowerCase())
                      )
                      .map((stk) => {
                        const isNegative = stk.change?.includes('-');
                        return (
                          <tr 
                            key={stk.stockSymbol}
                            className="hover:bg-slate-50 transition-colors duration-150 group/row cursor-pointer"
                            onClick={() => {
                              setIsPopupOpen(false);
                              navigate(`/stocks/${stk.stockSymbol}`);
                            }}
                          >
                            {/* Symbol Column */}
                            <td className="py-2.5 relative group/symbol">
                              <span 
                                className="text-xs font-black text-indigo-600 group-hover/row:text-indigo-700 transition-colors uppercase relative cursor-help"
                              >
                                {stk.stockSymbol}
                                
                                {/* Custom Premium Tooltip */}
                                <span className="pointer-events-none absolute left-0 bottom-full mb-1.5 opacity-0 group-hover/symbol:opacity-100 transition-all duration-200 transform translate-y-1 group-hover/symbol:translate-y-0 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-xl border border-slate-950 shadow-md whitespace-nowrap z-50">
                                  {stk.companyName}
                                </span>
                              </span>
                            </td>

                            {/* Price Column */}
                            <td className="py-2.5 text-right text-xs font-black text-slate-800">
                              ${stk.price ? Number(stk.price).toFixed(2) : "0.00"}
                            </td>

                            {/* Change Column */}
                            <td className={`py-2.5 text-right text-xs font-black ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                              <span className="inline-flex items-center gap-0.5">
                                <span>{isNegative ? '▼' : '▲'}</span>
                                {stk.change || '0.00%'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pulsating hexagonal button */}
        <button
          onClick={() => setIsPopupOpen(!isPopupOpen)}
          className="relative group hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center w-14 h-14"
          title="AI Market Pulse"
        >
          <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div 
            className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-600 text-white text-[8px] font-black flex flex-col items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300"
            style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5"><path d="M2 12h5l2 8 5-16 3 10 5-2"/></svg>
            <span>PULSE</span>
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 border border-white"></span>
          </span>
        </button>
      </div>
    </>
  );
}

export default StockDetails;