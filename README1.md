StockKing — Complete Project Architecture
Overview
┌────────────────────────────────────────────────────────────┐
│                  STOCKKING ARCHITECTURE                      │
│                                                            │
│  Browser (React)  ──HTTP──►  Express Server (Node.js)     │
│  localhost:5173   ◄──JSON──  localhost:5000               │
│                                                            │
│  Browser (React)  ──WebSocket──►  Socket.io Server        │
│  (live prices)    ◄──push────    (every 5 seconds)        │
│                                                            │
│  Express  ──►  MongoDB (via Mongoose)                      │
│  Express  ──►  Finnhub API    (live stock prices)         │
│  Express  ──►  Alpha Vantage  (historical charts)         │
│  Express  ──►  Google Gemini  (AI suggestions)            │
└────────────────────────────────────────────────────────────┘
BACKEND
Entry Point: server.js
This is where everything starts when you run nodemon server.js.

Boot sequence:

Load environment variables (.env)
Connect to MongoDB
Create HTTP server
Attach Socket.io to it
Start real-time stock price broadcasting (every 5 sec)
Start alert checker (every 60 sec)
Listen on port 5000
Backend Folder Structure
backend/
├── server.js              ← Entry point — boots everything
├── app.js                 ← Express setup (routes, CORS, middleware)
├── .env                   ← Secret keys (DB, API keys, JWT secret)
│
├── routes/                ← URL path definitions
│   ├── authRoute.js       → /api/auth
│   ├── stockRoute.js      → /api/stocks
│   ├── transactionRoute.js→ /api/transactions
│   ├── portfolioRoute.js  → /api/portfolio
│   ├── historicalRoute.js → /api/historical
│   ├── alertRoute.js      → /api/alerts
│   ├── userRoute.js       → /api/users
│   ├── aiRoute.js         → /api/ai
│   ├── aiChatRoute.js     → /api/ai (chat)
│   ├── leaderboardRoute.js→ /trader-api
│   └── adminActivityRoute.js → /api/admin/activity
│
├── controllers/           ← Business logic (what happens for each route)
│   ├── authController.js
│   ├── stockController.js
│   ├── transactionController.js
│   ├── portfolioController.js
│   ├── historicalController.js
│   ├── alertController.js
│   ├── userController.js
│   ├── aiController.js
│   ├── aiChatController.js
│   ├── leaderboardController.js
│   └── adminActivityController.js
│
├── models/                ← MongoDB schema definitions
│   ├── UserModel.js
│   ├── StockModel.js
│   ├── TransactionModel.js
│   └── ...
│
├── middleware/            ← Request interceptors (auth checks etc.)
│
├── services/              ← Reusable logic / external API calls
│   ├── realtimeService.js ← Fetches & fluctuates live prices
│   ├── finnhubService.js  ← Calls Finnhub API
│   ├── alertService.js    ← Checks price alerts every 60s
│   ├── cacheService.js    ← In-memory cache (node-cache)
│   └── ai/                ← AI-related services (Gemini)
│
└── socket/
    └── socketServer.js    ← Broadcasts live prices every 5 sec
