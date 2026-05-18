# Step 1: Initialize Backend

npm init -y
npm install express mongoose cors dotenv
npm i express dotenv mongoose cookie-parser cors
npm install nodemon

# step 2: Basic express server : 

- backend/
 ├── models/
 ├── routes/
 ├── controllers/
 ├── middleware/
 ├── config/
 └── server.js
 
 
 
 # Step 3: MongoDB Connection:
 # Step 4: Create Schemas
     user schema
	 Stock Schema
	 Portfolio Schema
	
	
# step 5: routes + Controllers
    Example: Buy Stock API

    - A. RATE LIMITING

Prevent API abuse.

Install:

npm install express-rate-limit

# PROFESSIONAL STOCK CACHE SYSTEM
  - npm install node-cache
# multer is used for file uploads.
  - npm install multer

# Now real Gemini integration.

Install Google SDK:

- npm install @google/generative-ai
  

# 1. Install new packages
cd stock-market-simulator/backend
npm install helmet express-rate-limit
npm install groq-sdk @huggingface/inference



watchlist alert system (DB schema → backend polling → socket push → frontend notification below:-
- 🚀 New Features & Enhancements
    1. Real-Time Watchlist Alerts (The "Bell")
    Dynamic Notification Bell: A new high-premium bell icon added to the Navbar.
    Push Notifications: When an AI signal changes for a stock you're watching (e.g., HOLD → BUY), the backend pushes a real-time alert via Socket.io.
    Visual Cues: Red unread badge, pulsing animations, and a subtle audio cue for new alerts.
    Deep Linking: Each alert includes a direct link to the stock's chart view (/stocks/:symbol) for immediate action.
2. Advanced Watchlist CRUD
    Manual Control: Add any ticker (e.g., NVDA, TSLA) to your watchlist, even if you don't own it.
    Automatic Sync: The UI automatically fetches the latest AI signals, sentiments, and reasoning from the database.
    Cleanup: Individual removal or "Clear All" functionality to manage your monitoring list.
3. Backend Intelligence (Always-On)
    Signal Polling Service: A new background service polls market data every 3 minutes.
    Deterministic AI Engine: Even if external AI APIs are down, the system calculates RSI-based signals to ensure your alerts are always accurate.
    Targeted Messaging: Using a userId socket map, alerts are sent privately only to the user watching that specific stock.
4. UI/UX Refinement
    Anchor Tag Links: Ticker symbols in both the dashboard and the notification dropdown are now clickable links that take you straight to the stock's detail page.
    Freshness Indicators: Each watchlist item shows how long ago it was last analyzed (e.g., "Just now", "5m ago").