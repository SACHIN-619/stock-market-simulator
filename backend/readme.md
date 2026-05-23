# ⚙️ StockKing — Backend Core API & WebSocket Engine

[![Runtime](https://img.shields.io/badge/Runtime-Node.js%20v18+-339933?logo=node.js)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/Framework-Express.js%20v5-000000?logo=express)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Mongoose-47A248?logo=mongodb)](https://mongoosejs.com/)

This directory houses the server-side architecture powering the **StockKing** ecosystem. Engineered as an asynchronous REST API coupled with a high-frequency WebSocket distribution gateway, this system executes mock trading orders, monitors active database states, coordinates multi-engine AI analytics, and streams live market ticker simulations.

---

## 🎛️ Server Orchestration Architecture

* **Runtime Initialization (`server.js`):** The structural application entry point. It loads process environment parameters (`.env`), sets up secure handshakes with the MongoDB Atlas database cluster, mounts the HTTP framework server layer, and initializes permanent asynchronous system intervals (such as the 5-second stock price broadcaster and the 60-second alert validation engine).
* **Application Lifecycle Blueprint (`app.js`):** Prepares global Express configurations. It integrates web infrastructure dependencies, configures cross-origin security paths (CORS), activates cookie parsers, mounts structural defensive header shields, and splits core network requests across 10 modular sub-routes.

---

## 🛡️ Core Dependencies & Production Package Usage

### API Transport, Speed Limiting, and Security Suites
* **`express` (v5.2.1):** Next-generation, minimalist web routing layer processing asynchronous inbound payload streams across isolated router files.
* **`cors` (v2.8.6):** Implements automated network safety barriers, constraining resource validation requests exclusively to verified frontend clients (e.g., your local Vite portal or deployed Vercel apps).
* **`helmet` (v8.1.0):** Automatically hooks comprehensive security parameters to outgoing HTTP response headers to limit clickjacking exploits and data-sniffing vulnerabilities.
* **`express-rate-limit` (v8.5.1):** Mitigates system abuse by tracking client IP paths across three distinct operational speed limit configurations:
  * *General Data Requests:* Maximum of 100 requests per minute window.
  * *Authentication Routes (`/api/auth`):* Restricted to 20 requests per minute window to prevent brute-force attacks.
  * *Resource-Heavy AI Routes (`/api/ai`):* Hard capped at 10 requests per minute window to prevent quota saturation.

### Identity Management & Encrypted Session Buffers
* **`jsonwebtoken` (v9.0.3):** Signs and issues encrypted web tokens (JWT) tracking specific user access criteria.
* **`cookie-parser` (v1.4.7):** Automatically parses string cookies carried within incoming request fields to make them accessible inside protected auth middleware chains.
* **`bcryptjs` (v3.0.3):** Cryptographically hashes user passwords before committing changes to database records, ensuring lookups match without exposing raw text strings.

### High-Frequency Streams & Resource Cache Pools
* **`socket.io` (v4.8.3):** Powers persistent full-duplex TCP broadcast pipelines. Manages data event hooks to deliver live stock ticks downstream to trading interfaces every 5 seconds.
* **`node-cache` (v5.1.2):** High-speed server-side memory key-value repository wrapped by `cacheService.js`. It intercepts outbound financial calls and supplies cached responses before querying paid external platforms, cutting processing latencies and preserving API quotas.

### Cloud Files and Storage Extensions
* **`multer` (v2.1.1):** Multi-part form-data data parsing framework that captures incoming binary streams during account modification configurations.
* **`cloudinary` & `multer-storage-cloudinary` (v2.10.0 / v2.2.1):** Bridges local file buffers straight to permanent global CDN asset buckets to process user avatar changes instantly.

### Advanced Multimodal AI Frameworks
* **`@google/generative-ai` (v0.24.1):** Official SDK linking with Gemini models to evaluate sector metrics and provide real-time suggestions regarding user watchlists and dashboard states.
* **`groq-sdk` & `@huggingface/inference` (v1.2.0 / v4.13.15):** High-throughput secondary fallback channels providing alternative LLM computational pipelines if the primary Google token meets external rate limits.

---

## 📊 Endpoints & API Architecture Map

The system separates processing tasks into individual route targets verified against specific controller behaviors:

| Target Endpoint Tree | Route Script File | Assigned Controller Module | Access Level / Operational Parameters |
| :--- | :--- | :--- | :--- |
| `/api/auth` | `authRoute.js` | `authController.js` | **Public** — Manages User Registration, Encrypted Logins, and Token Issuance. |
| `/api/stocks` | `stockRoute.js` | `stockController.js` | **Protected** — Retrieves core active ticker information and quote arrays. |
| `/api/transactions` | `transactionRoute.js` | `transactionController.js` | **Protected** — Verifies trade parameters, cash bounds, and commits ledger history. |
| `/api/portfolio` | `portfolioRoute.js` | `portfolioController.js` | **Protected** — Aggregates holdings valuation models and sector splits. |
| `/api/historical` | `historicalRoute.js` | `historicalController.js` | **Protected** — Pulls historical data logs mapped to external graphs. |
| `/api/alerts` | `alertRoute.js` | `alertController.js` | **Protected** — Sets up technical price configurations for active user indicators. |
| `/api/users` | `userRoute.js` | `userController.js` | **Protected** — Handles personal profile configurations and Multer upload actions. |
| `/api/ai` | `aiRoute.js` & `aiChatRoute.js`| `aiController.js` & `aiChatController.js` | **Rate-Limited** — Generates portfolio suggestions and fires automated assistance text. |
| `/trader-api` | `leaderboardRoute.js` | `leaderboardController.js` | **Protected** — Ranks active traders based on overall mock equity gains. |
| `/api/admin/activity` | `adminActivityRoute.js` | `adminActivityController.js` | **Admin Only** — Grants access to infrastructure activities and global server diagnostic checks. |

---

## 📁 Backend Directory Mapping

```text
backend/
├── config/                       # Core configuration maps and system connection managers
├── controllers/                  # Core functional logic modules (Functional Business Rules)
│   ├── adminActivityController.js # Aggregates ecosystem runtime tracking data for administrators
│   ├── alertController.js         # Sets up, removes, or clears target asset watchlist monitors
│   ├── authController.js          # Handles security registrations, JWT tokens, and login tracking
│   ├── historicalController.js    # Communicates with Alpha Vantage to structure time chart arrays
│   ├── leaderboardController.js   # Executes database queries to rank system profiles
│   ├── portfolioController.js     # Calculates active holdings value and sector split balances
│   ├── stockController.js         # Coordinates live asset tickers and summary grids
│   ├── transactionController.js   # Validates trade criteria and logs permanent order history
│   ├── userController.js          # Updates profile attributes and structures database records
│   └── watchlistController.js     # Updates user observation indicators and targets
├── middleware/                   # Request interceptors verifying session constraints
├── models/                       # Strict Mongoose collection validation schemas (UserModel, StockModel)
├── routes/                       # Network route frameworks linking request paths to controllers
├── services/                     # Background workers and third-party data integrations
│   ├── realtimeService.js        # Pulls live metrics from Finnhub and simulates price trends
│   ├── finnhubService.js         # Connects to external Finnhub servers for real-time stock quotes
│   ├── alertService.js           # Independent 60s daemon that evaluates custom user alert targets
│   ├── cacheService.js           # Coordinates Node-Cache interactions within memory limits
│   └── ai/                       # Direct integrations processing Google Gemini prompt payloads
├── socket/                       # Direct websocket pipeline configurations
│   └── socketServer.js           # Handles high-frequency 5-second room-based stock pushes
├── uploads/                      # Temporary system storage buffering image streams
├── .env                          # Local environment variable definitions (Excluded from source logs)
├── app.js                        # System framework blueprint configuring middleware layers
└── server.js                     # System boot loader initializing database and infrastructure connections
⚙️ Asynchronous Watchlist Monitoring Engine (The "Bell")The backend architecture incorporates a premium, background automation loop that coordinates data fetches with immediate client pushes:Background Service Polling: An independent background daemon inside alertService.js tracks asset variations on a continuous 3-minute cycle.Deterministic Technical Fallbacks: If external API gateways hit connection timeouts or limits, an internal mathematical engine recalculates indicators like the Relative Strength Index (RSI) locally using database records to keep alert metrics accurate.Targeted Room Routing: When a stock tracking signal shifts states (e.g., HOLD $\rightarrow$ BUY), the module bypasses public global broadcasts. It references a specialized internal userId socket map to locate the user watching that ticker, and transmits a private socket update directly to their terminal.Client Notification Injection: The message reaches the client header layer (Navbar.jsx), triggering a red badge indicator along with deep routing anchor tags to make the notification fully actionable.🚀 Local Installation Steps1. Set Up Workspace FolderOpen a command shell window and change directories into the backend configuration workspace:Bashcd stock-market-simulator/backend
2. Build Project Package TreeCompile your structural configuration assets and compile local dependency files:Bashnpm install
3. Establish System Variables (.env)Create an isolated .env configuration file in the root of the /backend folder and define your platform tokens:Code snippetPORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_cryptographic_jwt_token_secret
FINNHUB_API_KEY=your_finnhub_api_token
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_token
GEMINI_API_KEY=your_google_gemini_api_credential
4. Running the Application ScriptsLaunch Local Dev Environment (With Nodemon auto-reload loop):Bashnpm run dev
The core API gateway activates locally on http://localhost:5000.Launch Production Server Standby Profile:Bashnpm start
Disclaimer: StockKing is strictly an educational simulation platform. All transactions, balances, order processes, and valuations are virtual sandbox testing values.
***



