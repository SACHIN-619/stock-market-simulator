import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAllStocks,
  getStockDetails,
  addStock,
  deleteStock,
  toggleStockStatus,
} from "../service/stockService";

import StockCard from "./StockCard";
import { CardSkeleton } from "./Skeleton";
import { Sparkline } from "./TraderTerminal";

function Stocks() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  // STOCK DATA
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);

  // SEARCH + PAGINATION
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStocks, setTotalStocks] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [totalExchanges, setTotalExchanges] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // LOADING STATES
  const [loadingStock, setLoadingStock] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const [fetchingStocks, setFetchingStocks] = useState(false);
  // FILTER STATES
  // MAIN LOADING
  const [loading, setLoading] = useState(false);

  // FORM DATA
  const [stockData, setStockData] = useState({
    stockSymbol: "",
  });

  // FETCH STOCKS
  const fetchStocks = async () => {
    try {
      setLoading(true);

      const data = await getAllStocks(page, search, 9);
      console.log("Stocks data received:", data);

      const allStocks = data.payload || [];

      // Fetch live details for each stock
      const detailedStocks = await Promise.all(
        allStocks.map(async (stock) => {
          try {
            const details = await getStockDetails(stock.stockSymbol);
            return { ...stock, ...details.payload }; // Merge DB data and live data
          } catch (err) {
            console.error(`Failed to fetch details for ${stock.stockSymbol}`);
            return stock; // Return DB data if live fetch fails
          }
        })
      );

      setStocks(detailedStocks);
      setTotalPages(data.totalPages || 1);
      setTotalStocks(data.totalStocks || 0);
      setTotalActive(data.totalActive || 0);
      setTotalInactive(data.totalInactive || 0);
      setTotalExchanges(data.totalExchanges || 0);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // FETCH ON LOAD
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchStocks();
    }, 400);

    return () => clearTimeout(debounce);
  }, [page, search]);

  // UNIQUE EXCHANGES LIST
  const uniqueExchanges = useMemo(() => {
    return [...new Set(stocks.map((s) => s.exchange).filter(Boolean))];
  }, [stocks]);

  // FILTER STOCKS
  useEffect(() => {
    let filtered = [...stocks];

    // SEARCH FILTER
    filtered = filtered.filter(
      (stock) =>
        stock.stockSymbol
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        stock.companyName
          ?.toLowerCase()
          .includes(search.toLowerCase())
    );

    // STATUS FILTER
    if (role === "trader") {
      filtered = filtered.filter((stock) => stock.isActive);
    } else {
      if (statusFilter === "active") {
        filtered = filtered.filter((stock) => stock.isActive);
      }
      if (statusFilter === "inactive") {
        filtered = filtered.filter((stock) => !stock.isActive);
      }
    }

    // EXCHANGE FILTER
    if (exchangeFilter !== "all") {
      filtered = filtered.filter(
        (stock) => stock.exchange?.toLowerCase() === exchangeFilter.toLowerCase()
      );
    }

    setFilteredStocks(filtered);
  }, [stocks, search, statusFilter, exchangeFilter, role]);

  // HANDLE INPUT
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  const handleChange = (e) => {

    const { name, value } = e.target;

    setStockData({
      ...stockData,

      [name]:
        name === "stockSymbol"
          ? value.toUpperCase()
          : value,
    });
  };

  // =====================================
  // ADD STOCK
  // =====================================
  const handleAddStock = async (e) => {
    e.preventDefault();

    try {
      setAddingStock(true);

      const cleanedSymbol =
        stockData.stockSymbol.trim().toUpperCase();

      const symbolRegex = /^[A-Z.]{1,10}$/;

      if (!cleanedSymbol) {
        return alert("Stock symbol is required");
      }

      if (!symbolRegex.test(cleanedSymbol)) {
        return alert("Enter valid stock symbol");
      }

      await addStock({
        stockSymbol: cleanedSymbol,
      });

      fetchStocks();

      setStockData({

        stockSymbol: ""

      });

      alert("Stock added successfully");
    } catch (error) {
      console.log(error);

      alert(

        error.response?.data?.message ||
        "Unable to add stock"
      );
    } finally {
      setAddingStock(false);
    }
  };
  // =====================================
  // DELETE STOCK
  const handleDelete = async (stockSymbol) => {
    const confirmDelete = window.confirm(
      `Delete ${stockSymbol}?`
    );

    if (!confirmDelete) return;
    try {
      await deleteStock(stockSymbol);

      fetchStocks();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Failed to delete stock"
      );
    }
  };

  // TOGGLE STATUS
  const handleToggleStatus = async (stock) => {
    if (stock.isActive && !window.confirm(`Are you sure you want to make ${stock.stockSymbol} inactive?`)) {
      return;
    }
    try {
      setLoadingStock(stock.stockSymbol);

      await toggleStockStatus(stock.stockSymbol);

      fetchStocks();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Failed to update stock"
      );
    } finally {
      setLoadingStock("");
    }
  };

  // FORMAT MARKET CAP
  const formatMarketCap = (num) => {
    if (!num || num === 0) return "N/A";

    // Finnhub provides market cap in Millions.
    // 1,000,000 Millions = 1 Trillion
    // 1,000 Millions = 1 Billion
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "T";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + "B";
    }
    return num.toFixed(2) + "M";
  };

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-slate-800 px-6 py-8 space-y-8">

      {/* HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">

        {/* LEFT */}
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Market Explorer
          </h1>

          <p className="mt-2 text-slate-500 font-medium">
            Discover and manage global assets
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col md:flex-row items-center gap-3">

          {/* SEARCH */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 text-slate-800"
            />
          </div>

          {/* FILTER BUTTON */}
          <button
            onClick={() =>
              setShowFilters(!showFilters)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition cursor-pointer flex items-center gap-2"
          >
            ⚙️ Filters
          </button>
        </div>
      </header>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="glass-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">
          <h2 className="text-lg font-black text-slate-900">
            Filter Stocks
          </h2>

          <div className="space-y-4">
            {/* STATUS FILTER (MANAGERS ONLY) */}
            {role !== "trader" && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer
                    ${statusFilter === "all"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    All
                  </button>

                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer
                    ${statusFilter === "active"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    Active
                  </button>

                  <button
                    onClick={() => setStatusFilter("inactive")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer
                    ${statusFilter === "inactive"
                        ? "bg-red-500 text-white shadow-md shadow-red-500/10"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            )}

            {/* EXCHANGE FILTER */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exchange</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setExchangeFilter("all")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer
                  ${exchangeFilter === "all"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  All Exchanges
                </button>
                {uniqueExchanges.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setExchangeFilter(ex)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer
                    ${exchangeFilter === ex
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Stocks
          </p>

          <h2 className="mt-2 text-3xl font-black text-slate-900">
            {role === "trader" ? totalActive : totalStocks}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Exchanges
          </p>

          <h2 className="mt-2 text-3xl font-black text-blue-600">
            {totalExchanges}
          </h2>
        </div>

        {role !== "trader" && (
          <>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Active
              </p>

              <h2 className="mt-2 text-3xl font-black text-emerald-500">
                {totalActive}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Inactive
              </p>

              <h2 className="mt-2 text-3xl font-black text-red-500">
                {totalInactive}
              </h2>
            </div>
          </>
        )}

      </section>

      {/* MANAGER TOOLS */}
      {role === "stockmanager" && (
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-lg font-black text-slate-900">
            Stock Management
          </h2>

          <form
            onSubmit={handleAddStock}
            className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4"
          >

            <input
              type="text"
              name="stockSymbol"
              placeholder="Stock Symbols ex:AAPL"
              value={stockData.stockSymbol}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 text-slate-900"
            />


            <button
              type="submit"
              disabled={addingStock}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 cursor-pointer shadow-md shadow-indigo-600/10"
            >
              {addingStock
                ? "Adding..."
                : "+ Add Stock"}
            </button>
          </form>
        </section>
      )}

      {/* STOCK GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {loading ? (
          [...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))
        ) : filteredStocks.length > 0 ? (
          [...filteredStocks]
            .sort((a, b) => (b.isActive === a.isActive ? 0 : b.isActive ? 1 : -1))
            .map((stock) => (
              <div
                key={stock._id}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_15px_rgba(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/25 hover:shadow-md"
              >

                {/* TOP */}
                <div className="flex items-start justify-between">

                  <div className={`flex gap-4 transition-opacity ${!stock.isActive ? 'opacity-30 grayscale' : 'opacity-100'}`}>

                    {/* LOGO */}
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {stock.logo ? (
                        <img
                          src={stock.logo}
                          alt={stock.companyName}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl font-black text-slate-700">
                          {stock.stockSymbol[0]}
                        </span>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-slate-900">
                        {stock.stockSymbol}
                      </h2>
                      {stock.exchange && (
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-600 rounded-md border border-blue-100" title={stock.exchange}>
                            {stock.exchange}
                          </span>
                        </div>
                      )}

                      <p className="mt-1 text-xs text-slate-400 font-semibold truncate max-w-[150px]" title={stock.companyName}>
                        {stock.companyName}
                      </p>
                    </div>
                  </div>

                  {/* STATUS (FOR MANAGERS) */}
                  {role !== "trader" && (
                    <button
                      disabled={
                        loadingStock ===
                        stock.stockSymbol
                      }
                      onClick={() =>
                        handleToggleStatus(stock)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${stock.isActive
                          ? "border-emerald-500/10 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "border-red-500/10 bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${stock.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {stock.isActive
                        ? "Active"
                        : "Inactive"}
                    </button>
                  )}
                </div>

                {/* CHART (FOR TRADERS ONLY) */}
                {role === "trader" && (
                  <div className={`mt-4 w-full transition-opacity ${!stock.isActive ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                    <Sparkline symbol={stock.stockSymbol} color="#6366f1" />
                  </div>
                )}

                {/* DETAILS */}
                <div className={`mt-5 grid grid-cols-2 gap-4 transition-opacity ${!stock.isActive ? 'opacity-30' : 'opacity-100'}`}>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Price</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {stock.c ? `$${stock.c.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Change</p>
                    <p className={`mt-1 text-sm font-bold flex items-center gap-1 ${stock.d >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stock.d ? (
                        <>
                          <span>{stock.d >= 0 ? '▲' : '▼'}</span>
                          {stock.d >= 0 ? '+' : ''}{stock.d.toFixed(2)} ({stock.dp.toFixed(2)}%)
                        </>
                      ) : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Sector
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700 truncate max-w-[110px]" title={stock.sector}>
                      {stock.sector || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Country
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {stock.country || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      Market Cap
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatMarketCap(
                        stock.marketCapitalization
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      IPO
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {stock.ipo || "N/A"}
                    </p>
                  </div>
                </div>

                {/* FOOTER (Dimmed when inactive) */}
                <div className={`mt-6 flex items-center justify-between border-t border-slate-100 pt-4 transition-opacity ${!stock.isActive ? 'opacity-40' : 'opacity-100'}`}>

                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Added{" "}
                    {new Date(
                      stock.createdAt
                    ).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        navigate(
                          `/stocks/${stock.stockSymbol}`
                        )
                      }
                      className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100/70 cursor-pointer"
                    >
                      View
                    </button>

                    {role === "stockmanager" && (
                      <button
                        onClick={() =>
                          handleDelete(
                            stock.stockSymbol
                          )
                        }
                        className="rounded-xl bg-red-50 border border-red-100 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100/70 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="col-span-full rounded-3xl border border-slate-100 bg-white py-20 text-center shadow-xs">
            <div className="text-5xl">
              🔍
            </div>

            <h2 className="mt-4 text-2xl font-black text-slate-900">
              No Stocks Found
            </h2>

            <p className="mt-2 text-slate-500 font-medium">
              Try changing search or filters
            </p>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-4 text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-4 pt-6">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-500 disabled:opacity-40 cursor-pointer"
        >
          Previous
        </button>

        <span className="text-sm font-semibold text-slate-400">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-500 disabled:opacity-40 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Stocks;
