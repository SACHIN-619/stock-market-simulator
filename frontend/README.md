
---

```markdown
#  StockKing — React Frontend UI Engine

[![UI Framework](https://react.dev/)
[![Build Tool](https://vite.dev/)
[![Styling](https://tailwindcss.com/)

This directory houses the client-side single-page application (SPA) architecture for **StockKing**. The interface delivers an institutional-grade trading dashboard featuring real-time financial graphing canvases, an interactive order terminal, multi-sector portfolio allocation matrices, and a predictive AI suggestions hub.

---

## Connected Ecosystem Endpoints
When executing in a standard local deployment environment, the client utilizes the following target configurations:
* **Client Local Server:** `http://localhost:5173`
* **Target REST API Gateway:** `http://localhost:5000`
* **Target WebSocket Pipe:** `ws://localhost:5000`

---

##  Advanced Tech Stack & Packages Breakdown

Our production client layer uses an optimized set of visual, real-time packages designed for fast data renders and modern user interactions:

### Core View & State Architecture
* **`react` & `react-dom` (v19.2.5):** Powers declarative component structures and virtual DOM reconciliation patterns.
* **`react-router-dom` (v7.15.0):** Manages single-page client routing pathways dynamically across structural views without triggering heavy full-page browser refreshes.
* **`context/AuthContext.jsx`:** The core state machine monitoring user authentication status, custom session keys, and global profile states.

### Data Transport & Live Pipes
* **`socket.io-client` (v4.8.3):** Establishes and manages a persistent full-duplex socket pipe to intercept 5-second backend streaming market updates.
* **`axios` (v1.16.0):** Standardized transport instance (`service/api.js`) featuring pre-configured global base URLs, error catchers, and cross-origin cookie session adjustments.

### Financial Charting & Layout Engines
* **`lightweight-charts` (v5.2.0):** Financial-grade, ultra-high-performance rendering engine from TradingView utilized inside `StockDetails.jsx` to trace rapid pricing curves.
* **`recharts` (v3.8.1):** SVG-driven data visualization charts used to track multi-day stock price timelines and user equity growth history.
* **`chart.js` & `react-chartjs-2` (v4.5.1 / v5.3.1):** Renders responsive circular pie and breakdown charts to show real-time multi-sector asset concentrations and wallet cash vs. equity balances.

### Design & Interface Assets
* **`tailwindcss` & `@tailwindcss/vite` (v4.2.4):** Next-generation styling architecture compile-optimized directly inside Vite configurations to handle complex UI layouts without separate CSS spreadsheets.
* **`lucide-react` (v1.14.0):** Scalable vector icon maps providing interface markers for trade operations and navigation flags.

---

## 📁 Frontend Directory Mapping

```text
frontend/
├── dist/                         # Compiled and minified production build target files
├── public/                       # Unprocessed static client-side browser files
└── src/                          # Core UI Application Source Space
    ├── assets/                   # Client media files, local branding images, and logs
    ├── context/                  # Global Context State Providers
    │   └── AuthContext.jsx       # Intercepts user sessions and global wallet syncs
    ├── service/                  # Network layer abstracting axios calls
    │   ├── api.js                # Core Axios client instance with cookie credentials
    │   ├── stockService.js       # Outbound calls pulling down core asset details
    │   └── tradeService.js       # Dispatches immediate buy/sell execution payloads
    ├── socket/                   # Client WebSocket setups
    │   └── socket.js             # Initialized Socket.io listener instance
    ├── components/               # View UI layouts and workspace sub-panels
    │   ├── Home.jsx              # Static high-premium marketing landing page
    │   ├── Navbar.jsx            # Dynamic upper hub containing profile trackers & Alert Bell
    │   ├── Stocks.jsx            # Interactive market grid showing trackable tickers
    │   ├── StockDetails.jsx      # Technical data view housing trading execution boards
    │   ├── Portfolio.jsx         # Breakdown panel tracing active equity assets held
    │   ├── Dashboard.jsx         # Performance telemetry showing complete financial summaries
    │   ├── Leaderboard.jsx       # Global ranking indexes showing total user performance
    │   ├── Transactions.jsx      # Audit logs displaying complete trade histories
    │   ├── Profile.jsx           # User settings, password management, and file uploads
    │   ├── AdminDashboard.jsx    # System administrative access control terminal
    │   ├── Signin.jsx            # Session credential entry view
    │   ├── Register.jsx          # Security enrollment onboarding panel
    │   └── ai/                   # AI sub-panels processing predictive Gemini summaries
    ├── App.jsx                   # Central routing manifest organizing path structures
    ├── index.css                 # Global styles integrating Tailwind directives
    └── main.jsx                  # Direct mounting entry script initializing React

```

---

##  UI Mechanics: The Real-Time Watchlist Notification Engine

StockKing features a premium, interactive real-time notification mechanism inside the main layout headers (`Navbar.jsx`):

1. **Continuous Sync:** The `StockDetails.jsx` dashboard listens continuously for incoming `stockUpdates` socket channels to keep price lines moving dynamically.
2. **The Notification "Bell":** A specialized notification icon resides in the main client header layer. When background system services track an evaluation change on a watchlisted ticker, the backend pushes an event targeting that exact socket.
3. **Responsive Visual Cues:** The UI instantly activates a pulsing red badge animation alongside subtle notification audio signals without altering the user's active page state.
4. **Deep Linking Actions:** Opening the alert tray reveals structural clickable dropdown list lines. Selecting an asset utilizes deep routing paths (`/stocks/:symbol`) to take the trader directly to that asset's TradingView canvas for instant trade execution.

---

##  Local Deployment Steps

### 1. Set Up Environment Workspace

Ensure you have successfully completed the main directory configuration, and open a dedicated command terminal inside the frontend subfolder:

```bash
cd stock-market-simulator/frontend

```

### 2. Install Project Packages

Execute the package manager script to compile your local dependency maps:

```bash
npm install

```

### 3. Execution Command Scripts

* **Launch Local Dev Environment:**
```bash
npm run dev

```


*The development environment compiles and opens locally on `http://localhost:5173`.*
* **Trigger Quality & Linter Audits:**
```bash
npm run lint

```


* **Compile Optimized Production Static Bundles:**
```bash
npm run build

```


*Generates compressed, deployment-ready assets directly within the `/dist` directory.*

---

*Disclaimer: StockKing is strictly an educational application. All trades, transactions, balances, and analytics are simulated virtual sandbox data.*

```

