function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-[#f7f7f4] py-6">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Stock<span className="text-blue-600">King</span>
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Virtual stock market simulator for smart learning.
          </p>
        </div>

        {/* Right Links */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
          
          <a href="/" className="hover:text-blue-600 transition">
            Home
          </a>

          <a href="/leaderboard" className="hover:text-blue-600 transition">
            Leaderboard
          </a>

        </div>
      </div>

      {/* Bottom */}
      <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs tracking-wide text-slate-400">
        © {new Date().getFullYear()} StockKing. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;