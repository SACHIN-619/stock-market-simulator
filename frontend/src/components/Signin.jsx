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
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071427]/70 px-4 py-8 backdrop-blur-[2px]">
        <div className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#10100f]/85 shadow-2xl shadow-black/50 md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="absolute right-4 top-4 z-20 rounded-full px-3 py-1 text-lg font-bold leading-none text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close sign in"
          >
            X
          </button>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-[500px] flex-col justify-center px-8 py-12 text-white sm:px-12"
          >
            <h2 className="text-center text-4xl font-extrabold tracking-normal text-white">
              Sign In
            </h2>

            <p className="mb-8 mt-3 text-center text-sm text-slate-300">
              Welcome back to Stockking
            </p>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="mb-5 w-full rounded-lg border border-white/10 bg-[#1e293b]  px-4 py-4 text-base font-semibold text-white outline-none transition placeholder:text-white/85 focus:border-[#61f4a1] focus:ring-2 focus:ring-[#61f4a1]/45"
            />

            <div className="relative mb-8">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-white/10 bg-[#1e293b]  px-4 py-4 pr-12 text-base font-semibold text-white outline-none transition placeholder:text-white/85 focus:border-[#61f4a1] focus:ring-2 focus:ring-[#61f4a1]/45"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
              className="w-full rounded-lg bg-emerald-500 py-3 font-semibold text-black transition hover:bg-emerald-600"
            >
              Login
            </button>

            <p className="mt-8 text-center text-base font-medium text-white">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-extrabold text-[#61f4a1] transition hover:text-[#7cffb5]"
              >
                Register
              </Link>
            </p>
          </form>

          <div className="relative hidden min-h-[500px] overflow-hidden bg-[#071427] md:block">
            <div className="absolute inset-0 bg-[#06101f]/25"></div>
            <img
              src={authImage}
              alt="StockSim sign in"
              className="relative z-10 h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;
