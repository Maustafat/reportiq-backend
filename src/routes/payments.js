import { Router } from "express";
import express from "express";
import stripe from "../lib/stripe.js";
import prisma from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";

const router = Router();

// Report type pricing (cents)
const REPORT_PRICES = {
  basic: { name: "Report Base", price: 2990 },
  financial: { name: "Report Finanziario", price: 7990 },
  full: { name: "Report Completo", price: 14990 },
};

// ─── POST /payments/checkout ────────────────────────────────────────
// Creates a Stripe Checkout session and a pending order
router.post("/checkout", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: "Pagamenti non configurati. Imposta STRIPE_SECRET_KEY." });
    }

    const { items } = req.body;
    // items: [{ companyId, companyName, companyPiva, reportType }]

    if (!items?.length) {
      return res.status(400).json({ error: "Il carrello è vuoto" });
    }

    // Validate and build line items
    const lineItems = [];
    const orderItems = [];

    for (const item of items) {
      const reportDef = REPORT_PRICES[item.reportType];
      if (!reportDef) {
        return res.status(400).json({ error: `Tipo report non valido: ${item.reportType}` });
      }

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${reportDef.name} — ${item.companyName}`,
            description: `P.IVA: ${item.companyPiva}`,
          },
          unit_amount: reportDef.price,
        },
        quantity: 1,
      });

      orderItems.push({
        companyId: item.companyId,
        companyName: item.companyName,
        companyPiva: item.companyPiva,
        reportType: item.reportType,
        reportName: reportDef.name,
        price: reportDef.price,
      });
    }

    const total = orderItems.reduce((sum, i) => sum + i.price, 0);

    // Create pending order in DB
    const order = await prisma.order.create({
      data: {
        userId: req.userId,
        status: "pending",
        total,
        items: { create: orderItems },
      },
    });

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: { orderId: order.id },
      success_url: `${config.clientUrl}?page=dashboard&payment=success`,
      cancel_url: `${config.clientUrl}?page=cart&payment=cancelled`,
    });

    // Save Stripe session ID to order
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    res.json({ url: session.url, sessionId: session.id, orderId: order.id });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Errore nella creazione del pagamento" });
  }
});

// ─── POST /payments/webhook ─────────────────────────────────────────
// Stripe sends events here — must use raw body
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe) return res.status(503).send("Stripe not configured");

    let event;

    try {
      if (config.stripeWebhookSecret) {
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
      } else {
        // Development: trust the payload without verification
        event = JSON.parse(req.body.toString());
      }
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "completed",
            stripePaymentId: session.payment_intent,
          },
        });
        console.log(`✅ Order ${orderId} completed`);
      }
    }

    res.json({ received: true });
  }
);

export default router;
