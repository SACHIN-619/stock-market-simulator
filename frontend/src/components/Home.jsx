import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import vid from '../assets/stockking.mp4'

// --- ANIMATION COMPONENT ---
const LogoAnimation = () => {
  const emerald500 = "#10b981";
  const emerald600 = "#059669";

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
          background: linear-gradient(to bottom, #ffffff, #9ca3af, #d1d5db);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          opacity: 0;
          transform: translateX(-20px);
          animation: slideInLeft 0.8s ease-out 3.2s forwards;
        }

        .text-king {
          font-size: 38px;
          font-weight: 900;
          background: linear-gradient(to bottom, ${emerald500}, ${emerald600});
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
              id="emeraldMetal"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={emerald500} />
              <stop offset="100%" stopColor={emerald600} />
            </linearGradient>

            <linearGradient
              id="lineGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#FF4136" />
              <stop offset="100%" stopColor={emerald500} />
            </linearGradient>
          </defs>

          {/* Red Candles */}
          <g className="candle candle-r1">
            <line
              x1="60"
              y1="125"
              x2="60"
              y2="165"
              stroke="#FF4136"
              strokeWidth="2"
            />
            <rect
              x="54"
              y="135"
              width="12"
              height="20"
              fill="#B31217"
              rx="2"
            />
          </g>

          <g className="candle candle-r2">
            <line
              x1="85"
              y1="110"
              x2="85"
              y2="175"
              stroke="#FF4136"
              strokeWidth="2"
            />
            <rect
              x="79"
              y="120"
              width="12"
              height="40"
              fill="#B31217"
              rx="2"
            />
          </g>

          <g className="candle candle-r3">
            <line
              x1="110"
              y1="140"
              x2="110"
              y2="180"
              stroke="#FF4136"
              strokeWidth="2"
            />
            <rect
              x="104"
              y="150"
              width="12"
              height="15"
              fill="#B31217"
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
            fill="url(#emeraldMetal)"
          >
            $
          </text>

          {/* LOWERED CROWN */}
          <g className="crown">
            <path
              d="M 120 68 L 130 33 L 155 53 L 175 23 L 195 53 L 220 33 L 230 68 Z"
              fill="url(#emeraldMetal)"
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
          <div className="h-px w-8 bg-emerald-500 mx-2"></div>

          <span className="text-[10px] text-slate-400 tracking-[3px] uppercase font-bold">
            Rule The Market
          </span>

          <div className="h-px w-8 bg-emerald-500 mx-2"></div>
        </div>
      </div>
    </div>
  );
};

function Home() {
  const navigate = useNavigate();

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

  return (
    <div className="bg-[#020617] text-white overflow-x-hidden">

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
        from-[#020617]
        via-[#0f172a]
        to-[#020617]
      "
      >
        {/* LEFT CONTENT */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left order-2 md:order-1">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Master Trading <br />
            <span className="text-emerald-400">Without Risk</span>
          </h1>

          <p className="mt-6 text-slate-400 max-w-xl">
            Practice stock trading using virtual money and learn market
            strategies safely.
          </p>

          <Link
            to="/register"
            className="mt-8 px-10 py-4 bg-emerald-500 text-black rounded-lg hover:bg-emerald-600 transition font-bold text-lg"
          >
            Get Started
          </Link>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex justify-center md:justify-end order-1 md:order-2 py-10">
          <LogoAnimation />
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px bg-slate-800 mx-10"></div>

      {/* IMAGE SECTION */}
      <section className="py-16 px-6 md:px-16 flex flex-col md:flex-row-reverse gap-10 items-center">
        <img
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"
          alt="stocks"
          className="rounded-lg h-64 w-full md:w-1/2 object-cover border border-slate-800 hover:scale-105 transition"
        />

        <div className="md:w-1/2">
          <h2 className="text-2xl font-semibold">
            Realistic Trading Experience
          </h2>

          <p className="text-slate-400 mt-3">
            Simulate buying and selling stocks with live-like price movements.
          </p>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px bg-slate-800 mx-10"></div>

      {/* MARKET TREND */}
      <section className="py-16 px-6 md:px-16 grid md:grid-cols-2 gap-10 items-center">
        <div className="bg-[#030820] border border-slate-800 rounded-lg p-6">
          <div className="flex items-end gap-2 h-48">
            {[20, 40, 35, 60, 55, 70, 65, 80, 75, 90].map((h, i) => (
              <div
                key={i}
                className="bg-emerald-400 w-full rounded-md hover:bg-emerald-500 transition"
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">
            Market Trend Simulation
          </h2>

          <p className="text-slate-400 mt-3">
            Visualize stock price movements and understand how the market
            behaves in real-time scenarios.
          </p>
        </div>
      </section>

      <div className="h-px bg-slate-800 mx-10"></div>

      {/* LEARN SECTION */}
      <section className="py-16 px-6 md:px-16 flex flex-col md:flex-row-reverse gap-10 items-center">
        <img
          // src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80"
          // src="../assets/stockking.mp4"
          src={vid}
          alt="analysis"
          className="rounded-lg h-64 w-full md:w-1/2 object-cover border border-slate-800 hover:scale-105 transition"
        />

        <div className="md:w-1/2">
          <h2 className="text-2xl font-semibold">
            Learn Before You Invest
          </h2>

          <p className="text-slate-400 mt-3">
            Understand stock market basics, risk management, and portfolio
            building.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-24 bg-gradient-to-t from-[#0f172a] to-transparent">
        <h2 className="text-3xl font-bold mb-6">
          Start Your Trading Journey Today
        </h2>

        <Link
          to="/register"
          className="px-8 py-3 bg-emerald-500 text-black rounded-lg hover:bg-emerald-600 transition font-bold"
        >
          Start Trading Now
        </Link>
      </section>
    </div>
  );
}

export default Home;