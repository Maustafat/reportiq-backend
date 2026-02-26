import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Required auth — rejects if no valid token
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token mancante" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Token non valido o scaduto" });
  }
}

// Optional auth — attaches userId if token present, continues either way
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), config.jwtSecret);
      req.userId = payload.sub;
    } catch {
      // invalid token — ignore
    }
  }
  next();
}

// Generate JWT for a user
export function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}
