import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
} from "../controllers/watchlistController.js";

const watchlistRouter = Router();

// All routes require trader authentication
watchlistRouter.get("/",            verifyToken("trader"), getWatchlist);
watchlistRouter.post("/",           verifyToken("trader"), addToWatchlist);
watchlistRouter.delete("/:symbol",  verifyToken("trader"), removeFromWatchlist);
watchlistRouter.delete("/",         verifyToken("trader"), clearWatchlist);

export default watchlistRouter;
