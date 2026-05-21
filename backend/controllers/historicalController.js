import axios from "axios";
import { stockModel } from "../models/StockModel.js";
import { stockCache } from "../services/cacheService.js";


// GET HISTORICAL STOCK DATA

export const getStockHistory = async (req, res) => {
   try {
      const { symbol } = req.params;
      const range = req.query.range || "1D";
      console.log(`[Historical] Fetching ${symbol} for range: ${range}`);

      // Verify that the requested stock exists in the database
      const stock = await stockModel.findOne({
         stockSymbol: symbol.toUpperCase()
      });

      if (!stock) {
         return res.status(404).json({
            success: false,
            message: `Stock "${symbol.toUpperCase()}" is not registered in the simulator.`
         });
      }

      const cacheKey = `history_v3_${symbol}_${range}`; // Bumped to v3 to clear any old OHLC cache

      // 1. CHECK CACHE
      const cachedData = stockCache.get(cacheKey);
      if (cachedData) {
         console.log(`History Cache Hit (v2): ${symbol} (${range})`);
         return res.status(200).json({
            success: true,
            data: cachedData,
            source: "cache"
         });
      }

      let formattedData = null;

      // ==========================================
      // 2. TRY ALPHA VANTAGE (Primary Source)
      // ==========================================
      try {
         let avResponse;
         if (range === "1D") {
            avResponse = await axios.get("https://www.alphavantage.co/query", {
               params: {
                  function: "TIME_SERIES_INTRADAY",
                  symbol,
                  interval: "5min",
                  outputsize: "full",
                  apikey: process.env.ALPHA_VANTAGE_API_KEY
               }
            });
         } else {
            avResponse = await axios.get("https://www.alphavantage.co/query", {
               params: {
                  function: "TIME_SERIES_DAILY",
                  symbol,
                  outputsize: "full",
                  apikey: process.env.ALPHA_VANTAGE_API_KEY
               }
            });
         }

         const avData = avResponse.data;
         const timeSeries = range === "1D" ? avData["Time Series (5min)"] : avData["Time Series (Daily)"];

         if (timeSeries) {
            formattedData = Object.entries(timeSeries).map(([date, values]) => {
               // lightweight-charts needs time in seconds or YYYY-MM-DD
               const timestamp = Math.floor(new Date(date).getTime() / 1000);
               return {
                  time: timestamp,
                  price: Number(values["4. close"]),
                  value: Number(values["5. volume"] || 0)
               };
            }).sort((a, b) => a.time - b.time);

            // Slicing
            const sliceMap = { "1D": 78, "5D": 390, "1M": 30, "3M": 90, "1Y": 250, "MAX": 1000 };
            formattedData = formattedData.slice(-(sliceMap[range] || 30));
         }
      } catch (avError) {
         console.log(`AlphaVantage Failed for ${symbol}:`, avError.message);
      }

      // ==========================================
      // 3. TRY FINNHUB (Fallback Source)
      // ==========================================
      if (!formattedData) {
         try {
            console.log(`Trying Finnhub fallback for ${symbol}`);
            const to = Math.floor(Date.now() / 1000);
            const daysMap = { "1D": 1, "5D": 5, "1M": 30, "3M": 90, "1Y": 365, "MAX": 1825 };
            const from = to - (daysMap[range] || 30) * 24 * 60 * 60;
            const resolution = range === "1D" ? "5" : "D";

            const fhResponse = await axios.get("https://finnhub.io/api/v1/stock/candle", {
               params: {
                  symbol,
                  resolution,
                  from,
                  to,
                  token: process.env.FINNHUB_API_KEY
               }
            });

            if (fhResponse.data.s === "ok") {
               formattedData = fhResponse.data.t.map((t, i) => ({
                  time: t,
                  price: Number(fhResponse.data.c[i]),
                  value: Number(fhResponse.data.v[i])
               }));
            }
         } catch (fhError) {
            console.log(`Finnhub Failed for ${symbol}:`, fhError.message);
         }
      }

      // ==========================================
      // 4. SMART UNIQUE DUMMY DATA (Last Resort)
      // ==========================================
      if (!formattedData || formattedData.length === 0) {
         console.log(`[Historical] Generating dummy data for ${symbol} (${range})`);
         const dummyData = [];
         const now = new Date();
         const seed = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
         let basePrice = 100 + (seed % 400);

         // Use last known price if available
         const stockCacheData = stockCache.get(`stock_${symbol}`);
         if (stockCacheData && stockCacheData.currentPrice) {
            basePrice = stockCacheData.currentPrice;
         }

         const config = {
            "1D": { points: 78, interval: 300 },      // 6.5 hours, 5 min intervals
            "5D": { points: 120, interval: 3600 },    // 5 days, 1 hour intervals
            "1M": { points: 30, interval: 86400 },    // 30 days, 1 day intervals
            "3M": { points: 90, interval: 86400 },    // 90 days, 1 day intervals
            "1Y": { points: 250, interval: 86400 },   // 250 trading days, 1 day intervals
            "MAX": { points: 500, interval: 86400 }   // 500 days, 1 day intervals
         };

         const { points: totalPoints, interval: intervalSec } = config[range] || config["1M"];

         let currentPrice = basePrice;
         for (let i = 0; i <= totalPoints; i++) {
            const time = Math.floor((now.getTime() - (totalPoints - i) * intervalSec * 1000) / 1000);
            
            // Random walk: previous price + small random change
            const volatility = 0.003; // 0.3% max move per point (reduced for smoothness)
            const change = currentPrice * volatility * (Math.random() - 0.5);
            currentPrice = Math.max(1, currentPrice + change);
            
            dummyData.push({
               time,
               price: Number(currentPrice.toFixed(2)),
               value: Math.floor(Math.random() * 1000000)
            });
         }
         formattedData = dummyData;
         console.log(`[Historical] Generated ${formattedData.length} random-walk points`);
      }

      // ==========================================
      // 5. CACHE & RETURN
      // ==========================================
      stockCache.set(cacheKey, formattedData, 3600); 
      console.log(`[Historical] Sending ${formattedData.length} points for ${symbol}`);
      
      return res.status(200).json({
         success: true,
         data: formattedData,
         source: "final_fallback"
      });

   } catch (error) {
      console.error("Historical Controller Error:", error.stack);
      res.status(500).json({ success: false, message: "Server error fetching history" });
   }
};