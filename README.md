

```markdown
# 📈 StockKing: Live Stock Market Simulator & AI Insights Platform

[![Deployment Status](https://img.shields.io/badge/Frontend-Vercel-brightgreen?logo=vercel)](https://stock-market-simulators.vercel.app/)
[![Backend Status](https://img.shields.io/badge/Backend-Render-blue?logo=render)](https://stock-market-simulator-jvru.onrender.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-emerald?logo=mongodb)](https://www.mongodb.com/cloud/atlas)

> **Rule the market completely risk-free.** StockKing is an enterprise-grade MERN stack ecosystem enabling traders to practice investment strategies using real-time simulated market trends, interactive technical charts, multi-sector portfolio analytics, and predictive AI insights.

---

## 🔗 Live Deployments & Environment Ports

* **Frontend Client (Vercel):** [stock-market-simulators.vercel.app](https://stock-market-simulators.vercel.app/) *(Follow this link to start trading)*
* **Core API Gateway (Render):** [stock-market-simulator-jvru.onrender.com](https://stock-market-simulator-jvru.onrender.com/)
* **Database Cluster:** Hosted securely via MongoDB Atlas cloud infrastructure.

### Local Ports Summary
* **React Frontend Client:** Port `5173` $\rightarrow$ `http://localhost:5173`
* **Express Backend Server:** Port `5000` $\rightarrow$ `http://localhost:5000`
* **MongoDB Database:** Port `27017` (Internal instance or Cloud via Mongoose URI mapping)

---

## 🏗️ System Architecture & Data Flow

StockKing operates on a decoupled, asynchronous multi-tier architecture optimized for sub-second state adjustments and high-frequency real-time events:

```text
┌─────────────────────────────────────────────────────────────────┐
│                     STOCKKING ARCHITECTURE                      │
│                                                                 │
│   Browser (React Client)  ──HTTP──► Express Server (Node.js)    │
│   Port: 5173              ◄──JSON── Port: 5000                  │
│   (Vite Hot Reloading)              (Global Route Handlers)     │
│                                                                 │
│   Browser (React Client)  ◄─Websocket (Push Every 5s)── Socket  │
│   (Live Charts Engine)              (socketServer.js Gateway)   │
│                                                                 │
│   Express Server ───────► MongoDB Atlas (via Mongoose Layers)   │
│   Express Server ───────► Finnhub API   (Live Stock Quotes)     │
│   Express Server ───────► Alpha Vantage (Historical Chart Logs) │
│   Express Server ───────► Google Gemini (AI Portfolio Scans)    │
└─────────────────────────────────────────────────────────────────┘

```

### 🔁 Deep-Dive: How a Full Mock Asset Buy Order Request Works

1. **Trader Interaction:** A user inputs stock data and clicks "BUY" inside `StockDetails.jsx` $\rightarrow$ calls local handler function `handleTrade("BUY")`.
2. **Confirmation Modal:** A confirmation modal prompts the user. Upon clicking OK, `confirmTrade()` calls the `buyStock()` extraction from `tradeService.js`.
3. **API Dispatch:** The client issues an asynchronous `axios.post("/api/transactions/buy", payload)` transport through the custom `api.js` instance.
4. **Middleware Interception:** The backend routes intercept the request. The `cookie-parser` engine reads the incoming HTTP security cookie to pass verification metrics downstream to the JWT protection middleware.
5. **Business Logic Evaluation:** The request reaches `transactionController.js` inside the `buyStock` handler. The server analyzes database states to verify that the trader possesses adequate mock coins ($100,000.00 default seed funding).
6. **Atomic Database Mutation:** Mongoose updates the `UserModel` balances, appends the new stock holdings safely to the user's portfolio schema array, and writes an unalterable audit log to `TransactionModel`.
7. **Client Feedback:** The server returns a success response string: `{ success: true, message: "Stock bought" }`. The frontend receives this and triggers an immediate emerald-green success notification toast on the UI dashboard.

---

## ✨ Features & Ecosystem Tools

### 📊 Baseline Core Simulation Engine

* **Virtual Asset Terminal:** Buy and sell active market equities completely risk-free using an initial automated allocation of **$100,000.00** mock capital.
* **Unified Portfolio Visualizer:** Dynamic layout charts mapping live cash balances against active equity holdings valuations.
* **Audit-Compliant Records:** Complete tracking mechanics providing real-time tracking for absolute profit/loss variations.
* **Global Trader Leaderboard:** Real-time trader performance rankings compiled dynamically via specialized high-performance database indexing logs (`/trader-api`).

