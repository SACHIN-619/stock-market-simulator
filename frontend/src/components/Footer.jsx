import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#e4e5df]/60 bg-[#EFEFEA]/40 pt-16 pb-8 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Branding Column */}
          <div className="flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-3 group w-fit">
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
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">
                Stock<span className="text-blue-600">king</span>
              </span>
            </Link>

            <div className="space-y-3">
              <p className="text-sm font-extrabold text-slate-800 leading-snug">
                Master the markets, completely risk-free.
              </p>
              <p className="text-xs font-semibold leading-relaxed text-slate-500">
                A real-time, dynamic stock market simulator designed for interactive learning, investment analysis, and financial literacy.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-2">
              {[
                {
                  name: "Twitter",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                    </svg>
                  ),
                  href: "#"
                },
                {
                  name: "GitHub",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                  ),
                  href: "#"
                },
                {
                  name: "LinkedIn",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                      <rect x="2" y="9" width="4" height="12"/>
                      <circle cx="4" cy="4" r="2"/>
                    </svg>
                  ),
                  href: "#"
                },
                {
                  name: "Discord",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 12h.01M12 12h.01M16 12h.01M9 16c2 1.5 4 1.5 6 0"/>
                    </svg>
                  ),
                  href: "#"
                }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-8 h-8 rounded-lg bg-white border border-[#e4e5df] flex items-center justify-center text-slate-450 hover:text-blue-600 hover:border-blue-200 hover:shadow-2xs transition-all duration-300"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col gap-4 lg:pl-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              {[
                { name: "Dashboard", to: "/portfolio" },
                { name: "Markets", to: "/stocks" },
                { name: "Portfolio", to: "/portfolio" },
                { name: "Watchlist", to: "/terminal" },
                { name: "Leaderboard", to: "/leaderboard" },
                { name: "About", to: "/" }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-xs font-bold text-slate-550 hover:text-blue-600 transition-colors duration-300 flex items-center gap-1.5 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features Column */}
          <div className="flex flex-col gap-4 lg:pl-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Features
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Live Market Data", desc: "Real-time updates on active tickers" },
                { name: "Virtual Trading", desc: "Risk-free mock stock execution" },
                { name: "Real-Time Portfolio Tracking", desc: "Dynamic metrics & profits visualizer" },
                { name: "Risk-Free Learning", desc: "Perfect for testing strategies safely" }
              ].map((feat) => (
                <li key={feat.name} className="group">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feat.name}
                  </div>
                  <p className="text-[10px] font-medium text-slate-450 ml-5.5 mt-0.5 leading-normal">
                    {feat.desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Status Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Platform Status
            </h3>
            <div className="p-4 rounded-2xl bg-white border border-[#e4e5df]/60 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black text-slate-850 uppercase tracking-wider">
                  Systems Operational
                </span>
              </div>
              <p className="text-[10px] font-semibold leading-relaxed text-slate-500">
                Live market streams are synced with real-time stock ticks to provide 100% realistic simulations.
              </p>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#e4e5df]/60 my-10" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-6 items-center">
          
          {/* Disclaimer */}
          <div className="max-w-2xl text-center">
            <p className="text-[10px] font-bold text-slate-450 leading-relaxed uppercase tracking-wide">
              <span className="text-slate-600 font-extrabold">Disclaimer:</span> This platform is a stock market simulator created for educational purposes only. No real money or securities are involved.
            </p>
          </div>

          {/* Copyright & Info */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <p>
              © {currentYear} StockKing. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-blue-600 transition">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition">Terms of Service</a>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}

export default Footer;