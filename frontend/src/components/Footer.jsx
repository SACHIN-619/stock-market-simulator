import { Link, useNavigate, useLocation } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

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


  return (
    <footer className="w-full bg-blue-900 pt-16 pb-8 text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          
          {/* Branding Column */}
          <div className="flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-white/20 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:border-white/30 shadow-2xs">
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
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                Stock<span className="text-blue-200">king</span>
              </span>
            </Link>

            <div className="space-y-3">
              <p className="text-sm font-extrabold text-white leading-snug">
                Master the markets, completely risk-free.
              </p>
              <p className="text-xs font-semibold leading-relaxed text-blue-100">
                A real-time, dynamic stock market simulator designed for interactive learning, investment analysis, and financial literacy.
              </p>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="flex flex-col gap-4 lg:pl-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-200">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Home", to: "/", isHome: true },
                { name: "Dashboard", to: "/portfolio" },
                { name: "Leaderboard", to: "/leaderboard" },
                { name: "About", to: "#about-section", isAnchor: true }
              ].map((link) => (
                <li key={link.name}>
                  {link.isHome ? (
                    <button
                      onClick={handleHomeClick}
                      className="text-xs font-bold text-blue-50 hover:text-white transition-colors duration-300 flex items-center gap-1.5 group cursor-pointer bg-transparent border-none p-0 text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 group-hover:bg-white transition-colors" />
                      {link.name}
                    </button>
                  ) : link.isAnchor ? (
                    <button
                      onClick={handleAboutClick}
                      className="text-xs font-bold text-blue-50 hover:text-white transition-colors duration-300 flex items-center gap-1.5 group cursor-pointer bg-transparent border-none p-0 text-left"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 group-hover:bg-white transition-colors" />
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-xs font-bold text-blue-50 hover:text-white transition-colors duration-300 flex items-center gap-1.5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300 group-hover:bg-white transition-colors" />
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Features Column */}
          <div className="flex flex-col gap-4 lg:pl-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-200">
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
                  <div className="text-xs font-extrabold text-white flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feat.name}
                  </div>
                  <p className="text-[10px] font-medium text-blue-100 ml-5.5 mt-0.5 leading-normal">
                    {feat.desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/10 my-10" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-6 items-center">
          
          {/* Disclaimer */}
          <div className="max-w-2xl text-center">
            <p className="text-[10px] font-bold text-blue-100 leading-relaxed uppercase tracking-wide">
              <span className="text-white font-extrabold">Disclaimer:</span> This platform is a stock market simulator created for educational purposes only. No real money or securities are involved.
            </p>
          </div>

          {/* Copyright & Info */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 text-[10px] font-bold text-blue-200 uppercase tracking-widest">
            <p>
              © {currentYear} StockKing. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}

export default Footer;