import { config } from "dotenv";
config();

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";

// import dotenv from "dotenv";
// dotenv.config();
// console.log("FINNHUB:", process.env.FINNHUB_API_KEY);


import { connect } from "mongoose";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";

import { startRealtimeUpdates }
from "./socket/socketServer.js";

import { checkAlerts }
from "./services/alertService.js";


// CONNECT TO DATABASE

const connectDB = async () => {

  try {

    await connect(process.env.DB_URL);

    console.log("DB server connected");


    // CREATE HTTP SERVER

    const server = http.createServer(app);


    // INITIALIZE SOCKET.IO
  
    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                const allowed = [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    process.env.CLIENT_URL,
                ].filter(Boolean);
                if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
                    return callback(null, true);
                }
                return callback(new Error(`Socket CORS: Origin ${origin} not allowed`));
            },
            methods: ["GET", "POST"],
            credentials: true,
        },
    });


    // START REALTIME SOCKET SYSTEM
    
    startRealtimeUpdates(io);


    // ALERT CHECKER (Phase-3)

    setInterval(() => {

   // DB NOT CONNECTED
   if (mongoose.connection.readyState !== 1) {

      console.log(
         "MongoDB disconnected..."
      );

      return;

   }

   checkAlerts(io);

}, 60000);


    // START SERVER

    const port = process.env.PORT || 5000;

    server.listen(port, () =>
      console.log(`Server running on ${port}`)
    );

  } catch (err) {

    console.log("Error in DB connect:", err);

  }

};


// Call DB connection
connectDB();
// Trigger nodemon restart 1