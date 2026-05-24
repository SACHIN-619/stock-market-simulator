import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllStocks, getStockDetails } from "../service/stockService";
import { socket } from "../socket/socket";
import { Sparkline } from "./TraderTerminal";
// --- ANIMATION COMPONENT ---
const LogoAnimation = () => {
  const emerald500 = "#10b981";
  const emerald600 = "#059669";
  const blue500 = "#3b82f6";
  const blue600 = "#2563eb";

  return (
    <div className="flex flex-col items-center justify-center scale-90 md:scale-110 lg:scale-125">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap');

        .app-icon-container {
          font-family: 'Montserrat', sans-serif;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: appIn 1s forwards;
        }

        .dollar-sign {
          font-size: 160px;
          font-weight: 900;
          opacity: 0;
          transform: translateY(20px);
          animation: popUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
        }

        .crown {
          opacity: 0;
          transform-origin: center bottom;
          transform: translateY(-30px) scale(0.8);
          animation: dropCrown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards;
        }

        .candle {
          opacity: 0;
          transform-origin: bottom;
          transform: scaleY(0);
        }

        .candle-r1 {
          animation: growUp 0.5s ease-out 1.5s forwards;
        }

        .candle-r2 {
          animation: growUp 0.5s ease-out 1.7s forwards;
        }

        .candle-r3 {
          animation: growUp 0.5s ease-out 1.9s forwards;
        }

        .candle-g1 {
          animation: growUp 0.5s ease-out 2.5s forwards;
        }

        .candle-g2 {
          animation: growUp 0.5s ease-out 2.7s forwards;
        }

        .candle-g3 {
          animation: growUp 0.5s ease-out 2.9s forwards;
        }

        .trend-line {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawLine 1.5s ease-in-out 1.8s forwards;
        }

        .trend-arrow {
          opacity: 0;
          animation: fadeIn 0.3s ease-in 3.2s forwards;
        }

        .text-stock {
          font-size: 38px;
          font-weight: 900;
          background: linear-gradient(to bottom, #020617, #334155, #475569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          opacity: 0;
          transform: translateX(-20px);
          animation: slideInLeft 0.8s ease-out 3.2s forwards;
        }

        .text-king {
          font-size: 38px;
          font-weight: 900;
          background: linear-gradient(to bottom, ${blue500}, ${blue600});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          opacity: 0;
          transform: translateX(20px);
          animation: slideInRight 0.8s ease-out 3.2s forwards;
        }

        .tagline-container {
          opacity: 0;
          animation: fadeIn 1s ease-in 3.8s forwards;
        }

        @keyframes appIn {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes popUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dropCrown {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes growUp {
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes slideInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>

      <div className="app-icon-container">
        <svg width="350" height="240" viewBox="0 0 350 240">
          <defs>
            <linearGradient
              id="blueMetal"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={blue500} />
              <stop offset="100%" stopColor={blue600} />
            </linearGradient>

            <linearGradient
              id="lineGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor={emerald500} />
            </linearGradient>

            <linearGradient
              id="moneyBlack"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#20503b" />
              <stop offset="100%" stopColor="#32785b" />
            </linearGradient>
          </defs>

          {/* Red Candles */}
          <g className="candle candle-r1">
            <line
              x1="60"
              y1="125"
              x2="60"
              y2="165"
              stroke="#EF4444"
              strokeWidth="2"
            />
            <rect
              x="54"
              y="135"
              width="12"
              height="20"
              fill="#DC2626"
              rx="2"
            />
          </g>

          <g className="candle candle-r2">
            <line
              x1="85"
              y1="110"
              x2="85"
              y2="175"
              stroke="#EF4444"
              strokeWidth="2"
            />
            <rect
              x="79"
              y="120"
              width="12"
              height="40"
              fill="#DC2626"
              rx="2"
            />
          </g>

          <g className="candle candle-r3">
            <line
              x1="110"
              y1="140"
              x2="110"
              y2="180"
              stroke="#EF4444"
              strokeWidth="2"
            />
            <rect
              x="104"
              y="150"
              width="12"
              height="15"
              fill="#DC2626"
              rx="2"
            />
          </g>

          {/* Green Candles */}
          <g className="candle candle-g1">
            <line
              x1="240"
              y1="115"
              x2="240"
              y2="155"
              stroke={emerald500}
              strokeWidth="2"
            />
            <rect
              x="234"
              y="125"
              width="12"
              height="20"
              fill={emerald600}
              rx="2"
            />
          </g>

          <g className="candle candle-g2">
            <line
              x1="265"
              y1="90"
              x2="265"
              y2="140"
              stroke={emerald500}
              strokeWidth="2"
            />
            <rect
              x="259"
              y="100"
              width="12"
              height="30"
              fill={emerald600}
              rx="2"
            />
          </g>

          <g className="candle candle-g3">
            <line
              x1="290"
              y1="65"
              x2="290"
              y2="125"
              stroke={emerald500}
              strokeWidth="2"
            />
            <rect
              x="284"
              y="75"
              width="12"
              height="40"
              fill={emerald600}
              rx="2"
            />
          </g>

          {/* Dollar Sign */}
          <text
            x="175"
            y="195"
            textAnchor="middle"
            className="dollar-sign"
            fill="url(#moneyBlack)"
          >
            $
          </text>

          {/* LOWERED CROWN */}
          <g className="crown">
            <path
              d="M 120 68 L 130 33 L 155 53 L 175 23 L 195 53 L 220 33 L 230 68 Z"
              fill="url(#moneyBlack)"
            />
          </g>

          {/* Trend Line */}
          <path
            className="trend-line"
            d="M 40 185 L 100 145 L 140 175 L 175 140 L 220 160 L 310 100"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="4"
          />

          {/* Arrow */}
          <polygon
            className="trend-arrow"
            points="315,95 300,98 310,110"
            fill={emerald500}
          />
        </svg>

        {/* Logo Text */}
        <div className="flex items-center mt-[-10px]">
          <span className="text-stock">STOCK</span>
          <span className="text-king">KING</span>
        </div>

        {/* Tagline */}
        <div className="tagline-container flex items-center mt-2">
          <div className="h-px w-8 bg-indigo-500 mx-2"></div>

          <span className="text-[10px] text-indigo-600 tracking-[3px] uppercase font-black">
            Rule The Market
          </span>

          <div className="h-px w-8 bg-indigo-500 mx-2"></div>
        </div>
      </div>
    </div>
  );
};

const FALLBACK_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", price: 178.45, change: 1.25, isUp: true, logo: "", sparkline: [175, 176, 175.5, 177, 178.45] },
  { symbol: "TSLA", name: "Tesla Motors", price: 210.12, change: -2.45, isUp: false, logo: "", sparkline: [215, 214, 212, 209, 210.12] },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 485.30, change: 5.12, isUp: true, logo: "", sparkline: [472, 475, 470, 482, 485.30] },
  { symbol: "AMZN", name: "Amazon.com", price: 145.18, change: 0.85, isUp: true, logo: "", sparkline: [143, 144, 144.5, 145, 145.18] },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 370.85, change: -0.15, isUp: false, logo: "", sparkline: [372, 371, 373, 370.5, 370.85] }
];

function Home() {
  const navigate = useNavigate();

  // Stocks state loaded dynamically from API or falling back to defaults
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const mainStock = stocks[0] || { symbol: "AAPL", name: "Apple Inc.", price: 178.45, change: 1.25, isUp: true, logo: "", sparkline: [175, 176, 175.5, 177, 178.45] };

  // Tab state for learning hub
  const [activeTab, setActiveTab] = useState("market");

  // Mock terminal state for landing page interaction
  const [mockCash, setMockCash] = useState(100000.00);
  const [mockHoldings, setMockHoldings] = useState(0);
  const [mockQuantity, setMockQuantity] = useState(10);
  const [mockMessage, setMockMessage] = useState("");

  useEffect(() => {
    const role = sessionStorage.getItem("role");

    if (role === "trader") {
      navigate("/portfolio", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "stockmanager") {
      navigate("/manager", { replace: true });
    }
  }, [navigate]);

  // Fetch real active stocks from API
  useEffect(() => {
    let active = true;
    const fetchApiStocks = async () => {
      try {
        const data = await getAllStocks(1, "", 5);
        const allStocks = data.payload || [];
        if (allStocks.length > 0) {
          const detailedStocks = await Promise.all(
            allStocks.map(async (stock) => {
              try {
                const details = await getStockDetails(stock.stockSymbol);
                const liveDetails = details.payload || {};
                const pc = liveDetails.pc || liveDetails.c || 100;
                const c = liveDetails.c || 100;
                const diff = c - pc;
                const sparkline = [
                  pc,
                  pc + diff * 0.25,
                  pc + diff * 0.5,
                  pc + diff * 0.75,
                  c
                ];
                return {
                  symbol: stock.stockSymbol,
                  name: stock.companyName,
                  logo: stock.logo,
                  price: c,
                  change: Number((liveDetails.dp || 0).toFixed(2)),
                  isUp: (liveDetails.d || 0) >= 0,
                  sparkline
                };
              } catch (err) {
                console.error(`Failed to fetch details for ${stock.stockSymbol}`, err);
                return null; // Return null so we can filter out failed fetches
              }
            })
          );
          if (active) {
            const validStocks = detailedStocks.filter(s => s !== null);
            if (validStocks.length > 0) {
              setStocks(validStocks);
              setIsUsingFallback(false);
            } else {
              setStocks(FALLBACK_STOCKS);
              setIsUsingFallback(true);
            }
            setIsLoading(false);
          }
        } else {
          if (active) {
            setStocks(FALLBACK_STOCKS);
            setIsUsingFallback(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to load backend stocks on Home page:", error);
        if (active) {
          setStocks(FALLBACK_STOCKS);
          setIsUsingFallback(true);
          setIsLoading(false);
        }
      }
    };

    fetchApiStocks();
    return () => {
      active = false;
    };
  }, []);

  // Subscribe to real-time websocket updates from backend
  useEffect(() => {
    const handleStockUpdates = (updatedStocks) => {
      if (isUsingFallback) return;

      setStocks(prev => prev.map(stock => {
        const update = updatedStocks.find(u => (u.stockSymbol || u.symbol)?.toUpperCase() === stock.symbol.toUpperCase());
        if (update) {
          const nextPrice = update.currentPrice || update.price || stock.price;
          const prevClose = update.previousClose || stock.price;
          const nextChange = prevClose ? Number((((nextPrice - prevClose) / prevClose) * 100).toFixed(2)) : stock.change;
          const nextSpark = [...stock.sparkline.slice(1), nextPrice];
          return {
            ...stock,
            price: nextPrice,
            change: nextChange,
            isUp: nextPrice >= (update.previousClose || nextPrice),
            sparkline: nextSpark
          };
        }
        return stock;
      }));
    };

    socket.on("stockUpdates", handleStockUpdates);
    return () => {
      socket.off("stockUpdates", handleStockUpdates);
    };
  }, [isUsingFallback]);

  // Tick stock prices slightly every 3 seconds ONLY if we are using local fallbacks
  useEffect(() => {
    if (!isUsingFallback) return;

    const interval = setInterval(() => {
      setStocks(prev => prev.map(stock => {
        const factor = (Math.random() - 0.5) * 0.4;
        const nextPrice = Number((stock.price + factor).toFixed(2));
        const changeFactor = factor > 0 ? 0.05 : -0.05;
        const nextChange = Number((stock.change + changeFactor).toFixed(2));
        const nextSpark = [...stock.sparkline.slice(1), nextPrice];
        return {
          ...stock,
          price: nextPrice,
          change: nextChange,
          isUp: nextChange >= 0,
          sparkline: nextSpark
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [isUsingFallback]);

  const handleMockBuy = () => {
    const applePrice = mainStock.price;
    const cost = applePrice * mockQuantity;
    if (cost > mockCash) {
      setMockMessage("⚠️ Insufficient mock virtual capital!");
      return;
    }
    setMockCash(prev => Number((prev - cost).toFixed(2)));
    setMockHoldings(prev => prev + Number(mockQuantity));
    setMockMessage(`✅ Purchased ${mockQuantity} ${mainStock.symbol} shares successfully!`);
    setTimeout(() => setMockMessage(""), 4000);
  };

  const handleMockSell = () => {
    const applePrice = mainStock.price;
    const credit = applePrice * mockQuantity;
    if (mockHoldings < mockQuantity) {
      setMockMessage("⚠️ You don't hold enough mock shares to sell!");
      return;
    }
    setMockCash(prev => Number((prev + credit).toFixed(2)));
    setMockHoldings(prev => prev - Number(mockQuantity));
    setMockMessage(`✅ Sold ${mockQuantity} ${mainStock.symbol} shares successfully!`);
    setTimeout(() => setMockMessage(""), 4000);
  };



  return (
    <div className="bg-[#F8FAFC] text-slate-800 overflow-x-hidden min-h-screen">

      {/* HERO SECTION */}
      <section
        className="
        min-h-[calc(100vh-64px)]
        grid
        md:grid-cols-2
        gap-10
        items-center
        px-6
        md:px-20
        lg:px-32
        bg-gradient-to-b
        from-[#F8FAFC]
        via-[#FFFFFF]
        to-[#F8FAFC]
      "
      >
        {/* LEFT CONTENT */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-slate-900 tracking-tight">
            Master Trading <br />
            <span className="text-indigo-600">Without Risk</span>
          </h1>

          <p className="mt-6 text-slate-500 max-w-xl text-base font-semibold leading-relaxed">
            Practice stock trading using real-time simulated market trends, virtual tokens, and detailed portfolio risk analytics safely.
          </p>

          <Link
            to="/register"
            className="mt-8 px-10 py-4.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all font-black text-xs uppercase tracking-widest shadow-md active:scale-95 cursor-pointer"
          >
            Get Started
          </Link>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex justify-center md:justify-end order-1 md:order-2 py-10">
          <LogoAnimation />
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="about-section" className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">
            Simulator Ecosystem
          </span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Institutional-Grade Trading Tools
          </h2>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            Gain full understanding of active stock exchanges, standard order execution policies, and risk profiling before committing actual hard-earned funds.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-bold">
                📈
              </div>
              <h3 className="text-xl font-black text-slate-900">Technical Stock Charts</h3>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Full-featured chart rendering mapping simulated high/low intervals, moving averages, and real price logs.
              </p>
            </div>
            <ul className="text-xs font-bold text-slate-400 space-y-2 pt-4">
              <li className="flex items-center gap-2">✓ Real-time price velocity curves</li>
              <li className="flex items-center gap-2">✓ Customized moving average overlay</li>
              <li className="flex items-center gap-2">✓ Dynamic trade vol indicators</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-xl font-bold">
                ⚡
              </div>
              <h3 className="text-xl font-black text-slate-900">Dynamic Trade Execution</h3>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Experience instantaneous market execution or set customizable target limit thresholds for sophisticated automated buying/selling.
              </p>
            </div>
            <ul className="text-xs font-bold text-slate-400 space-y-2 pt-4">
              <li className="flex items-center gap-2">✓ Instant market-order matches</li>
              <li className="flex items-center gap-2">✓ Custom buy/sell limit targets</li>
              <li className="flex items-center gap-2">✓ Full audit-compliant trade history</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-8 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 text-xl font-bold">
                📊
              </div>
              <h3 className="text-xl font-black text-slate-900">Advanced Yield Analytics</h3>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Audit portfolio concentration spreads, check real-time cash balance adjustments, and track overall asset yields.
              </p>
            </div>
            <ul className="text-xs font-bold text-slate-400 space-y-2 pt-4">
              <li className="flex items-center gap-2">✓ Total asset allocation matrix</li>
              <li className="flex items-center gap-2">✓ Multi-sector risk concentration analysis</li>
              <li className="flex items-center gap-2">✓ Live cash vs equity yield tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* LIVE simulated TICKER MARQUEE */}
      <section className="bg-slate-50/60 border-y border-slate-200/60 py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-widest">
                Simulated Market Feed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200/80 rounded w-1/2"></div>
                    </div>
                    <div className="h-5 bg-slate-200 rounded w-12"></div>
                  </div>
                  <div className="flex items-end justify-between mt-6">
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                    <div className="h-6 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : (
              stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-900">{stock.symbol}</span>
                      <p className="text-[10px] text-slate-400 font-bold leading-none">{stock.name}</p>
                    </div>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${stock.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                    >
                      {stock.isUp ? "+" : ""}{stock.change}%
                    </span>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <span className="text-base font-black text-slate-900">${stock.price.toFixed(2)}</span>
                    <div className="w-20">
                      <Sparkline symbol={stock.symbol} color={stock.isUp ? "#10b981" : "#ef4444"} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* INTERACTIVE MOCK TERMINAL DEMO */}
      <section className="py-24 bg-slate-50 border-y border-slate-100 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full">
              Try It Live
            </span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Mock Trade with Our Simulator
            </h2>
            <p className="text-slate-500 font-semibold leading-relaxed">
              Don't wait to register! Use this interactive mock trading terminal to execute a simulated transaction for <strong className="font-bold text-slate-900">{mainStock.name} ({mainStock.symbol})</strong>. Watch your virtual balance and holdings update instantly inside the card.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-4 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Default Capital</span>
                <p className="text-xl font-black text-slate-900">$100,000.00</p>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Live Feed</span>
                <p className="text-xl font-black text-indigo-600">{mainStock.symbol} Tickers</p>
              </div>
            </div>
          </div>

          {/* INTERACTIVE CARD */}
          {isLoading ? (
            <div className="bg-white border border-slate-200/85 rounded-[2.5rem] p-8 shadow-md space-y-6 animate-pulse w-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-3 bg-slate-200 rounded w-16 ml-auto"></div>
                  <div className="h-5 bg-slate-200 rounded w-20 ml-auto"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50/80 border border-slate-150/40 p-4 rounded-2xl">
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                  <div className="h-5 bg-slate-200 rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-8 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-12 bg-slate-200 rounded-2xl"></div>
                  <div className="h-12 bg-slate-200 rounded-2xl"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/85 rounded-[2.5rem] p-8 shadow-md hover:shadow-2xl hover:border-indigo-200/50 transition duration-500 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm overflow-hidden">
                    {mainStock.logo ? (
                      <img src={mainStock.logo} alt={mainStock.symbol} className="h-full w-full object-contain" />
                    ) : (
                      mainStock.symbol[0]
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900">{mainStock.symbol}</span>
                    <p className="text-[10px] text-slate-400 font-bold">{mainStock.name} Terminal</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-400 uppercase leading-none block">{mainStock.symbol} Price</span>
                  <span className="text-lg font-black text-slate-900">${mainStock.price.toFixed(2)}</span>
                </div>
              </div>

              {/* MOCK STATS */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/80 border border-slate-150/40 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Mock Cash Balance</span>
                  <span className="text-lg font-black text-slate-900">${mockCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Your {mainStock.symbol} Holdings</span>
                  <span className="text-lg font-black text-slate-900">{mockHoldings} Shares</span>
                </div>
              </div>

              {/* MOCK INTERACTION CONTROL */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-600">Trading Quantity</label>
                  <div className="flex items-center border border-slate-200 rounded-xl">
                    <button
                      onClick={() => setMockQuantity(prev => Math.max(1, prev - 5))}
                      className="px-3 py-1.5 hover:bg-slate-50 font-black text-sm transition text-slate-500"
                    >
                      -
                    </button>
                    <span className="px-4 font-black text-sm text-slate-800">{mockQuantity}</span>
                    <button
                      onClick={() => setMockQuantity(prev => prev + 5)}
                      className="px-3 py-1.5 hover:bg-slate-50 font-black text-sm transition text-slate-500"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleMockBuy}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-sm shadow-emerald-100"
                  >
                    Buy {mainStock.symbol}
                  </button>
                  <button
                    onClick={handleMockSell}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-98 transition text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-sm shadow-red-100"
                  >
                    Sell {mainStock.symbol}
                  </button>
                </div>

                {mockMessage && (
                  <p className="text-center text-xs font-bold transition duration-300 animate-fade-in text-slate-600">
                    {mockMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STOCKKING FINANCIAL LEARNING HUB */}
      <section id="learn-section" className="py-24 px-6 md:px-20 lg:px-32 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">
            Knowledge Center
          </span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Learn Financial Principles
          </h2>
          <p className="text-slate-500 font-semibold leading-relaxed">
            Stockking behaves exactly like a real-world investment environment. Toggle the topics below to master core stock market mechanics.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* TABS SELECTOR */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <button
              onClick={() => setActiveTab("market")}
              className={`p-5 rounded-2xl border text-left transition duration-300 cursor-pointer ${activeTab === "market"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-sm text-slate-700"
                }`}
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest block opacity-75 mb-1">
                Concept 01
              </span>
              <span className="text-base font-black">Market vs Limit Orders</span>
            </button>

            <button
              onClick={() => setActiveTab("short")}
              className={`p-5 rounded-2xl border text-left transition duration-300 cursor-pointer ${activeTab === "short"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-sm text-slate-700"
                }`}
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest block opacity-75 mb-1">
                Concept 02
              </span>
              <span className="text-base font-black">Short Selling Strategy</span>
            </button>

            <button
              onClick={() => setActiveTab("risk")}
              className={`p-5 rounded-2xl border text-left transition duration-300 cursor-pointer ${activeTab === "risk"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-sm text-slate-700"
                }`}
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest block opacity-75 mb-1">
                Concept 03
              </span>
              <span className="text-base font-black">Asset Diversification</span>
            </button>
          </div>

          {/* TAB DISPLAY CARD */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 p-8 md:p-10 flex flex-col justify-between">
            {activeTab === "market" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-md">
                    Execution
                  </span>
                  <span className="text-xs font-black text-slate-400">Stockking Concept</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">How Order Execution Behaves</h3>
                <p className="text-slate-500 font-semibold leading-relaxed">
                  A <strong className="font-bold text-slate-900">Market Order</strong> executes immediately at whatever price is active in the matching log. While simple, high volatility can cause slippage. A <strong className="font-bold text-slate-900">Limit Order</strong> lets you specify an absolute maximum purchase price or minimum selling threshold, protecting your capital.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Order Math</span>
                  <p className="text-sm font-black text-slate-800 font-mono mt-1">Limit Buy Execution Target: Purchase Price ≤ Target Threshold</p>
                </div>
                <div className="border-l-4 border-amber-500 bg-amber-50/50 p-4 rounded-r-2xl">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-widest">PRO SIMULATOR TIP</span>
                  <p className="text-xs text-amber-900 font-bold mt-1">Use limit orders when trading high-velocity stocks in our simulator to gain precise control over mock execution margins.</p>
                </div>
              </div>
            )}

            {activeTab === "short" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-md">
                    Shorting
                  </span>
                  <span className="text-xs font-black text-slate-400">Stockking Concept</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Bearish Markets & Short Selling</h3>
                <p className="text-slate-500 font-semibold leading-relaxed">
                  Short selling involves borrowing an asset, selling it at the active market price, and planning to buy it back ("covering") when prices descend. This enables you to capitalize on market downward trends and diversify your yield direction.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Yield Calculation</span>
                  <p className="text-sm font-black text-slate-800 font-mono mt-1">Profit = (Entry Price - Buyback Price) x Number of Shares</p>
                </div>
                <div className="border-l-4 border-amber-500 bg-amber-50/50 p-4 rounded-r-2xl">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-widest">PRO SIMULATOR TIP</span>
                  <p className="text-xs text-amber-900 font-bold mt-1">Always monitor your margin! If the stock price rises instead of falling, your mock account will decrement equity margin rapidly.</p>
                </div>
              </div>
            )}

            {activeTab === "risk" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-md">
                    Diversification
                  </span>
                  <span className="text-xs font-black text-slate-400">Stockking Concept</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">Portfolio Asset Allocation</h3>
                <p className="text-slate-500 font-semibold leading-relaxed">
                  Diversification means spreading capital across different sectors, market caps, and assets to mitigate individual stock volatility. If one company fails, other solid gains balance the average portfolio yields.
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Portfolio Rule</span>
                  <p className="text-sm font-black text-slate-800 font-mono mt-1">Max Sector Concentration ≤ 20% of Portfolio Asset Cap</p>
                </div>
                <div className="border-l-4 border-amber-500 bg-amber-50/50 p-4 rounded-r-2xl">
                  <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-widest">PRO SIMULATOR TIP</span>
                  <p className="text-xs text-amber-900 font-bold mt-1">Use the "Sector Distribution" and "Concentration Metric" charts in your actual trader profile to monitor your active diversification balances.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HORIZONTAL TRUST & TRUST METRICS BANNER */}
      <section className="bg-white py-20 px-6 md:px-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="space-y-3">
            <p className="text-4xl font-black text-emerald-600">$100,000</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Default Mock Capital
            </span>
            <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto leading-relaxed">
              Test complex strategies with zero personal capital risk.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-4xl font-black text-indigo-600">1-Second</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              WebSocket price feed
            </span>
            <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto leading-relaxed">
              High-frequency updates mapping live simulated momentum.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-4xl font-black text-amber-600">100%</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Risk-Free Sandbox
            </span>
            <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto leading-relaxed">
              Perfect your entry targets and manage positions safely.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-4xl font-black text-rose-600">Multi-Sector</p>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Diversification Hub
            </span>
            <p className="text-xs text-slate-500 font-bold max-w-[200px] mx-auto leading-relaxed">
              Manage risk spreads across technology, finance, and industrials.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-28 bg-gradient-to-t from-indigo-50/50 to-transparent">
        <h2 className="text-4xl font-black mb-8 text-slate-900 tracking-tight">
          Start Your Trading Journey Today
        </h2>

        <Link
          to="/register"
          className="px-10 py-4.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all font-black text-xs uppercase tracking-widest shadow-md active:scale-95 cursor-pointer"
        >
          Start Trading Now
        </Link>
      </section>
    </div>
  );
}

export default Home;
