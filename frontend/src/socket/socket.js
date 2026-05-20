// import { io }
// from "socket.io-client";


// // create socket connection
// export const socket = io(

//    // "http://localhost:5000",
//    import.meta.env.VITE_API_URL,

//    {
//       transports: ["websocket"]
//    }

// );


import { io } from "socket.io-client";

// 1. EXTRACT RAW BASE DOMAIN ORIGIN
// Strips trailing paths (like /api) to ensure Socket.io can safely mount its native handshake routing endpoint (/socket.io/)
const getSocketEndpoint = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "http://localhost:5000"; // Fallback development string

  try {
    const url = new URL(envUrl);
    return url.origin; // Returns clean protocol + domain (e.g., "https://api.yourdomain.com")
  } catch (e) {
    // If the environment variable isn't a fully qualified URL, fallback gracefully
    return envUrl;
  }
};

// 2. INITIALIZE AND EXPORT THE SOCKET SINGLETON INSTANCE
export const socket = io(getSocketEndpoint(), {
  // Enforces direct WebSocket handshakes right away, bypassing heavy HTTP long-polling roundtrips
  transports: ["websocket"],
  
  // Production Stability Flags
  autoConnect: true,       // Connect immediately on asset initialization
  reconnection: true,      // Automatically try to reconnect if the server drops
  reconnectionAttempts: 5, // Limit reconnection loops to protect client resources
  reconnectionDelay: 2000  // Wait 2 seconds before attempting subsequent handshakes
});

// Optional: Global Debug Loggers to watch connection health right inside the browser console
if (import.meta.env.DEV) {
  socket.on("connect", () => console.log(`⚡ [Socket Connected]: ID = ${socket.id}`));
  socket.on("connect_error", (err) => console.error("❌ [Socket Connection Error]:", err.message));
  socket.on("disconnect", (reason) => console.warn("🔌 [Socket Disconnected]:", reason));
}