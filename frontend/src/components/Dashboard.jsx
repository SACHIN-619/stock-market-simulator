import { useEffect, useState } from "react";
import api from "../service/api";
import { getAllStocks } from "../service/stockService";
import { CardSkeleton } from "./Skeleton";
import { Link } from "react-router-dom";

function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const username = sessionStorage.getItem("username");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stocksRes, portfolioRes] = await Promise.all([
          getAllStocks(),
          api.get("/portfolio")
        ]);
        setStocks(stocksRes.payload.slice(0, 6)); // Get top 6 for trending
        setPortfolio(portfolioRes.data.summary);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const marketIndices = [
    { name: "S&P 500", value: "5,137.08", change: "+0.80%", up: true },
    { name: "NASDAQ", value: "16,274.94", change: "+1.14%", up: true },
    { name: "NIFTY 50", value: "22,478.40", change: "-0.22%", up: false },
    { name: "BTC / USD", value: "67,432.10", change: "+4.52%", up: true },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-2">
          <div className="w-48 h-8 bg-slate-800 rounded-lg animate-pulse" />
          <div className="w-64 h-4 bg-slate-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
          <div className="h-96 bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* WELCOME SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            Welcome back, <span className="text-emerald-400">{username}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1 font-medium">The markets are looking active today. Ready to trade?</p>
        </div>
        <div className="flex gap-3">
          <Link to="/stocks" className="btn-primary">Trade Now</Link>
          <Link to="/transactions" className="btn-secondary">History</Link>
        </div>
      </header>

      {/* MARKET OVERVIEW */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketIndices.map((index) => (
          <div key={index.name} className="glass-card p-5 rounded-2xl flex items-center justify-between group">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{index.name}</p>
              <h3 className="text-xl font-black text-white">{index.value}</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              index.up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            }`}>
              <span>{index.up ? "▲" : "▼"}</span>
              {index.change}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* TRENDING STOCKS */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">Trending Stocks</h2>
            <Link to="/stocks" className="text-sm font-bold text-emerald-400 hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stocks.map((stock) => (
              <Link 
                key={stock._id} 
                to={`/stocks/${stock.stockSymbol}`}
                className="glass-card p-6 rounded-2xl group relative overflow-hidden"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{stock.stockSymbol}</h3>
                    <p className="text-sm font-medium text-slate-500 truncate max-w-[150px]">{stock.companyName}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-xl">
                    📈
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Price</p>
                    <p className="text-xl font-black text-white">$154.20</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-black flex items-center justify-end gap-1">
                      <span>▲</span>
                      +2.4%
                    </p>
                  </div>
                </div>
                {/* Subtle Background Glow */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* PORTFOLIO SUMMARY WIDGET */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-white">Your Assets</h2>
          <div className="glass-card p-8 rounded-[2rem] bg-linear-to-br from-emerald-500/10 via-transparent to-transparent border-emerald-500/10 flex flex-col h-full">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Net Worth</p>
              <h3 className="text-4xl font-black text-white">
                ${((portfolio?.totalCurrentValue || 0) + 10000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <span className="text-sm font-medium text-slate-400">Buying Power</span>
                <span className="font-bold text-white">$10,000.00</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                <span className="text-sm font-medium text-slate-400">Invested</span>
                <span className="font-bold text-white">${(portfolio?.totalCurrentValue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm font-bold text-emerald-400">Total Profit</span>
                <span className="font-black text-emerald-400">
                  {portfolio?.totalProfit >= 0 ? "+" : ""}${portfolio?.totalProfit?.toLocaleString() || "0.00"}
                </span>
              </div>
            </div>

            <Link to="/dashboard" className="mt-auto pt-8 flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition group">
              View Detailed Portfolio 
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