### ⚡ Premium Technical Upgrades

* **High-Frequency WebSocket Streams:** Integrated server broadcast channels emitting live updated stock variables directly to clients every 5 seconds.
* **Dual-Tier Financial Charting Canvas:** Uses high-performance TradingView `lightweight-charts` layout modules side-by-side with responsive custom `recharts` views.
* **Real-Time Watchlist Notification Engine (The "Bell"):**
* **Always-On Background Daemon:** An active data service polls global stock variables continuously on a 3-minute cycle.
* **Intelligent WebSocket Routing:** If asset movements cause an AI signal alteration (e.g., `HOLD` $\rightarrow$ `BUY`), the server extracts target connections from an in-memory `userId socket map` and delivers targeted socket updates exclusively to impacted users.
* **High-Fidelity Client Alerts:** Features an automated real-time notification alert bell icon inside the Navigation panel, displaying animated unread item indicators, anchor tags with deep links directly to targeted asset graphs (`/stocks/:symbol`), and visual fresh-metric status markers (e.g., *"Just now"*, *"5m ago"*).
* **Advanced CRUD Control:** Users can add any public ticker (e.g., NVDA, TSLA) to monitor AI sentiment, even if they do not own shares in their current portfolio.
* **Deterministic Safe Failovers:** If outbound third-party AI gateways go offline or time out, an embedded mathematical subsystem takes over, computing technical Relative Strength Index (RSI) formulas locally to verify and maintain accurate alert states.



---

## 🛠️ Detailed Tech Stack & Deep Package Usage

### 💻 Frontend Client Dependencies (`/frontend/package.json`)

* `react` & `react-dom` (v19.2.5): Core declarative component library driving optimized client side Virtual DOM renders.
* `vite` (v8.0.10): High-speed compilation server and bundle engine supporting instantaneous Hot Module Replacement (HMR).
* `react-router-dom` (v7.15.0): Manages client single-page routing structures smoothly across components without requesting complete page re-builds.
* `axios` (v1.16.0): Primary HTTP client configuration (`service/api.js`) featuring embedded global authorization configurations.
* `socket.io-client` (v4.8.3): Maintains persistent full-duplex socket connections to intercept active server pricing streams.
* `lightweight-charts` (v5.2.0): Financial-grade graphing library from TradingView enabling fluid technical financial candle draws.
* `recharts` (v3.8.1): SVG charting library for interactive historical trend analysis dashboards.
* `chart.js` & `react-chartjs-2` (v4.5.1 / v5.3.1): Standardized canvas elements to configure multi-sector allocation graphs.
* `tailwindcss` & `@tailwindcss/vite` (v4.2.4): Modern styling utility engine optimizing UI rendering directly within class configurations.
* `lucide-react` (v1.14.0): Icon directory providing clean vector anchors for notification layouts.

### ⚙️ Backend Server Dependencies (`/backend/package.json`)

* `express` (v5.2.1): Core web runtime framework routing custom API endpoints across modular sub-trees.
* `mongoose` (v9.6.1): Object Data Modeling layer providing structured schema-validation layouts over raw MongoDB collections.
* `jsonwebtoken` (v9.0.3): Signs and decodes secure cryptographic identity tokens distributed to client HTTP cookies.
* `cookie-parser` (v1.4.7): Middleware parsing attached browser cookie attributes to populate secure verification parameters.
* `bcryptjs` (v3.0.3): Secure password string hashing function preventing plain text exposures inside database entries.
* `socket.io` (v4.8.3): Backend server socket framework running the high-frequency 5-second market emitter logic loop.
* `cors` (v2.8.6): Network security policy filter protecting server resources from unverified outside domains.
* `helmet` (v8.1.0): Automatically assigns comprehensive HTTP defensive headers to guard against XSS injection vulnerabilities.
* `express-rate-limit` (v8.5.1): Controls endpoint misuse. Restricts authentication checks to 20 requests/min, AI pathways to 10 requests/min, and basic data retrievals to 100 requests/min.
* `node-cache` (v5.1.2): In-memory temporary key-value storage layer preventing third-party quota exhaustion by resolving redundant requests instantly within memory buffers.
* `multer` & `cloudinary` / `multer-storage-cloudinary`: Multi-part profile image processing pipeline saving profile avatars seamlessly into a persistent CDN bucket.
* `@google/generative-ai` (v0.24.1): Connects with Gemini engines to construct real-time security breakdowns and automated portfolio assessments.
* `groq-sdk` & `@huggingface/inference`: Redundant alternative AI fallback frameworks to process background text requests if primary gateways encounter rate timeouts.
* `nodemon` (v3.1.14): Watches server source files and performs automated hot restarts throughout active dev execution cycles.

