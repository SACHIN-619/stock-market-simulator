import { getLiveStockUpdates } from "../services/realtimeService.js";
import { startWatchlistAlertService } from "../services/watchlistAlertService.js";
import mongoose from "mongoose";

// ──────────────────────────────────────────────
// USER SOCKET MAP
// Maps userId (string) → socketId (string)
// Used to send targeted alerts to specific users
// ──────────────────────────────────────────────
export const userSocketMap = new Map();

// REALTIME SOCKET SERVER
export const startRealtimeUpdates = (io) => {
    console.log("Socket server initialized");

    // HANDLE CLIENT CONNECTION
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Client sends their userId after connecting
        // Frontend: socket.emit("register", userId)
        socket.on("register", (userId) => {
            if (userId) {
                userSocketMap.set(String(userId), socket.id);
                socket.join(`user_${userId}`);   // join personal room
                console.log(`[Socket] User ${userId} registered → ${socket.id}`);
            }
        });

        socket.on("disconnect", () => {
            // Remove from map on disconnect
            for (const [userId, sid] of userSocketMap.entries()) {
                if (sid === socket.id) {
                    userSocketMap.delete(userId);
                    break;
                }
            }
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    // GLOBAL STOCK PRICE UPDATES (every 5 seconds to all clients)
    setInterval(async () => {
        try {
            if (mongoose.connection.readyState !== 1) return;
            const stockUpdates = await getLiveStockUpdates();
            io.emit("stockUpdates", stockUpdates);
        } catch (error) {
            console.log("Realtime error:", error.message);
        }
    }, 5000);

    // WATCHLIST ALERT POLLING SERVICE (every 3 minutes, targeted per user)
    startWatchlistAlertService(io, userSocketMap);
};