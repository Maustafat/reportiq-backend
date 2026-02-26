import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

// ─── POST /auth/register ────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e password sono obbligatori" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "La password deve avere almeno 6 caratteri" });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      return res.status(409).json({ error: "Questa email è già registrata" });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hash, name: name || null },
    });

    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ─── POST /auth/login ───────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e password sono obbligatori" });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// ─── GET /auth/me ───────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

export default router;
