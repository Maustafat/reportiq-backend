import { Router } from "express";
import prisma from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── POST /orders/confirm-payment ───────────────────────────────────
// Called after Stripe redirect — marks latest pending order as completed
router.post("/confirm-payment", requireAuth, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { userId: req.userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    if (!order) {
      return res.json({ message: "Nessun ordine da confermare" });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "completed" },
      include: { items: true },
    });

    res.json({ order: updated });
  } catch (err) {
    console.error("Confirm payment error:", err);
    res.status(500).json({ error: "Errore nella conferma del pagamento" });
  }
});

// ─── GET /orders ────────────────────────────────────────────────────
// List all orders for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ orders });
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ error: "Errore nel recupero degli ordini" });
  }
});

// ─── GET /orders/:id ────────────────────────────────────────────────
// Get a single order with items
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    res.json({ order });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Errore nel recupero dell'ordine" });
  }
});

// ─── GET /orders/:id/items/:itemId/download ─────────────────────────
// Simulate report download (placeholder for real PDF generation)
router.get("/:id/items/:itemId/download", requireAuth, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.userId, status: "completed" },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Ordine non trovato o non completato" });
    }

    const item = order.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Report non trovato" });
    }

    // TODO: Generate real PDF report here
    // For now, return a placeholder JSON response
    res.json({
      message: "Download del report",
      report: {
        companyName: item.companyName,
        companyPiva: item.companyPiva,
        reportType: item.reportType,
        reportName: item.reportName,
        generatedAt: new Date().toISOString(),
        note: "Qui verrà generato il PDF reale con i dati dal Registro Imprese",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Errore nel download del report" });
  }
});

export default router;
