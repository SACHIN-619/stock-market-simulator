import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authImage from "../assets/sign.jpeg";
import api from "../service/api";
import { useAuth } from "../context/AuthContext";
function Signin() {
  const navigate = useNavigate();
  const { login } = useAuth(); // 🔥 from context

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", form);
      const user = res.data.payload;
      const role = user?.role;

      if (!role) {
        alert("Login failed: Role not found");
        return;
      }

      // 🔥 IMPORTANT: use context login instead of sessionStorage directly
      login(res.data.token);
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("username", user.username);
      sessionStorage.setItem("userId", user._id || user.id || "");   // for socket targeting

      alert("Login Successful");

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "stockmanager") {
        navigate("/manager", { replace: true });
      } else {
        navigate("/portfolio", { replace: true });
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 py-8 backdrop-blur-xs">
        <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="absolute right-6 top-6 z-20 h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-xs font-black text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            aria-label="Close sign in"
          >
            ✕
          </button>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-[520px] flex-col justify-center px-8 py-12 text-slate-800 sm:px-12 bg-white"
          >
            <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 uppercase">
              Sign In
            </h2>

            <p className="mb-8 mt-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Welcome back to Stockking
            </p>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:border-indigo-500"
            />

            <div className="relative mb-6">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" />
                    <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 9 5 9 8a8.8 8.8 0 0 1-2 3.6" />
                    <path d="M6.6 6.6C4.4 8 3 10.3 3 12c0 3 4 8 9 8 1.2 0 2.4-.3 3.5-.8" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3.5 font-black text-xs uppercase tracking-widest text-white shadow-md hover:bg-indigo-500 transition cursor-pointer active:scale-[0.98]"
            >
              Login
            </button>

            <p className="mt-6 text-center text-xs font-semibold text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-black text-indigo-600 transition hover:text-indigo-500 ml-1"
              >
                Register
              </Link>
            </p>
          </form>

          <div className="relative hidden min-h-[520px] overflow-hidden bg-slate-50 md:block">
            <div className="absolute inset-0 bg-indigo-900/5 z-10"></div>
            <img
              src={authImage}
              alt="StockSim sign in"
              className="relative h-full w-full object-cover filter brightness-95"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;