---

## 📁 Repository Workspace Structure

```text
stock-market-simulator/
├── frontend/                     # Frontend Client Sub-system Folder
│   ├── dist/                     # Optimized distribution output files compiled by Vite
│   ├── public/                   # Static public-facing browser assets
│   ├── src/                      # Source Code Architecture
│   │   ├── assets/               # Local UI specific layouts, images, and brand logs
│   │   ├── components/           # Component layout views (Navbar, Dashboard, Leaderboard)
│   │   │   └── ai/               # Custom UI modules representing Gemini analytical outputs
│   │   ├── context/              # AuthContext files executing global user identity states
│   │   ├── service/              # Modular custom Axios connection files (api.js, stockService)
│   │   ├── socket/               # Configuration settings capturing socket-client instances
│   │   ├── App.jsx               # Client navigation routing mapping files
│   │   └── main.jsx              # Application mount anchor booting the browser framework
│   ├── package.json              # Client framework version records and script commands
│   └── vite.config.js            # Build parameters configuring Vite server adjustments
├── backend/                      # Core REST API & WebSocket Event Server
│   ├── config/                   # Cloud storage tokens and MongoDB database handshakes
│   ├── controllers/              # Core functional logic modules (10+ separate handlers)
│   ├── middleware/               # Token interceptors, Multer handlers, and speed barriers
│   ├── models/                   # Strict Mongoose Document modeling patterns (User, Stock)
│   ├── routes/                   # Clean network entry tracks routing endpoints to logic layers
│   ├── services/                 # Polling engines, background alerts, and AI connectors
│   ├── socket/                   # Controls socket broadcast intervals and event bindings
│   ├── uploads/                  # Temporary cache storage for image stream buffering
│   ├── app.js                    # Express application setup blueprint containing global configurations
│   ├── server.js                 # Infrastructure boot script. Initializes database connections
│   └── package.json              # Server script records and dependency definitions
└── README.md                     # Main Ecosystem Roadmap Document (This File)

```

---

## 🚀 Step-by-Step Local Setup & Installation

### Prerequisites

* Ensure you have **Node.js (v18+)** installed.
* Ensure you have a local instance of **MongoDB** running, or a **MongoDB Atlas** cloud connection string.

### 1. Repository Setup

Clone the project repository to your workspace and navigate inside the main folder structure:

```bash
git clone [https://github.com/YOUR_USERNAME/Stock-market-simulator.git](https://github.com/YOUR_USERNAME/Stock-market-simulator.git)
cd stock-market-simulator

```

### 2. Configure the Backend Server Engine

Move into the server subdirectory, build its dependency tree, setup environment variables, and run execution scripts:

```bash
cd backend
npm install

```

Create a `.env` file in the root of the `/backend` folder and add your credentials:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_cryptographic_jwt_token_secret
FINNHUB_API_KEY=your_finnhub_api_token
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_token
GEMINI_API_KEY=your_google_gemini_api_credential

```

Launch the backend development engine:

```bash
npm run dev

```

### 3. Configure the Frontend Client Layer

Open a secondary independent command shell terminal instance, step inside the client folder, install packages, and initiate the dev server:

```bash
cd stock-market-simulator/frontend
npm install
npm run dev

```

*The local dashboard runtime will deploy smoothly on `http://localhost:5173`.*

---

## 👥 Team 7 — Sunntek Summer Internship

This architecture was designed and delivered by Team 7 under the Sunntek Summer Internship program.

* **SACHIN KUMAR** (24EG105C50) — [GitHub Profile](https://github.com/SACHIN-619)
* **MOULYA REDDY** (24EG105A65) — [GitHub Profile](https://github.com/moulyareddy16-bot)
* **PRANEETH REDDY** (24EG105F24) — [GitHub Profile](https://github.com/Dyapa-Praneeth-Reddy)
* **PAVANI** (24EG105A56) — [GitHub Profile](https://github.com/pavani1280)
* **SHIVA PRASAD REDDY** (24EG109A56) — [GitHub Profile](https://github.com/shivaprasadreddy2006)

---

*Disclaimer: StockKing is exclusively an educational simulation platform. No real-world currency, legal equities, or physical market instruments are traded or utilized on this web application.*

```
