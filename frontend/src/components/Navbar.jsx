import { NavLink, useNavigate, useLocation } from "react-router-dom";
import api from "../service/api";
import WatchlistBell from "./WatchlistBell";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const role     = sessionStorage.getItem("role");
  const userId   = sessionStorage.getItem("userId");     // set on login
  const username = sessionStorage.getItem("username");

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const element = document.getElementById("about-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById("about-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    }
  };

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
    bg-[#F4F5F0]/90 backdrop-blur-md border-b border-[#e4e5df]/50">

      {/* LOGO & BRAND */}
      <NavLink
        to="/"
        className="flex items-center gap-3 group"
      >
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#e4e5df] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:border-blue-500/30 shadow-2xs">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <path d="m3 17 6-6 4 4 8-8"/>
              <path d="M17 7h4v4"/>
            </svg>
          </div>
          {/* GLOW */}
          <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tighter">
          Stock<span className="text-blue-600">king</span>
        </span>
      </NavLink>

      {/* RIGHT SIDE */}
      <div className="flex gap-3 items-center">
        {/* ── WATCHLIST BELL (traders only) ── */}
        {role === "trader" && <WatchlistBell userId={userId} />}

        <button
          onClick={handleHomeClick}
          className="px-5 py-2 text-sm font-semibold text-black hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none"
        >
          Home
        </button>

        <button
          onClick={handleAboutClick}
          className="px-5 py-2 text-sm font-semibold text-black hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none"
        >
          About
        </button>

        {!role ? (
          <div className="flex items-center gap-3">
            <NavLink
              to="/signin"
              className="px-5 py-2 text-sm font-semibold text-black hover:text-slate-600 transition-colors"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/10 hover:scale-105 active:scale-95"
            >
              Start Trading
            </NavLink>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-300 group shadow-xs cursor-pointer"
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

