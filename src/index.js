import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import companiesRoutes from "./routes/companies.js";
import ordersRoutes from "./routes/orders.js";
import paymentsRoutes from "./routes/payments.js";

const app = express();

// ─── CORS ───────────────────────────────────────────────────────────
app.use(cors({ origin: config.clientUrl, credentials: true }));

// ─── Body parsing ───────────────────────────────────────────────────
// Note: /payments/webhook needs raw body — it handles its own parsing
app.use((req, res, next) => {
  if (req.path === "/payments/webhook") return next();
  express.json()(req, res, next);
});

// ─── Routes ─────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/companies", companiesRoutes);
app.use("/orders", ordersRoutes);
app.use("/payments", paymentsRoutes);

// ─── Health check ───────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "ReportIQ API",
    version: "1.0.0",
    status: "ok",
    endpoints: {
      auth: "POST /auth/register, POST /auth/login, GET /auth/me",
      companies: "GET /companies/search?q=..., GET /companies/:id",
      orders: "GET /orders, GET /orders/:id, GET /orders/:id/items/:itemId/download",
      payments: "POST /payments/checkout, POST /payments/webhook",
    },
  });
});

// ─── 404 ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint non trovato" });
});

// ─── Error handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Errore interno del server" });
});

// ─── Start ──────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\n🚀 ReportIQ API running on http://localhost:${config.port}\n`);
  console.log("  Routes:");
  console.log("  ├─ POST /auth/register");
  console.log("  ├─ POST /auth/login");
  console.log("  ├─ GET  /auth/me");
  console.log("  ├─ GET  /companies/search?q=...");
  console.log("  ├─ GET  /companies/:id");
  console.log("  ├─ GET  /orders");
  console.log("  ├─ POST /payments/checkout");
  console.log("  └─ POST /payments/webhook");
  console.log("");
});

export default app;
