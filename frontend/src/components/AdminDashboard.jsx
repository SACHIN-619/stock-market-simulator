import { useEffect, useState, useMemo } from "react";
import {
  getAllUsersForAdmin,
  toggleUserStatus,
  deleteUser,
  getUserTransactionsForAdmin,
  getUserPortfolioForAdmin
} from "../service/userService";
import { getAllStocks, getStockDetails } from "../service/stockService";
import { getAdminActivities, clearAdminActivities as clearHistory } from "../service/adminActivityService";
import CoinIcon from "./CoinIcon";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sidebar / Navigation State
  const [activeMenu, setActiveMenu] = useState("users"); // 'users' | 'stocks'

  // Stocks State
  const [stocks, setStocks] = useState([]);
  const [stockPage, setStockPage] = useState(1);
  const [totalStockPages, setTotalStockPages] = useState(1);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userStatusFilter, setUserStatusFilter] = useState("all"); // 'all' | 'active' | 'blocked'
  const [showFilters, setShowFilters] = useState(false);
  const [stockStatusFilter, setStockStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  const [stockExchangeFilter, setStockExchangeFilter] = useState("all");
  const [showStockFilters, setShowStockFilters] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [totalActiveStocks, setTotalActiveStocks] = useState(0);

  // Activity History State
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalTab, setModalTab] = useState("transactions"); // 'transactions' | 'portfolio'
  const [modalData, setModalData] = useState({ transactions: [], portfolio: [], summary: {} });
  const [modalLoading, setModalLoading] = useState(false);
  const [isAdminCollapsed, setIsAdminCollapsed] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsersForAdmin();
      setUsers(response.payload);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStocksData = async () => {
    try {
      setStocksLoading(true);
      const response = await getAllStocks(stockPage, stockSearch, 8);
      const stockList = response.payload || [];
      setTotalStockPages(response.totalPages || 1);
      setTotalActiveStocks(response.totalActive || 0);

      // Fetch live details for each stock
      const detailedStocks = await Promise.all(
        stockList.map(async (stock) => {
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
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
    } finally {
      setStocksLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await getAdminActivities();
      setActivities(response.payload || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear the entire activity history? This cannot be undone.")) {
      try {
        await clearHistory();
        setActivities([]); // Update UI immediately
      } catch (err) {
        alert("Failed to clear history");
      }
    }
  };

  useEffect(() => {
    if (activeMenu === "users") {
      fetchUsers();
    }
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu === "stocks") {
      const timeout = setTimeout(() => {
        fetchStocksData();
      }, 500);
      return () => clearTimeout(timeout);
    } else if (activeMenu === "history") {
      fetchActivities();
    }
  }, [activeMenu, stockPage, stockSearch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // --- ACTIONS ---

  const handleToggleStatus = async (user) => {
    if (user.isUserActive && !window.confirm(`Are you sure you want to block user ${user.username}?`)) {
      return;
    }
    try {
      await toggleUserStatus(user._id);
      fetchUsers(); // Refresh list
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to completely delete this user and all their transactions?")) {
      try {
        await deleteUser(userId);
        fetchUsers(); // Refresh list
      } catch (err) {
        alert("Failed to delete user");
      }
    }
  };

  const openUserDetails = async (user) => {
    setSelectedUser(user);
    setModalLoading(true);
    setModalTab("transactions");
    try {
      const [txRes, pfRes] = await Promise.all([
        getUserTransactionsForAdmin(user._id),
        getUserPortfolioForAdmin(user._id)
      ]);
      setModalData({
        transactions: txRes.payload,
        portfolio: pfRes.payload,
        summary: pfRes.summary
      });
    } catch (err) {
      alert("Failed to fetch user details");
      setSelectedUser(null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  const uniqueStockExchanges = useMemo(() => {
    return [...new Set(stocks.map((s) => s.exchange).filter(Boolean))];
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    let filtered = [...stocks];

    // STATUS FILTER
    if (stockStatusFilter === "active") {
      filtered = filtered.filter((stock) => stock.isActive);
    } else if (stockStatusFilter === "inactive") {
      filtered = filtered.filter((stock) => !stock.isActive);
    }

    // EXCHANGE FILTER
    if (stockExchangeFilter !== "all") {
      filtered = filtered.filter(
        (stock) => stock.exchange?.toLowerCase() === stockExchangeFilter.toLowerCase()
      );
    }

    return filtered;
  }, [stocks, stockStatusFilter, stockExchangeFilter]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userStatusFilter === "all" ||
      (userStatusFilter === "active" && u.isUserActive) ||
      (userStatusFilter === "blocked" && !u.isUserActive);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => (b.isUserActive === a.isUserActive ? 0 : b.isUserActive ? 1 : -1));

  const totalUserPages = Math.ceil(filteredUsers.length / 8) || 1;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F0]">
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F5F0]">
        <div className="rounded-[2rem] border border-red-100 bg-red-50/50 p-8 text-red-650 max-w-md shadow-sm">
          <h2 className="text-xl font-black mb-2 tracking-tight">Error</h2>
          <p className="text-sm text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F5F0] text-slate-800 font-sans">

      {/* Sidebar */}
      <div className={`transition-all duration-300 ${isAdminCollapsed ? "w-20" : "w-64"} bg-[#EFEFEA] border-r border-slate-200/30 flex flex-col sticky top-16 h-[calc(100vh-64px)] z-20 overflow-y-auto`}>

        {/* Toggle Button */}
        <div className={`px-4 py-4 flex ${isAdminCollapsed ? "justify-center" : "justify-end"}`}>
          <button
            onClick={() => setIsAdminCollapsed(!isAdminCollapsed)}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            title={isAdminCollapsed ? "Expand" : "Collapse"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-500 ${isAdminCollapsed ? "rotate-180" : ""}`}>
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { key: 'users', label: 'Traders', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
            { key: 'stocks', label: 'Stocks', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg> },
            { key: 'history', label: 'Activity', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setActiveMenu(item.key)}
              title={item.label}
              className={`w-full flex items-center ${isAdminCollapsed ? 'justify-center' : 'gap-4'} px-4 py-3 rounded-xl transition-all border cursor-pointer ${activeMenu === item.key
                  ? 'bg-[#E0EFFF] text-[#1D4ED8] border-[#BCD6F2] font-black shadow-2xs'
                  : 'text-slate-550 hover:bg-[#E4E5DF] hover:text-slate-800 border-transparent font-semibold'
                }`}
            >
              <div className="shrink-0 w-5 h-5">{item.icon}</div>
              {!isAdminCollapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
            </button>
          ))}
        </nav>
        {!isAdminCollapsed && (
          <div className="px-4 mb-4">
            <div className="p-4 rounded-2xl bg-[#E0EFFF]/40 border border-[#BCD6F2]/40">
              <p className="text-[10px] font-black text-[#1D4ED8] uppercase tracking-widest mb-1">Admin Panel</p>
              <p className="text-[10px] font-bold text-slate-550 leading-relaxed uppercase">Manage traders, stocks and activity logs.</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 sm:p-10 relative overflow-y-auto">

        {activeMenu === 'users' && (
          <>
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  Traders <span className="text-blue-600">Information</span>
                </h1>
                <p className="mt-2 text-slate-550 font-semibold">System overview and trader management</p>
              </div>

              <div className="flex items-center gap-4 flex-1 max-w-2xl justify-end">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search traders..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${showFilters
                      ? "border-blue-500 text-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600"
                    }`}
                >
                  ⚙️ Filters
                </button>

                <div className="hidden sm:block">
                  <div className="rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm backdrop-blur-md whitespace-nowrap">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Total Traders</p>
                    <p className="text-xl font-black text-blue-600">{users.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FILTER PANEL */}
            {showFilters && (
              <div className="mb-8 glass-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5 animate-fade-in">
                <h2 className="text-lg font-black text-slate-900">
                  Filter Traders
                </h2>

                <div className="space-y-4">
                  {/* STATUS FILTER */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setUserStatusFilter("all");
                          setUserPage(1);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5
                        ${userStatusFilter === "all"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        All
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${userStatusFilter === "all"
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-500"
                          }`}>
                          {users.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setUserStatusFilter("active");
                          setUserPage(1);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5
                        ${userStatusFilter === "active"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        Active
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${userStatusFilter === "active"
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-500"
                          }`}>
                          {users.filter(u => u.isUserActive).length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setUserStatusFilter("blocked");
                          setUserPage(1);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5
                        ${userStatusFilter === "blocked"
                            ? "bg-red-500 text-white shadow-md shadow-red-500/10"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        Blocked
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${userStatusFilter === "blocked"
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-500"
                          }`}>
                          {users.filter(u => !u.isUserActive).length}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUsers
                .slice((userPage - 1) * 8, userPage * 8)
                .map((user) => (
                  <div
                    key={user._id}
                    className={`group relative flex flex-col overflow-hidden rounded-[2rem] border bg-white p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md ${!user.isUserActive ? 'border-red-100 bg-red-50/20' : 'border-slate-100 hover:border-blue-100'
                      }`}
                  >
                    {/* User Info Header */}
                    <div className="mb-6 flex items-center gap-4">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000/${user.profileImage.replace(/^\/+/, '')}`}
                          alt={user.username}
                          className={`h-12 w-12 rounded-xl object-cover border border-slate-200/60 ${!user.isUserActive ? 'grayscale opacity-50' : ''}`}
                        />
                      ) : (
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shadow-inner ${!user.isUserActive ? 'from-red-500 to-rose-600' : ''}`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 pr-2">
                        <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1" title={user.username}>
                          {user.username}
                        </h3>
                        <p className="text-xs font-semibold text-slate-450 line-clamp-1" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mb-4 h-px w-full bg-slate-100"></div>

                    {/* User Stats with Premium Custom SVG Icons */}
                    <div className={`flex-1 space-y-3 mb-6 text-sm transition-opacity ${!user.isUserActive ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-semibold flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                          </svg>
                          Wallet Balance
                        </span>
                        <span className="font-extrabold text-slate-900 flex items-center gap-0.5">
                          <CoinIcon className="w-auto h-auto" />
                          {formatCurrency(user.walletBalance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-semibold flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                          Total Transactions
                        </span>
                        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-650 border border-slate-200">
                          {user.totalTransactions}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-semibold flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                          </svg>
                          Joined Date
                        </span>
                        <span className="text-sm font-semibold text-slate-500">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-auto">
                      <button
                        onClick={() => openUserDetails(user)}
                        className={`w-full rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition border cursor-pointer ${!user.isUserActive
                            ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-150/80 hover:border-slate-250'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                          }`}
                      >
                        View Details
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`flex-1 rounded-xl py-2 text-xs font-black uppercase tracking-wider transition border cursor-pointer ${user.isUserActive
                              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100/80 hover:border-amber-250'
                              : 'bg-[#E0EFFF] text-[#1D4ED8] border-[#BCD6F2] hover:bg-[#E0EFFF]/80 hover:border-[#96C0EE] font-black'
                            }`}
                        >
                          {user.isUserActive ? "Block" : "Unblock"}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className={`flex-1 rounded-xl py-2 text-xs font-black uppercase tracking-wider transition border cursor-pointer ${!user.isUserActive
                              ? 'bg-red-50/80 text-red-650 border-red-200 hover:bg-red-100/80 hover:border-red-250'
                              : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100/85 hover:border-red-250'
                            }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                disabled={userPage === 1}
                onClick={() => setUserPage(userPage - 1)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 transition hover:border-blue-500 disabled:opacity-40 shadow-2xs font-semibold text-sm cursor-pointer text-slate-700"
              >
                Previous
              </button>

              <span className="text-sm font-semibold text-slate-500">
                Page {userPage} of {totalUserPages}
              </span>

              <button
                disabled={userPage === totalUserPages}
                onClick={() => setUserPage(userPage + 1)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 transition hover:border-blue-500 disabled:opacity-40 shadow-2xs font-semibold text-sm cursor-pointer text-slate-700"
              >
                Next
              </button>
            </div>
          </>
        )}

        {activeMenu === 'stocks' && (
          <>
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  Stocks <span className="text-blue-600">Dashboard</span>
                </h1>
                <p className="mt-2 text-slate-550 font-semibold">Market overview and stock management</p>
              </div>              <div className="flex items-center gap-4 flex-1 max-w-2xl justify-end">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={stockSearch}
                    onChange={(e) => {
                      setStockSearch(e.target.value);
                      setStockPage(1);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                <button
                  onClick={() => setShowStockFilters(!showStockFilters)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${showStockFilters
                      ? "border-blue-500 text-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600"
                    }`}
                >
                  ⚙️ Filters
                </button>

                <div className="hidden sm:block">
                  <div className="rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm backdrop-blur-md whitespace-nowrap">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Total Active</p>
                    <p className="text-xl font-black text-blue-600">{totalActiveStocks}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FILTER PANEL */}
            {showStockFilters && (
              <div className="mb-8 glass-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5 animate-fade-in">
                <h2 className="text-lg font-black text-slate-900">
                  Filter Stocks
                </h2>

                <div className="space-y-4">
                  {/* STATUS FILTER */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setStockStatusFilter("all");
                          setStockPage(1);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5
                        ${stockStatusFilter === "all"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                          }`}
                      >
                        All
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${stockStatusFilter === "all"
                            ? "bg-white/20 text-white"
                            : "bg-slate-250 text-slate-500"
                          }`}>
                          {stocks.length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setStockStatusFilter("active");
                          setStockPage(1);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5
                        ${stockStatusFilter === "active"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                          }`}
                      >
                        Active
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${stockStatusFilter === "active"
                            ? "bg-white/20 text-white"
                            : "bg-slate-250 text-slate-500"
                          }`}>
                          {stocks.filter(s => s.isActive).length}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setStockStatusFilter("inactive");
                          setStockPage(1);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5
                        ${stockStatusFilter === "inactive"
                            ? "bg-red-500 text-white shadow-md shadow-red-500/10"
                            : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                          }`}
                      >
                        Inactive
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${stockStatusFilter === "inactive"
                            ? "bg-white/20 text-white"
                            : "bg-slate-250 text-slate-500"
                          }`}>
                          {stocks.filter(s => !s.isActive).length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* EXCHANGE FILTER */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exchange</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setStockExchangeFilter("all");
                          setStockPage(1);
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer
                        ${stockExchangeFilter === "all"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                          }`}
                      >
                        All Exchanges
                      </button>
                      {uniqueStockExchanges.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => {
                            setStockExchangeFilter(ex);
                            setStockPage(1);
                          }}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer
                          ${stockExchangeFilter === ex
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                              : "bg-slate-100 text-slate-650 hover:bg-slate-200"
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

            {/* Stocks Grid */}
            {stocksLoading ? (
              <div className="flex items-center justify-center p-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredStocks.length > 0 ? (
                  [...filteredStocks]
                    .sort((a, b) => (b.isActive === a.isActive ? 0 : b.isActive ? 1 : -1))
                    .map((stock) => (
                      <div
                        key={stock._id}
                        className={`group relative flex flex-col overflow-hidden rounded-[2rem] border bg-white p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md ${!stock.isActive ? 'border-red-100 bg-red-50/20' : 'border-slate-100 hover:border-blue-100'
                          }`}
                      >
                        {/* Status Badge */}
                        <div className="absolute right-4 top-4">
                          {stock.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-650">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Stock Info Header */}
                        <div className="mb-6 flex items-center gap-4">
                          {stock.logo ? (
                            <img src={stock.logo} alt={stock.stockSymbol} className={`h-12 w-12 rounded-xl object-contain ${!stock.isActive ? 'grayscale opacity-50' : ''}`} />
                          ) : (
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shadow-inner ${!stock.isActive ? 'from-red-500 to-rose-600' : ''}`}>
                              {stock.stockSymbol.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-extrabold text-slate-900 line-clamp-1">
                              {stock.stockSymbol}
                            </h3>
                            <p className="text-xs font-semibold text-slate-450 line-clamp-1">
                              {stock.companyName}
                            </p>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="mb-4 h-px w-full bg-slate-100"></div>

                        {/* Stock Stats (Dimmed when inactive) */}
                        <div className={`flex-1 space-y-3 mb-6 text-sm transition-opacity ${!stock.isActive ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Current Price</span>
                            <span className="font-extrabold text-slate-900">
                              {stock.c ? `$${stock.c.toFixed(2)}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Change</span>
                            <span className={`font-extrabold ${typeof stock.d === 'number' ? (stock.d >= 0 ? 'text-emerald-600' : 'text-red-650') : 'text-slate-900'}`}>
                              {stock.d ? `${stock.d >= 0 ? '+' : ''}${stock.d.toFixed(2)} (${stock.dp.toFixed(2)}%)` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Prev Close</span>
                            <span className="text-slate-500 font-semibold">{stock.pc ? `$${stock.pc.toFixed(2)}` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Day High/Low</span>
                            <span className="text-slate-900 font-bold">{stock.h ? `$${stock.h.toFixed(2)} / $${stock.l.toFixed(2)}` : 'N/A'}</span>
                          </div>
                        </div>

                        {/* Actions (Optional or just info) */}
                        <div className="mt-auto text-[10px] text-slate-400 text-center font-bold">
                          Last updated: {stock.t ? new Date(stock.t * 1000).toLocaleTimeString() : 'N/A'}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-full rounded-[2.5rem] border border-slate-100 bg-white py-20 text-center shadow-xs w-full">
                    <div className="text-5xl">
                      🔍
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-slate-900">
                      No Stocks Found
                    </h2>

                    <p className="mt-2 text-slate-550 font-semibold">
                      Try changing search or filters
                    </p>

                    <button
                      onClick={() => {
                        setStockSearch("");
                        setStockStatusFilter("all");
                        setStockExchangeFilter("all");
                      }}
                      className="mt-4 text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setStockPage(Math.max(1, stockPage - 1))}
                disabled={stockPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 transition hover:border-blue-500 disabled:opacity-40 shadow-2xs font-semibold text-sm cursor-pointer text-slate-700"
              >
                Previous
              </button>
              <span className="flex items-center text-sm font-semibold text-slate-500">
                Page {stockPage} of {totalStockPages}
              </span>
              <button
                onClick={() => setStockPage(Math.min(totalStockPages, stockPage + 1))}
                disabled={stockPage === totalStockPages}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2 transition hover:border-blue-500 disabled:opacity-40 shadow-2xs font-semibold text-sm cursor-pointer text-slate-700"
              >
                Next
              </button>
            </div>
          </>
        )}

        {activeMenu === 'history' && (
          <>
            {/* Header */}
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  Activity <span className="text-blue-600">History</span>
                </h1>
                <p className="mt-2 text-slate-550 font-semibold">Audit log of all administrative actions</p>
              </div>
              <button
                onClick={handleClearHistory}
                disabled={activities.length === 0}
                className="group flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-red-600 transition hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
              >
                Clear History
              </button>
            </div>

            {/* Activities Table */}
            {activitiesLoading ? (
              <div className="flex items-center justify-center p-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="glass-card rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Date & Time</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activities.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-wider">No activities logged yet.</td></tr>
                      ) : (
                        activities.map((act) => (
                          <tr key={act._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5 whitespace-nowrap text-center">
                              <div className="font-bold text-slate-800">
                                {new Date(act.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                                {new Date(act.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${act.action.includes('DELETE') ? 'bg-red-50 text-red-600 border-red-100' :
                                  act.action.includes('ADD') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {act.action.replace(/_/g, ' ').replace('TOGGLE ', '')}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-slate-600 font-medium italic">"{act.details}"</p>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- USER DETAILS MODAL --- */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-4xl bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedUser.username}'s Details
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{selectedUser.email}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-blue-600 p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              {modalLoading ? (
                <div className="flex-1 flex items-center justify-center p-20">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto flex flex-col">

                  {/* Tabs */}
                  <div className="flex border-b border-slate-100 px-6 pt-4 bg-slate-50/20">
                    <button
                      onClick={() => setModalTab("transactions")}
                      className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${modalTab === "transactions" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-700"}`}
                    >
                      Transactions ({modalData.transactions.length})
                    </button>
                    <button
                      onClick={() => setModalTab("portfolio")}
                      className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${modalTab === "portfolio" ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-700"}`}
                    >
                      Portfolio ({modalData.portfolio.length})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">

                    {/* TRANSACTIONS TAB */}
                    {modalTab === "transactions" && (
                      <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 shadow-2xs">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-100">
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symbol</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price/Share</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {modalData.transactions.length === 0 ? (
                              <tr><td colSpan="6" className="text-center py-6 text-slate-400 font-bold uppercase text-xs">No transactions found.</td></tr>
                            ) : (
                              modalData.transactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-500">{formatDate(tx.createdAt)}</td>
                                  <td className="px-6 py-4 font-black text-slate-800">{tx.stockSymbol}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${tx.transactionType === 'BUY' ? 'bg-emerald-50 text-emerald-650 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                      {tx.transactionType}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-extrabold text-slate-800">{tx.quantity}</td>
                                  <td className="px-6 py-4 font-bold text-slate-700">{formatCurrency(tx.pricePerShare)}</td>
                                  <td className="px-6 py-4 flex items-center gap-1 font-extrabold text-slate-900">{tx.transactionType === 'BUY' ? '-' : '+'}<CoinIcon className="w-3 h-3" /> {formatCurrency(tx.totalAmount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* PORTFOLIO TAB */}
                    {modalTab === "portfolio" && (
                      <div>
                        {/* Portfolio Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm transition duration-300 hover:-translate-y-0.5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Investment</p>
                            <h3 className="text-xl font-black text-slate-900 flex items-center">
                              <span className="mr-1 text-slate-900 font-black">$</span>
                              {formatCurrency(modalData.summary.totalInvestment)}
                            </h3>
                          </div>
                          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm transition duration-300 hover:-translate-y-0.5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Value</p>
                            <h3 className="text-xl font-black text-slate-900 flex items-center">
                              <span className="mr-1 text-slate-900 font-black">$</span>
                              {formatCurrency(modalData.summary.totalCurrentValue)}
                            </h3>
                          </div>
                          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm transition duration-300 hover:-translate-y-0.5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total P/L</p>
                            <h3 className={`text-xl font-black flex items-center ${modalData.summary.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {modalData.summary.totalProfit >= 0 ? '+' : ''}
                              <span className="mr-1 font-black">$</span>
                              {formatCurrency(modalData.summary.totalProfit)}
                            </h3>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 shadow-2xs">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50/75 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symbol</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owned Qty</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Buy</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Price</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">P/L</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {modalData.portfolio.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-6 text-slate-400 font-bold uppercase text-xs">No active holdings.</td></tr>
                              ) : (
                                modalData.portfolio.map((stock) => (
                                  <tr key={stock.stockSymbol} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-black text-slate-800">{stock.stockSymbol}</td>
                                    <td className="px-6 py-4 font-bold text-slate-600">{stock.ownedQuantity}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{formatCurrency(stock.avgPrice)}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-700">{formatCurrency(stock.currentPrice)}</td>
                                    <td className={`px-6 py-4 font-extrabold ${stock.profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {stock.profitLoss >= 0 ? '+' : ''}{formatCurrency(stock.profitLoss)} ({stock.profitPercent.toFixed(2)}%)
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
