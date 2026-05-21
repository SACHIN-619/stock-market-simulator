import jwt from "jsonwebtoken";
import { config } from "dotenv";
const { verify } = jwt;
config();

export const verifyToken = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // 1. Try httpOnly cookie first
      let token = req.cookies?.token;

      // 2. Fallback: Authorization: Bearer <token>
      if (!token) {
        const authHeader = req.headers["authorization"] || req.headers["Authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.slice(7).trim();
        }
      }

      // 3. Fallback: x-auth-token header
      if (!token) {
        const xToken = req.headers["x-auth-token"];
        if (xToken) token = xToken.trim();
      }

      if (!token) {
        return res.status(401).json({ message: "Please login first" });
      }

      const secret = (process.env.SECRET_KEY || "").trim();
      if (!secret) {
        console.error("SECRET_KEY is not set!");
        return res.status(500).json({ message: "Server configuration error" });
      }

      let decodedToken;
      try {
        decodedToken = verify(token, secret);
      } catch (jwtErr) {
        console.error("JWT verify failed:", jwtErr.message);
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      if (!allowedRoles.includes(decodedToken.role)) {
        return res.status(403).json({ message: "You are not authorized" });
      }

      req.user = decodedToken;
      next();
    } catch (err) {
      console.error("verifyToken error:", err.message);
      res.status(401).json({ message: "Invalid token" });
    }
  };
};