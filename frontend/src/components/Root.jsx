import Footer from "./Footer";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AIChatPanel from "./ai/AIChatPanel";

function Root() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = sessionStorage.getItem("role");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auth pages should not have sidebar/navbar sometimes,
  // but for now, we'll just toggle the sidebar based on role and path.
  const isAuthPage = ["/signin", "/register"].includes(location.pathname);
  const showSidebar =
    role === "trader" && !isAuthPage && location.pathname !== "/";

  // Don't show floating chat on auth pages, landing page, admin/manager routes, or the main AI page
  const showFloatingChat =
    role === "trader" &&
    !isAuthPage &&
    location.pathname !== "/" &&
    location.pathname !== "/ai";

  useEffect(() => {
    const navEntry = window.performance.getEntriesByType("navigation")[0];

    if (
      navEntry?.type === "reload" &&
      role === "trader" &&
      location.pathname === "/"
    ) {
      navigate("/portfolio", { replace: true });
    }
  }, [navigate, role, location.pathname]);

  return (
    <div className="min-h-screen bg-[#F4F5F0] text-slate-855 flex flex-col relative">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {showSidebar && (
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}

        <main
          className={`flex-1 flex flex-col transition-all duration-300 ${
            showSidebar
              ? isSidebarCollapsed
                ? "ml-20"
                : "ml-20 lg:ml-64"
              : ""
          }`}
        >
          <div
            className={`flex-1 ${
              location.pathname.startsWith("/admin")
                ? ""
                : "p-6 lg:px-14 py-10 w-full"
            }`}
          >
            <Outlet />
          </div>

          {/* Footer only on home page */}
          {location.pathname === "/" && <Footer />}
        </main>
      </div>

      {/* GLOBAL FLOATING CHAT WIDGET */}
      {showFloatingChat && (
        <div className="fixed bottom-6 right-6 z-50">
          {!isChatOpen ? (
            <button
              onClick={() => setIsChatOpen(true)}
              className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-white border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(37,99,235,0.15)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:rotate-12">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>

              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400 border border-white"></span>
              </span>
            </button>
          ) : (
            <div className="shadow-2xl animate-fade-in-up origin-bottom-right transition-all">
              <AIChatPanel
                isFloating={true}
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Root;