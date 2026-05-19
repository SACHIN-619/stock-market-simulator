function Footer() {
  return (
    <footer className="bg-transparent border-t border-[#e4e5df]/40 py-6 text-center text-xs font-bold text-slate-400 w-full uppercase tracking-widest">
      © {new Date().getFullYear()} Stockking. All rights reserved.
    </footer>
  );
}

export default Footer;
