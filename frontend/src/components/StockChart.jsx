import {
   ReferenceLine,
   ResponsiveContainer,
   AreaChart,
   Area,
   XAxis,
   YAxis,
   Tooltip,
   CartesianGrid
} from "recharts";

function StockChart({
   chartData,
   range
}) {
   if (!chartData || chartData.length === 0) {
      const isLive = range === "LIVE";
      return (
         <div className="flex h-full items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
            <div className="flex flex-col items-center gap-3">
               {!isLive && <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>}
               <p className="animate-pulse">
                  {isLive ? "Connecting to live market stream..." : `Fetching ${range || 'historical'} performance data...`}
               </p>
            </div>
         </div>
      );
   }

   // Map new OHLC data format to old price/date format if needed
   const processedData = chartData.map(item => ({
      ...item,
      date: item.date || (item.time ? new Date(item.time * 1000).toISOString() : ''),
      price: item.price || item.close
   }));

   const firstPrice = processedData[0]?.price || 0;

   return (
      <div className="h-full w-full pb-6">
         <ResponsiveContainer
            width="100%"
            height="100%"
         >
            <AreaChart
               data={processedData}
               margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 30
               }}
            >
               <defs>
                  <linearGradient
                     id="colorPrice"
                     x1="0"
                     y1="0"
                     x2="0"
                     y2="1"
                  >
                     <stop
                        offset="5%"
                        stopColor="#6366f1"
                        stopOpacity={0.15}
                     />
                     <stop
                        offset="95%"
                        stopColor="#6366f1"
                        stopOpacity={0}
                     />
                  </linearGradient>
               </defs>

               <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                  opacity={0.8}
               />

               <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10, fontWeight: 'semibold', fill: '#64748b' }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                  tickFormatter={(value) => {
                     const date = new Date(value);
                     if (isNaN(date.getTime())) return value;
                     
                     if (range === "LIVE") {
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                     }
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
                  stroke="#94a3b8"
                  width={80}
                  tick={{ fontSize: 10, fontWeight: 'semibold', fill: '#64748b' }}
                  tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  domain={[
                     (dataMin) => dataMin - (Math.abs(dataMin) * 0.01),
                     (dataMax) => dataMax + (Math.abs(dataMax) * 0.01)
                  ]}
               />

               <Tooltip
                  labelFormatter={(value) => {
                     if (range === "LIVE") return value;
                     const date = new Date(value);
                     if (isNaN(date.getTime())) return value;
                     if (range === "1D") {
                        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                     }
                     return date.toLocaleDateString([], {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      });
                  }}
                  formatter={(value) => [
                     `$${Number(value).toFixed(2)}`,
                     "Price"
                  ]}
                  contentStyle={{
                     backgroundColor: "#ffffff",
                     border: "1px solid #e2e8f0",
                     borderRadius: "12px",
                     color: "#0f172a",
                     boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                     fontWeight: "bold",
                     fontSize: "12px"
                  }}
               />

               <ReferenceLine 
                  y={firstPrice} 
                  stroke="#6366f1" 
                  strokeDasharray="3 3" 
                  opacity={0.3} 
               />

               <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#6366f1"
                  fill="url(#colorPrice)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 0 }}
                  animationDuration={1500}
               />
            </AreaChart>
         </ResponsiveContainer>
      </div>
   );
}

export default StockChart;
