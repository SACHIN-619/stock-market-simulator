import { NavLink } from "react-router-dom";

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navItems = [
    { name: "Portfolio", path: "/portfolio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
    { name: "Market", path: "/stocks", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5" /></svg> },
    { name: "History", path: "/transactions", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    {
      name: "Alpha-Insight AI",
      path: "/ai",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
          <path d="M8 11v2a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-2" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <line x1="8" y1="21" x2="16" y2="21" />
        </svg>
      )
    },

    { 
      name: "Leaderboard", 
      path: "/leaderboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10l-1 7a4 4 0 0 1-4 3 4 4 0 0 1-4-3L7 4z" /></svg>
      )
    },
    { name: "Profile", path: "/profile", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg> },
  ];

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] ${isCollapsed ? "w-20" : "w-20 lg:w-64"} bg-[#EFEFEA] border-r border-slate-200/60 transition-all duration-300 z-40 overflow-y-auto`}>
      <div className="flex flex-col h-full py-4">
        {/* Toggle Button */}
        <div className={`px-4 mb-4 flex ${isCollapsed ? "justify-center" : "justify-end"}`}>
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="p-2 rounded-xl bg-slate-50 border border-slate-200/50 text-slate-400 hover:text-blue-600 hover:border-blue-500/30 transition-all cursor-pointer group"
             title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
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
               className={`transition-transform duration-500 ${isCollapsed ? "rotate-180" : ""}`}
             >
                  <polyline points="11 17 6 12 11 7" />
                  <polyline points="18 17 13 12 18 7" />
             </svg>
           </button>
         </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? "justify-center" : "gap-4"} px-4 py-3 rounded-xl transition-all border group ${
                  isActive
                    ? "bg-[#E0EFFF] text-[#1D4ED8] border-[#BCD6F2] font-black shadow-2xs"
                    : "text-slate-550 hover:bg-[#E4E5DF] hover:text-slate-800 border-transparent font-semibold"
                }`
              }
              title={isCollapsed ? item.name : ""}
            >
              <div className="shrink-0 flex items-center justify-center w-5 h-5">
                {item.icon}
              </div>
              {!isCollapsed && <span className="hidden lg:block text-sm tracking-tight">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {!isCollapsed && (
          <div className="px-4 mt-auto mb-4 hidden lg:block">
            <div className="p-4 rounded-2xl bg-[#E0EFFF]/40 border border-[#BCD6F2]/40">
              <p className="text-[10px] font-black text-[#1D4ED8] uppercase tracking-widest mb-2">AI Intelligence</p>
              <p className="text-[10px] font-bold text-slate-550 leading-relaxed uppercase">
                Identify market trends with our smart analysis tools.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