Backend Packages
express — The Web Server Framework
What it is: The core framework that creates the HTTP server
Why used: Handles all incoming requests (GET, POST, PUT, DELETE) and sends back responses
How it works: You define routes like app.get("/api/stocks", handler), and Express calls the handler when that URL is hit
In this project: All 10+ route files use Express Router
mongoose — MongoDB Object Modeling
What it is: A library that connects Node.js to MongoDB
Why used: Instead of writing raw MongoDB queries, you define Schemas (like a table structure) and interact with them as JavaScript objects
How it works:
js
// Define structure
const UserSchema = new Schema({ username: String, walletBalance: Number })
// Use it
const user = await userModel.findOne({ email })
In this project: Every DB operation (find user, save transaction, update portfolio) goes through Mongoose models
jsonwebtoken (JWT) — User Authentication Tokens
What it is: Creates and verifies encrypted tokens
Why used: After a user logs in, the server creates a JWT token and sends it as a cookie. Every future request includes this cookie so the server knows WHO is making the request without them logging in again
How it works:
Login → server creates token → stored in cookie → 
Next request → cookie sent → server verifies token → user identified
In this project: Used in authController.js on login, and checked in middleware/ on protected routes
bcryptjs — Password Hashing
What it is: Converts plain passwords into encrypted hashes
Why used: You never store a raw password in the DB. If the DB is hacked, passwords are safe
How it works:
Register: "mypassword123" → bcrypt.hash() → "$2b$10$abc..." (stored)
Login: "mypassword123" → bcrypt.compare() → matches hash? → ✅ or ❌
In this project: authController.js hashes password on register, compares on login
socket.io — Real-Time WebSocket Server
What it is: Enables persistent two-way connection between server and browser
Why used: HTTP is request-response (you have to ask to get data). WebSocket is a live pipe — server can PUSH data to browser instantly
How it works:
Server: io.emit("stockUpdates", priceData)  → pushes to ALL clients
Client: socket.on("stockUpdates", handler)  → receives data live
In this project: Every 5 seconds socketServer.js fetches prices and broadcasts to all connected traders
cors — Cross-Origin Resource Sharing
What it is: A security setting that controls which websites can talk to your backend
Why used: Browsers block requests from one origin (localhost:5173) to another (localhost:5000) by default. CORS lifts this restriction for trusted origins
How it works: Backend sends special headers saying "I allow requests from localhost:5173"
In this project: Only localhost:5173 (the React frontend) is whitelisted
cookie-parser — Read HTTP Cookies
What it is: Middleware that parses cookies attached to incoming requests
Why used: JWTs are stored in cookies. Without this, req.cookies would be undefined
In this project: Reads the JWT cookie on every request so auth middleware can verify the user
helmet — HTTP Security Headers
What it is: Sets security-related HTTP headers automatically
Why used: Protects against common web attacks (clickjacking, XSS, MIME sniffing) by telling the browser how to behave
In this project: Applied globally in app.js with app.use(helmet())
express-rate-limit — Request Rate Limiting
What it is: Limits how many requests a single IP can make in a time window
Why used: Prevents abuse — e.g., someone spamming the login endpoint 1000 times, or hammering the paid Gemini AI API
In this project: 3 limiters are set:
Auth routes: 20 requests/minute
AI routes: 10 requests/minute (Gemini costs money)
General: 100 requests/minute
dotenv — Environment Variables
What it is: Loads variables from .env file into process.env
Why used: Keeps secrets (API keys, DB passwords) out of your source code
In this project: FINNHUB_API_KEY, ALPHA_VANTAGE_API_KEY, JWT_SECRET, DB_URL, etc.
axios (backend) — HTTP Client for External APIs
What it is: A library to make HTTP requests FROM the server to external services
Why used: The backend needs to fetch data from Finnhub and Alpha Vantage
In this project:
realtimeService.js → calls Finnhub for live prices
historicalController.js → calls Alpha Vantage for chart data
multer — File Upload Handler
What it is: Middleware for handling file uploads (multipart/form-data)
Why used: Profile picture uploads need special handling — regular body parsers don't handle files
In this project: Used in user profile update to handle profile photo uploads
node-cache — In-Memory Caching
What it is: A simple key-value store that lives in server memory (like a fast temporary dictionary)
Why used: Finnhub has rate limits. Caching a stock price means we don't call Finnhub again for the same stock within a short period — saves API quota and is faster
How it works:
First request  → call Finnhub → store result in cache
Next request   → return from cache instantly (no API call)
After TTL expires → cache cleared → call Finnhub again
In this project: cacheService.js wraps node-cache, used in realtimeService.js
@google/generative-ai — Google Gemini AI
What it is: Official Google SDK for the Gemini AI model
Why used: Powers the AI features — stock suggestions, watchlist insights, AI chat
In this project: AI controllers call Gemini with portfolio data and get back analysis/recommendations
nodemon — Auto-Restart During Development
What it is: Watches your files and restarts the server automatically when you save a change
Why used: Without it, you'd have to manually stop and restart the server after every code change
In this project: nodemon server.js is how you run the backend in development
FRONTEND
Frontend Folder Structure
frontend/src/
├── main.jsx               ← React entry point (mounts App to DOM)
├── App.jsx                ← Route definitions
│
├── components/            ← All UI pages and components
│   ├── Home.jsx           ← Landing page
│   ├── Navbar.jsx         ← Top navigation bar
│   ├── Stocks.jsx         ← Stock market listing page
│   ├── StockDetails.jsx   ← Individual stock + trade terminal
│   ├── Portfolio.jsx      ← Trader's holdings
│   ├── Dashboard.jsx      ← Overview dashboard
│   ├── Leaderboard.jsx    ← Rankings
│   ├── Transactions.jsx   ← Trade history
│   ├── Profile.jsx        ← User profile
│   ├── AdminDashboard.jsx ← Admin control panel
│   ├── Signin.jsx         ← Login page
│   ├── Register.jsx       ← Registration page
│   └── ai/                ← AI insight components
│
├── service/               ← API call functions
│   ├── api.js             ← Axios instance (base URL + cookies)
│   ├── stockService.js    ← Stock-related API calls
│   └── tradeService.js    ← Buy/sell API calls
│
├── socket/
│   └── socket.js          ← Socket.io client connection
│
├── context/
│   └── AuthContext.jsx    ← Global auth state (logged-in user)
│
└── assets/                ← Images, icons
Frontend Packages
react + react-dom — The UI Library
What it is: React is the core library for building user interfaces using components
Why used: Instead of manually updating HTML, React re-renders only the parts that changed
How it works: You write components (functions that return HTML-like JSX), React manages the DOM
In this project: Every .jsx file is a React component
vite — Build Tool & Dev Server
What it is: A modern, fast development server and bundler
Why used: Faster than older tools like Webpack. Hot Module Replacement (HMR) updates the browser instantly when you save a file
In this project: npm run dev starts the Vite server on localhost:5173
react-router-dom — Page Navigation
What it is: Handles routing in a Single Page Application (SPA)
Why used: In React, there's only one HTML file. React Router fakes multiple pages by showing/hiding components based on the URL
How it works:
jsx
<Route path="/stocks" element={<Stocks />} />
// When URL is /stocks → renders Stocks component
In this project: Used for all navigation — /signin, /stocks/:symbol, /portfolio, etc.
axios (frontend) — HTTP Client
What it is: Makes HTTP requests from the browser to the backend
Why used: Cleaner than native fetch, handles JSON automatically, easy error handling
In this project: All API calls use the api.js instance:
js
api.post("/auth/login", { email, password })
api.get("/portfolio")
socket.io-client — WebSocket Client
What it is: The browser-side counterpart of the Socket.io server
Why used: Creates a persistent connection to the backend to receive live stock price updates
How it works:
js
socket.on("stockUpdates", (data) => {
  // Update the chart with new prices
})
In this project: StockDetails.jsx listens for stockUpdates and updates the live graph
recharts — Stock Price Charts
What it is: A charting library built specifically for React
Why used: Renders beautiful, responsive area charts for live and historical price data
In this project: StockChart.jsx uses AreaChart, XAxis, YAxis, Tooltip from recharts
chart.js + react-chartjs-2 — Portfolio Charts
What it is: Another charting library (more general purpose)
Why used: Used for portfolio breakdown charts (pie charts, bar charts)
In this project: Portfolio and dashboard analytics charts
tailwindcss — CSS Utility Framework
What it is: A CSS framework where you style directly in HTML using class names
Why used: No need to write separate .css files. Classes like text-emerald-400, rounded-xl, flex apply styles directly
In this project: Every component is styled entirely with Tailwind classes
eslint — Code Quality Checker
What it is: A tool that scans your code and flags errors/bad practices
Why used: Catches bugs before they run (unused variables, missing dependencies in useEffect, etc.)
In this project: Dev-only tool, runs with npm run lint
How a Full Request Works (Example: Buy a Stock)
1. Trader clicks "BUY" on StockDetails.jsx
        ↓
2. handleTrade("BUY") is called
        ↓
3. Confirmation modal appears → user clicks OK
        ↓
4. confirmTrade() calls buyStock() from tradeService.js
        ↓
5. axios POST → http://localhost:5000/api/transactions/buy
        ↓
6. Request hits Express Router → transactionRoute.js
        ↓
7. Routed to transactionController.js → buyStock handler
        ↓
8. Middleware checks JWT cookie → is user logged in? trader?
        ↓
9. Controller checks: does user have enough coins?
        ↓
10. MongoDB: deduct coins from user, add stock to portfolio, save transaction
        ↓
11. Response sent back: { success: true, message: "Stock bought" }
        ↓
12. Frontend receives response → shows toast "Stock Bought Successfully" ✅
External APIs Used
API	Purpose	Where Used
Finnhub	Real-time stock quotes (current price)	realtimeService.js
Alpha Vantage	Historical price data (charts)	historicalController.js
Google Gemini	AI portfolio analysis & chat	aiController.js, aiChatController.js
Ports Summary
Service	Port	URL
React Frontend	5173	http://localhost:5173
Express Backend	5000	http://localhost:5000
MongoDB	27017	(internal, via mongoose)
