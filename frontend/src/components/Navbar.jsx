import { NavLink, useNavigate } from "react-router-dom";
import api from "../service/api";
import WatchlistBell from "./WatchlistBell";

function Navbar() {
  const navigate = useNavigate();

  const role     = sessionStorage.getItem("role");
  const userId   = sessionStorage.getItem("userId");     // set on login
  const username = sessionStorage.getItem("username");

  const handleLogout = async () => {
    try {
      await api.get("/auth/logout");
    } catch (error) {
      console.error("Logout Error:", error.response?.data || error.message);
    } finally {
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("userId");
      navigate("/signin");
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 
    bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">

      {/* LOGO & BRAND */}
      <NavLink
        to="/"
        className="flex items-center gap-3 group"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:border-emerald-500/40">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-emerald-500"
            >
              <path d="m3 17 6-6 4 4 8-8"/>
              <path d="M17 7h4v4"/>
            </svg>
          </div>
          {/* GLOW */}
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <span className="text-2xl font-black text-white tracking-tighter">
          Stock<span className="text-emerald-500">king</span>
        </span>
      </NavLink>

      {/* RIGHT SIDE */}
      <div className="flex gap-3 items-center">
        {/* ── WATCHLIST BELL (traders only) ── */}
        {role === "trader" && <WatchlistBell userId={userId} />}

        {!role ? (
          <div className="flex items-center gap-3">
            <NavLink
              to="/signin"
              className="px-5 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
            >
              Start Trading
            </NavLink>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 px-4 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30 transition-all duration-300 group"
            title="Logout"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

