// import axios from "axios";

// // 1. AXIOS INSTANCE CONFIGURATION
// const api = axios.create({
//    // Fixed: Dynamic environment variable path with a robust local development fallback string
//    baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
//    // Automatically send HttpOnly cookies (Sessions/JWTs) with every request cross-origin
//    withCredentials: true,
//    headers: {
//       "Content-Type": "application/json",
//    }
// });

// // 2. REQUEST INTERCEPTOR (Optional)
// // Perfect for injecting temporary runtime headers or loading indicators before an API request leaves the browser.
// api.interceptors.request.use(
//    (config) => {
//       const token = localStorage.getItem("token");
//       if (token && token !== "undefined") {
//          config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//    },
//    (error) => {
//       return Promise.reject(error);
//    }
// );

// // 3. RESPONSE INTERCEPTOR (Centralized Error Mitigation)
// // Catches server complaints globally so your pages don't have to duplicate logic.
// api.interceptors.response.use(
//    (response) => response, // Directly return successful mutations
//    (error) => {
//       const status = error.response ? error.response.status : null;

//       if (status === 401) {
//          console.warn("Unauthorized request detected - Clearing session or redirecting...");
//          // Optional: Trigger custom logout context routines, clear local storage tokens, or redirect:
//          // window.location.href = "/login";
//       } else if (status === 500) {
//          console.error("Critical internal server error encountered.");
//       }

//       // Pass the rejection along down the line so specific file UI components can still read localized error payloads
//       return Promise.reject(error);
//    }
// );

// // export configured instance
// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      config.headers["Authorization"] = `Bearer ${token}`;
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn("401 Unauthorized — token may be missing or expired");
      const token = sessionStorage.getItem("token");
      if (!token) {
        window.location.href = "/signin";
      }
    } else if (status === 500) {
      console.error("Server error 500");
    }
    return Promise.reject(error);
  }
);

export default api;