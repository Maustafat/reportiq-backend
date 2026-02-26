import { Router } from "express";

const router = Router();

// ─── Mock company data (replace with real Registro Imprese API later) ──
const COMPANIES = [
  { id: "1", name: "TechnoVerde S.r.l.", cf: "02345678901", piva: "IT02345678901", city: "Milano", province: "MI", address: "Via della Tecnologia 42", atecoCode: "62.01", atecoDesc: "Sviluppo software", legalForm: "S.R.L.", capital: 500000, founded: "2018-03-15", employees: 45, revenue: 3200000, profit: 480000, assets: 2100000, pec: "info@technoverde.pec.it", status: "Attiva" },
  { id: "2", name: "Costruzioni Rossi S.p.A.", cf: "01234567890", piva: "IT01234567890", city: "Roma", province: "RM", address: "Viale dell'Edilizia 88", atecoCode: "41.20", atecoDesc: "Costruzione edifici", legalForm: "S.P.A.", capital: 2000000, founded: "2005-07-22", employees: 120, revenue: 15000000, profit: 1200000, assets: 8500000, pec: "costruzionirossi@pec.it", status: "Attiva" },
  { id: "3", name: "Alimentari del Sud S.r.l.", cf: "03456789012", piva: "IT03456789012", city: "Napoli", province: "NA", address: "Corso Garibaldi 156", atecoCode: "10.71", atecoDesc: "Produzione pane e pasticceria", legalForm: "S.R.L.", capital: 150000, founded: "2012-11-03", employees: 22, revenue: 1800000, profit: 210000, assets: 950000, pec: "alimentaridelsud@pec.it", status: "Attiva" },
  { id: "4", name: "Green Energy Italia S.p.A.", cf: "04567890123", piva: "IT04567890123", city: "Torino", province: "TO", address: "Piazza Rinnovabile 7", atecoCode: "35.11", atecoDesc: "Produzione energia elettrica", legalForm: "S.P.A.", capital: 5000000, founded: "2010-01-18", employees: 85, revenue: 22000000, profit: 3100000, assets: 18000000, pec: "greenenergy@pec.it", status: "Attiva" },
  { id: "5", name: "Studio Legale Bianchi", cf: "05678901234", piva: "IT05678901234", city: "Firenze", province: "FI", address: "Via dei Tribunali 23", atecoCode: "69.10", atecoDesc: "Attività degli studi legali", legalForm: "Studio Associato", capital: 50000, founded: "2015-06-10", employees: 8, revenue: 650000, profit: 280000, assets: 320000, pec: "studiobianchi@pec.it", status: "Attiva" },
  { id: "6", name: "MilanoFintech S.r.l.", cf: "06789012345", piva: "IT06789012345", city: "Milano", province: "MI", address: "Via Finanza 12", atecoCode: "64.19", atecoDesc: "Intermediazione monetaria", legalForm: "S.R.L.", capital: 1000000, founded: "2020-09-01", employees: 30, revenue: 4500000, profit: 890000, assets: 3200000, pec: "milanofintech@pec.it", status: "Attiva" },
];

// ─── GET /companies/search?q=... ────────────────────────────────────
router.get("/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();

  if (!q) {
    return res.json({ results: COMPANIES.slice(0, 4), total: 4 });
  }

  const results = COMPANIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.cf.includes(q) ||
      c.piva.includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.atecoDesc.toLowerCase().includes(q)
  );

  res.json({ results, total: results.length });
});

// ─── GET /companies/:id ─────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const company = COMPANIES.find((c) => c.id === req.params.id);

  if (!company) {
    return res.status(404).json({ error: "Azienda non trovata" });
  }

  res.json({ company });
});

export default router;
