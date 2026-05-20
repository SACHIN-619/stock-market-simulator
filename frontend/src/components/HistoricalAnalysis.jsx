import { useEffect, useState } from "react";
import api from "../service/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const ranges = ["1D", "5D", "1M", "1Y", "MAX"];

function HistoricalAnalysis({ symbol }) {
  const [data, setData] = useState([]);
  const [range, setRange] = useState("1M");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fixed: Prevent requests when symbol context is undefined or blank
    if (!symbol) return;

    let isMounted = true;
    
    const fetchHistoricalData = async (selectedRange) => {
      try {
        setLoading(true);
        const response = await api.get(
          `/historical/history/${symbol.toUpperCase()}?range=${selectedRange}`
        );

        if (isMounted) {
          const rawData = response.data?.data || response.data || [];
          
          if (response.data?.success || Array.isArray(rawData)) {
            // Fixed: Standardize property fields to support both 'price' and 'close' schemas
            const normalizedData = rawData.map(item => {
              const basePrice = item.price !== undefined ? item.price : item.close;
              return {
                ...item,
                price: typeof basePrice === 'number' ? basePrice : parseFloat(basePrice) || 0,
                date: item.date || item.timestamp
              };
            });
            setData(normalizedData);
          } else {
            setData([]);
          }
        }
      } catch (error) {
        console.error("Historical fetch error:", error);
        if (isMounted) setData([]); // Fixed: Clear out stale dataset lines if backend errors out
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistoricalData(range);

    return () => {
      isMounted = false;
    };
  }, [range, symbol]);

  return (
    <div className="rounded-2xl bg-slate-800 p-6">

      {/* TOP BAR */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Historical Analysis
        </h2>

        {/* RANGE BUTTONS */}
        <div className="flex gap-2">
          {ranges.map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer
                ${
                  range === item
                    ? "bg-green-500 text-black shadow-md shadow-green-500/20"
                    : "bg-slate-700 text-white hover:bg-slate-600"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* CHART VIEWPORT CONTAINER */}
      <div className="h-[500px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm font-semibold tracking-wider">
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-green-500" />
            LOADING HISTORICAL DATA...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm font-bold uppercase tracking-widest">
            No Historical Tick Data Found
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.3} />

              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                tickLine={false}
                dy={10}
                tickFormatter={(value) => {
                  if (!value) return "";
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return value;
                  if (range === "1D") {
                    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  }
                  if (range === "5D") {
                    return date.toLocaleDateString([], { weekday: "short" });
                  }
                  return date.toLocaleDateString([], { month: "short", day: "numeric" });
                }}
              />

              <YAxis 
                domain={["auto", "auto"]} 
                stroke="#64748b"
                tickLine={false}
                dx={-5}
                tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
              />

              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '1rem' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                labelFormatter={(value) => {
                  if (!value) return "";
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return value;
                  if (range === "1D") {
                    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  }
                  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
              />

              <Line
                type="monotone"
                dataKey="price"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#22c55e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default HistoricalAnalysis;